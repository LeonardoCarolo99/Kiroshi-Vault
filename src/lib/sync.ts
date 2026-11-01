"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BuyListEntry, BuyList, Deck, MatchRecord, Tournament } from "@/lib/types";

export type VaultSnapshot = {
  collection: Record<string, number>;
  decks: Deck[];
  matches: MatchRecord[];
  tournaments?: Tournament[];
  buyLists?: BuyList[];
  buyList?: BuyListEntry[];
  friends?: import("@/lib/types").Friend[];
  friendCode?: string | null;
  meleeAccount?: import("@/lib/types").MeleeAccount | null;
  updatedAt?: unknown;
};

function vaultRef(uid: string) {
  if (!db) throw new Error("Firestore not initialized");
  return doc(db, "users", uid);
}

export async function loadVaultFromCloud(uid: string): Promise<VaultSnapshot | null> {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await getDoc(vaultRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data() as VaultSnapshot;
  return {
    collection: data.collection ?? {},
    decks: Array.isArray(data.decks) ? data.decks : [],
    matches: Array.isArray(data.matches) ? data.matches : [],
    tournaments: Array.isArray((data as any).tournaments) ? (data as any).tournaments : [],
    buyLists: Array.isArray((data as any).buyLists) ? (data as any).buyLists : [],
    buyList: Array.isArray(data.buyList) ? data.buyList : [],
    friends: Array.isArray(data.friends) ? data.friends : [],
    friendCode: typeof data.friendCode === "string" ? data.friendCode : null,
    meleeAccount: (data as any).meleeAccount ?? null,
    updatedAt: data.updatedAt,
  };
}

export async function saveVaultToCloud(
  uid: string,
  snapshot: {
    collection: Record<string, number>;
    decks: Deck[];
    matches: MatchRecord[];
    tournaments?: Tournament[];
    buyList?: BuyListEntry[];
    friends?: import("@/lib/types").Friend[];
    friendCode?: string | null;
    meleeAccount?: import("@/lib/types").MeleeAccount | null;
  },
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await setDoc(
    vaultRef(uid),
    {
      collection: snapshot.collection,
      decks: snapshot.decks,
      matches: snapshot.matches,
      tournaments: snapshot.tournaments ?? [],
      buyLists: (snapshot as any).buyLists ?? [],
      buyList: snapshot.buyList ?? [],
      friends: snapshot.friends ?? [],
      friendCode: snapshot.friendCode ?? null,
      meleeAccount: snapshot.meleeAccount ?? null,
      updatedAt: serverTimestamp(),
    } as any,
    { merge: true },
  );
}
