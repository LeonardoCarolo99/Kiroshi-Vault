"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "firebase/auth";
import type { BuyListEntry, BuyListPriority, BuyList, Deck, MatchRecord, Friend, Tournament, TournamentPairing } from "@/lib/types";
import { generateFriendCode, uid } from "@/lib/utils";
import { loadVaultFromCloud, saveVaultToCloud } from "@/lib/sync";

type DeckTarget = "legend" | "main" | "sideboard";

type SyncStatus = "idle" | "syncing" | "error" | "synced";

type VaultState = {
  collection: Record<string, number>;
  decks: Deck[];
  matches: MatchRecord[];
  tournaments: Tournament[];
  buyLists: BuyList[];
  buyList: BuyListEntry[];
  friends: Friend[];
  friendCode: string | null;
  avatarId: string | null;
  meleeAccount: import("@/lib/types").MeleeAccount | null;
  hasHydrated: boolean;
  setAvatarId?: (avatarId: string | null) => void;
  linkMeleeAccount: (melee: import("@/lib/types").MeleeAccount | null) => void;
  addTestFriend?: () => void;
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
  // Tournaments
  addTournament: (tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt">) => string;
  updateTournament: (id: string, patch: Partial<Omit<Tournament, "id" | "createdAt" | "updatedAt">>) => void;
  deleteTournament: (id: string) => void;
  upsertTournamentPairing: (tournamentId: string, pairing: TournamentPairing) => void;
  recordTournamentMatch: (tournamentId: string, pairingId: string, match: Omit<MatchRecord, "id" | "createdAt" | "tournamentId" | "pairingId">) => string | null;
  // Buy Lists
  createBuyList: (name?: string, description?: string) => string;
  updateBuyList: (id: string, patch: Partial<Omit<BuyList, "id" | "createdAt">>) => void;
  deleteBuyList: (id: string) => void;
  addBuyListEntry: (entry: { cardId: string; quantity?: number; priority?: BuyListPriority; notes?: string; listId?: string }) => string;
  updateBuyListEntry: (id: string, patch: Partial<Omit<BuyListEntry, "id" | "createdAt">>) => void;
  removeBuyListEntry: (id: string) => void;
  adjustBuyListObtained: (id: string, delta: number) => void;
  clearObtainedBuyList: (listId?: string) => void;
  importData: (payload: { collection?: Record<string, number>; decks?: Deck[]; matches?: MatchRecord[]; tournaments?: Tournament[]; buyList?: BuyListEntry[]; buyLists?: BuyList[]; friends?: import("@/lib/types").Friend[]; friendCode?: string | null }) => void;
  resetAll: () => void;
  // Friends
  ensureFriendCode: () => string;
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
      tournaments: [],
      buyLists: [],
      buyList: [],
      friends: [],
      friendCode: null,
      avatarId: null,
      meleeAccount: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      user: null,
      syncStatus: "idle",
      lastSyncedAt: null,
      setUser: (user) => {
        set({ user });
        if (user) {
          void get().syncFromCloud(false);
          void (async () => {
            try {
              const state = get();
              let code = state.friendCode;
              if (!code) {
                code = state.ensureFriendCode();
              }
              const { db } = await import("@/lib/firebase");
              if (!db || !code) return;
              const { doc, setDoc } = await import("firebase/firestore");
              await setDoc(doc(db, "friendCodes", code), { uid: user.uid });
            } catch (e) {
              console.error(e);
            }
          })();
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
            tournaments: (state as any).tournaments,
            buyLists: (state as any).buyLists,
            buyList: state.buyList,
            friends: state.friends,
            friendCode: state.friendCode,
            meleeAccount: (state as any).meleeAccount,
          } as any);
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
                tournaments: Array.isArray((cloud as any).tournaments) ? (cloud as any).tournaments : [],
                buyLists: Array.isArray((cloud as any).buyLists) ? (cloud as any).buyLists : [],
                buyList: Array.isArray(cloud.buyList) ? cloud.buyList : [],
                friends: Array.isArray(cloud.friends) ? cloud.friends : [],
                friendCode: typeof cloud.friendCode === "string" ? cloud.friendCode : (get().friendCode || generateFriendCode()),
              });
            } else {
              const local = get();
              if (local.decks.length === 0 && local.matches.length === 0 && Object.keys(local.collection).length === 0 && local.buyList.length === 0 && ((local as any).tournaments?.length ?? 0) === 0 && ((local as any).buyLists?.length ?? 0) === 0) {
                set({
                  collection: cleanCollection(cloud.collection),
                  decks: cloud.decks,
                  matches: cloud.matches,
                  tournaments: Array.isArray((cloud as any).tournaments) ? (cloud as any).tournaments : [],
                  buyLists: Array.isArray((cloud as any).buyLists) ? (cloud as any).buyLists : [],
                  buyList: Array.isArray(cloud.buyList) ? cloud.buyList : [],
                  friends: Array.isArray(cloud.friends) ? cloud.friends : [],
                  friendCode: typeof cloud.friendCode === "string" ? cloud.friendCode : (local.friendCode || generateFriendCode()),
                });
              } else if (!local.friendCode && typeof cloud.friendCode === "string") {
                set({ friendCode: cloud.friendCode });
              } else if (!local.friendCode) {
                const code = generateFriendCode();
                set({ friendCode: code });
                void get().syncToCloud();
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

      addTournament: (tournament) => {
        const id = uid("tourney");
        const timestamp = now();
        const record: Tournament = {
          ...tournament,
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
          pairings: tournament.pairings ?? [],
        };
        set((state) => ({ tournaments: [record, ...((state as any).tournaments ?? [])] }));
        scheduleCloudSync(get);
        return id;
      },

      updateTournament: (id, patch) => {
        set((state) => ({
          tournaments: ((state as any).tournaments ?? []).map((tournament: Tournament) =>
            tournament.id === id ? { ...tournament, ...patch, updatedAt: now() } : tournament,
          ),
        }));
        scheduleCloudSync(get);
      },

      deleteTournament: (id) => {
        set((state) => ({
          tournaments: ((state as any).tournaments ?? []).filter((tournament: Tournament) => tournament.id !== id),
          matches: state.matches.filter((match) => (match as MatchRecord).tournamentId !== id),
        }));
        scheduleCloudSync(get);
      },

      upsertTournamentPairing: (tournamentId, pairing) => {
        set((state) => ({
          tournaments: ((state as any).tournaments ?? []).map((tournament: Tournament) => {
            if (tournament.id !== tournamentId) return tournament;
            const existing = (tournament.pairings ?? []).findIndex((p) => p.pairingId === pairing.pairingId);
            const pairings = [...(tournament.pairings ?? [])];
            if (existing >= 0) {
              pairings[existing] = { ...pairings[existing], ...pairing };
            } else {
              pairings.push(pairing);
            }
            return { ...tournament, pairings, updatedAt: now() };
          }),
        }));
        scheduleCloudSync(get);
      },

      recordTournamentMatch: (tournamentId, pairingId, match) => {
        const state = get();
        const tournament = ((state as any).tournaments ?? []).find((t: Tournament) => t.id === tournamentId);
        if (!tournament) return null;
        const id = uid("match");
        const record: MatchRecord = {
          ...(match as any),
          id,
          createdAt: now(),
          type: "tournament",
          tournamentId,
          pairingId,
          tournamentName: tournament.name,
          round: match.round ?? tournament.pairings?.find((p: TournamentPairing) => p.pairingId === pairingId)?.round,
          tableNumber: match.tableNumber ?? tournament.pairings?.find((p: TournamentPairing) => p.pairingId === pairingId)?.tableNumber,
        } as MatchRecord;
        set((s) => ({ matches: [record, ...s.matches] }));
        set((s) => ({
          tournaments: ((s as any).tournaments ?? []).map((t: Tournament) => {
            if (t.id !== tournamentId) return t;
            const pairings = (t.pairings ?? []).map((p: TournamentPairing) =>
              p.pairingId === pairingId ? { ...p, result: record.result, gamesWon: record.gamesWon, gamesLost: record.gamesLost, matchId: id } : p,
            );
            const allMatches = s.matches;
            const tMatches = allMatches.filter((m) => (m as MatchRecord).tournamentId === tournamentId);
            const wins = tMatches.filter((m) => m.result === "win").length;
            const losses = tMatches.filter((m) => m.result === "loss").length;
            const draws = tMatches.filter((m) => m.result === "draw").length;
            return { ...t, pairings, playerRecord: { wins, losses, draws, gamesWon: tMatches.reduce((sum, m) => sum + (m.gamesWon || 0), 0), gamesLost: tMatches.reduce((sum, m) => sum + (m.gamesLost || 0), 0) }, updatedAt: now() };
          }),
        }));
        scheduleCloudSync(get);
        return id;
      },

      createBuyList: (name = "My Buy List", description = "") => {
        const id = uid("buylist");
        const timestamp = now();
        const list: BuyList = {
          id,
          name,
          description,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => ({ buyLists: [list, ...(state as any).buyLists ?? []] }));
        scheduleCloudSync(get);
        return id;
      },

      updateBuyList: (id, patch) => {
        set((state) => ({
          buyLists: ((state as any).buyLists ?? []).map((list: BuyList) =>
            list.id === id ? { ...list, ...patch, updatedAt: now() } : list,
          ),
        }));
        scheduleCloudSync(get);
      },

      deleteBuyList: (id) => {
        set((state) => ({
          buyLists: ((state as any).buyLists ?? []).filter((list: BuyList) => list.id !== id),
          buyList: state.buyList.filter((item) => (item as any).listId !== id),
        }));
        scheduleCloudSync(get);
      },

      addBuyListEntry: (entry) => {
        const id = uid("buy");
        const timestamp = now();
        const state = get() as any;
        let listId = entry.listId;
        if (!listId) {
          if (Array.isArray(state.buyLists) && state.buyLists.length > 0) {
            listId = state.buyLists[0].id;
          } else {
            listId = state.createBuyList?.("My Buy List") || undefined;
          }
        }
        const record: BuyListEntry = {
          id,
          cardId: entry.cardId,
          quantity: Math.max(1, Math.floor(entry.quantity ?? 1)),
          priority: entry.priority ?? "normal",
          notes: entry.notes ?? "",
          obtained: 0,
          listId,
          createdAt: timestamp,
          updatedAt: timestamp,
        } as BuyListEntry;
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

      clearObtainedBuyList: (listId) => {
        set((state) => ({
          buyList: state.buyList.filter((item) => {
            if ((item.obtained ?? 0) >= item.quantity) {
              if (listId && (item as any).listId && (item as any).listId !== listId) return true;
              return false;
            }
            return true;
          }),
        }));
        scheduleCloudSync(get);
      },

      importData: (payload) => {
        set((state) => ({
          collection: payload.collection ? cleanCollection(payload.collection) : state.collection,
          decks: Array.isArray(payload.decks) ? payload.decks : state.decks,
          matches: Array.isArray(payload.matches) ? payload.matches : state.matches,
          tournaments: Array.isArray((payload as any).tournaments) ? (payload as any).tournaments : ((state as any).tournaments ?? []),
          buyLists: Array.isArray((payload as any).buyLists) ? (payload as any).buyLists : ((state as any).buyLists ?? []),
          buyList: Array.isArray(payload.buyList) ? payload.buyList : state.buyList,
          friends: Array.isArray((payload as any).friends) ? (payload as any).friends : state.friends,
          friendCode: (payload as any).friendCode || state.friendCode,
        }));
        scheduleCloudSync(get);
      },

      resetAll: () => {
        set({ collection: {}, decks: [], matches: [], tournaments: [], buyLists: [], buyList: [], friends: [], friendCode: null, avatarId: null, meleeAccount: null } as any);
        scheduleCloudSync(get);
      },

      ensureFriendCode: () => {
        const state = get();
        if (state.friendCode) return state.friendCode;
        const code = generateFriendCode();
        set({ friendCode: code });
        scheduleCloudSync(get);
        return code;
      },

      addFriend: (friend) => {
        set((state) => {
          if (state.friends.some((f) => f.uid === friend.uid)) return state;
          return { friends: [{ uid: friend.uid, friendCode: (friend as any).friendCode, addedAt: friend.addedAt }, ...state.friends] };
        });
        scheduleCloudSync(get);
      },

      removeFriend: (uid) => {
        set((state) => ({ friends: state.friends.filter((f) => f.uid !== uid) }));
        scheduleCloudSync(get);
      },
      addTestFriend: () => {
        const testFriend = {
          uid: "test-dummy-friend-12345",
          friendCode: "TEST1",
          addedAt: new Date().toISOString(),
        };
        set((state) => {
          if (state.friends.some((f: any) => f.uid === testFriend.uid)) return state;
          return { friends: [testFriend, ...state.friends] };
        });
        scheduleCloudSync(get);
      },
      setAvatarId: (avatarId: string | null) => {
        set({ avatarId });
        scheduleCloudSync(get);
      },
      linkMeleeAccount: (melee: any) => {
        set({ meleeAccount: melee ? { ...(melee as any), linkedAt: (melee as any).linkedAt || now(), lastSyncedAt: now() } : null });
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
        tournaments: (state as any).tournaments,
        buyLists: (state as any).buyLists,
        buyList: state.buyList,
        friends: state.friends,
        friendCode: state.friendCode,
        avatarId: state.avatarId,
        meleeAccount: (state as any).meleeAccount,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
