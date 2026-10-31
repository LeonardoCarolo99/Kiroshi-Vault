"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "firebase/auth";
import type { BuyListEntry, BuyListPriority, Deck, MatchRecord } from "@/lib/types";
import { uid } from "@/lib/utils";
import { loadVaultFromCloud, saveVaultToCloud } from "@/lib/sync";
import type { Friend } from "@/lib/types";

type DeckTarget = "legend" | "main" | "sideboard";

type SyncStatus = "idle" | "syncing" | "error" | "synced";

type VaultState = {
  collection: Record<string, number>;
  decks: Deck[];
  matches: MatchRecord[];
  buyList: BuyListEntry[];
  friends: import("@/lib/types").Friend[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  adjustCollection: (cardId: string, delta: number) => void;
  setCollectionCount: (cardId: string, count: number) => void;
  createDeck: (name?: string, description?: string) => string;
  updateDeck: (id: string, patch: Partial<Omit<Deck, "id" | "createdAt">>) => void;
  deleteDeck: (id: string) => void;
  duplicateDeck: (id: string) => string | null;
  toggleLegend: (deckId: string, cardId: string) => void;
  adjustDeckCard: (deckId: string, cardId: string, target: DeckTarget, delta: number) => void;
  addMatch: (match: Omit<MatchRecord, "id" | "createdAt">) => string;
  updateMatch: (id: string, patch: Partial<Omit<MatchRecord, "id" | "createdAt">>) => void;
  deleteMatch: (id: string) => void;
  // Buy List
  addBuyListEntry: (entry: { cardId: string; quantity?: number; priority?: BuyListPriority; notes?: string }) => string;
  updateBuyListEntry: (id: string, patch: Partial<Omit<BuyListEntry, "id" | "createdAt">>) => void;
  removeBuyListEntry: (id: string) => void;
  adjustBuyListObtained: (id: string, delta: number) => void;
  clearObtainedBuyList: () => void;
  importData: (payload: { collection?: Record<string, number>; decks?: Deck[]; matches?: MatchRecord[]; buyList?: BuyListEntry[]; friends?: import("@/lib/types").Friend[] }) => void;
  resetAll: () => void;
  // Friends
  addFriend: (friend: import("@/lib/types").Friend) => void;
  removeFriend: (uid: string) => void;
  // Cloud sync
  user: User | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  setUser: (user: User | null) => void;
  syncToCloud: () => Promise<void>;
  syncFromCloud: (overwrite?: boolean) => Promise<void>;
};

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleCloudSync(get: () => VaultState) {
  const state = get();
  if (!state.user) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    void state.syncToCloud();
  }, 1000);
}

const now = () => new Date().toISOString();

function cleanCollection(collection: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(collection)
      .map(([id, count]) => [id, Math.max(0, Math.floor(count))] as const)
      .filter(([, count]) => count > 0),
  );
}

