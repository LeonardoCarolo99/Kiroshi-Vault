"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Deck, MatchRecord } from "@/lib/types";

export type VaultSnapshot = {
  collection: Record<string, number>;
  decks: Deck[];
  matches: MatchRecord[];
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
    updatedAt: data.updatedAt,
  };
}

export async function saveVaultToCloud(
  uid: string,
  snapshot: {
    collection: Record<string, number>;
    decks: Deck[];
    matches: MatchRecord[];
  },
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await setDoc(
    vaultRef(uid),
    {
      collection: snapshot.collection,
      decks: snapshot.decks,
      matches: snapshot.matches,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