function adjustRecord(record: Record<string, number>, cardId: string, delta: number): Record<string, number> {
  const next = Math.max(0, (record[cardId] ?? 0) + delta);
  const copy = { ...record };
  if (next === 0) delete copy[cardId];
  else copy[cardId] = next;
  return copy;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      collection: {},
      decks: [],
      matches: [],
      buyList: [],
      friends: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      user: null,
      syncStatus: "idle",
      lastSyncedAt: null,
      setUser: (user) => {
        set({ user });
        if (user) {
          void get().syncFromCloud(false);
        }
      },

      syncToCloud: async () => {
        const state = get();
        if (!state.user) return;
        set({ syncStatus: "syncing" });
        try {
          await saveVaultToCloud(state.user.uid, {
            collection: state.collection,
            decks: state.decks,
            matches: state.matches,
            buyList: state.buyList,
            friends: state.friends,
          });
          set({ syncStatus: "synced", lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error("Failed to sync to cloud", error);
          set({ syncStatus: "error" });
        }
      },

      syncFromCloud: async (overwrite = true) => {
        const state = get();
        if (!state.user) return;
        set({ syncStatus: "syncing" });
        try {
          const cloud = await loadVaultFromCloud(state.user.uid);
          if (cloud) {
            if (overwrite) {
              set({
                collection: cleanCollection(cloud.collection),
                decks: cloud.decks,
                matches: cloud.matches,
                buyList: Array.isArray(cloud.buyList) ? cloud.buyList : [],
                friends: Array.isArray(cloud.friends) ? cloud.friends : [],
              });
            } else {
              const local = get();
              if (local.decks.length === 0 && local.matches.length === 0 && Object.keys(local.collection).length === 0 && local.buyList.length === 0) {
                set({
                  collection: cleanCollection(cloud.collection),
                  decks: cloud.decks,
                  matches: cloud.matches,
                  buyList: Array.isArray(cloud.buyList) ? cloud.buyList : [],
                  friends: Array.isArray(cloud.friends) ? cloud.friends : [],
                });
              }
            }
          }
          set({ syncStatus: "synced", lastSyncedAt: new Date().toISOString() });
          await get().syncToCloud();
        } catch (error) {
          console.error("Failed to sync from cloud", error);
          set({ syncStatus: "error" });
        }
      },

      adjustCollection: (cardId, delta) => {
        set((state) => ({
          collection: adjustRecord(state.collection, cardId, delta),
        }));
        scheduleCloudSync(get);
      },

      setCollectionCount: (cardId, count) => {
        set((state) => ({
          collection: cleanCollection({ ...state.collection, [cardId]: count }),
        }));
        scheduleCloudSync(get);
      },

      createDeck: (name = "Untitled Deck", description = "") => {
        const id = uid("deck");
        const timestamp = now();
        const deck: Deck = {
          id,
          name,
          description,
          legendIds: [],
          cards: {},
          sideboard: {},
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => ({ decks: [deck, ...state.decks] }));
        scheduleCloudSync(get);
        return id;
      },

      updateDeck: (id, patch) => {
        set((state) => ({
          decks: state.decks.map((deck) =>
            deck.id === id ? { ...deck, ...patch, updatedAt: now() } : deck,
          ),
        }));
        scheduleCloudSync(get);
      },

      deleteDeck: (id) => {
        set((state) => ({
          decks: state.decks.filter((deck) => deck.id !== id),
          matches: state.matches.map((match) =>
            match.deckId === id ? { ...match, deckId: "" } : match,
          ),
        }));
        scheduleCloudSync(get);
      },

      duplicateDeck: (id) => {
        const source = get().decks.find((deck) => deck.id === id);
        if (!source) return null;
        const newId = uid("deck");
        const timestamp = now();
        const copy: Deck = {
          ...source,
          id: newId,
          name: `${source.name} (copy)`,
          cards: { ...source.cards },
          sideboard: { ...source.sideboard },
          legendIds: [...source.legendIds],
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => ({ decks: [copy, ...state.decks] }));
        scheduleCloudSync(get);
        return newId;
      },

      toggleLegend: (deckId, cardId) => {
        set((state) => ({
          decks: state.decks.map((deck) => {
            if (deck.id !== deckId) return deck;
            const exists = deck.legendIds.includes(cardId);
            const legendIds = exists
              ? deck.legendIds.filter((id) => id !== cardId)
              : deck.legendIds.length >= 3
                ? deck.legendIds
                : [...deck.legendIds, cardId];
            return { ...deck, legendIds, updatedAt: now() };
          }),
        }));
        scheduleCloudSync(get);
      },

      adjustDeckCard: (deckId, cardId, target, delta) => {
        set((state) => ({
          decks: state.decks.map((deck) => {
            if (deck.id !== deckId) return deck;
            if (target === "legend") {
              const exists = deck.legendIds.includes(cardId);
              if (delta > 0 && !exists && deck.legendIds.length < 3) {
                const updated = { ...deck, legendIds: [...deck.legendIds, cardId], updatedAt: now() };
                scheduleCloudSync(get);
                return updated;
              }
              if (delta < 0 && exists) {
                const updated = {
                  ...deck,
                  legendIds: deck.legendIds.filter((id) => id !== cardId),
                  updatedAt: now(),
                };
                scheduleCloudSync(get);
                return updated;
              }
              return deck;
            }
            const field = target === "sideboard" ? "sideboard" : "cards";
            const updated = { ...deck, [field]: adjustRecord(deck[field], cardId, delta), updatedAt: now() };
            scheduleCloudSync(get);
            return updated;
          }),
        }));
      },

      addMatch: (match) => {
        const id = uid("match");
        const record: MatchRecord = { ...match, id, createdAt: now() };
        set((state) => ({ matches: [record, ...state.matches] }));
        scheduleCloudSync(get);
        return id;
      },

      updateMatch: (id, patch) => {
        set((state) => ({
          matches: state.matches.map((match) => (match.id === id ? { ...match, ...patch } : match)),
        }));
        scheduleCloudSync(get);
      },

      deleteMatch: (id) => {
        set((state) => ({ matches: state.matches.filter((match) => match.id !== id) }));
        scheduleCloudSync(get);
      },

      addBuyListEntry: (entry) => {
        const id = uid("buy");
        const timestamp = now();
        const record: BuyListEntry = {
          id,
          cardId: entry.cardId,
          quantity: Math.max(1, Math.floor(entry.quantity ?? 1)),
          priority: entry.priority ?? "normal",
          notes: entry.notes ?? "",
          obtained: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => ({ buyList: [record, ...state.buyList] }));
        scheduleCloudSync(get);
        return id;
      },

      updateBuyListEntry: (id, patch) => {
        set((state) => ({
          buyList: state.buyList.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: now() } : item,
          ),
        }));
        scheduleCloudSync(get);
      },

      removeBuyListEntry: (id) => {
        set((state) => ({ buyList: state.buyList.filter((item) => item.id !== id) }));
        scheduleCloudSync(get);
      },

      adjustBuyListObtained: (id, delta) => {
        set((state) => ({
          buyList: state.buyList.map((item) => {
            if (item.id !== id) return item;
            const next = Math.max(0, Math.min(item.quantity, (item.obtained ?? 0) + delta));
            return { ...item, obtained: next, updatedAt: now() };
          }),
        }));
        scheduleCloudSync(get);
      },

      clearObtainedBuyList: () => {
        set((state) => ({
          buyList: state.buyList.filter((item) => (item.obtained ?? 0) < item.quantity),
        }));
        scheduleCloudSync(get);
      },

      importData: (payload) => {
        set((state) => ({
          collection: payload.collection ? cleanCollection(payload.collection) : state.collection,
          decks: Array.isArray(payload.decks) ? payload.decks : state.decks,
          matches: Array.isArray(payload.matches) ? payload.matches : state.matches,
          buyList: Array.isArray(payload.buyList) ? payload.buyList : state.buyList,
          friends: Array.isArray((payload as any).friends) ? (payload as any).friends : state.friends,
        }));
        scheduleCloudSync(get);
      },

      resetAll: () => {
        set({ collection: {}, decks: [], matches: [], buyList: [], friends: [] });
        scheduleCloudSync(get);
      },

      addFriend: (friend) => {
        set((state) => {
          if (state.friends.some((f) => f.uid === friend.uid)) return state;
          return { friends: [{ uid: friend.uid, addedAt: friend.addedAt }, ...state.friends] };
        });
        scheduleCloudSync(get);
      },

      removeFriend: (uid) => {
        set((state) => ({ friends: state.friends.filter((f) => f.uid !== uid) }));
        scheduleCloudSync(get);
      },
    }),
    {
      name: "kiroshi-vault-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        collection: state.collection,
        decks: state.decks,
        matches: state.matches,
        buyList: state.buyList,
        friends: state.friends,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
