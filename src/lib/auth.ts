"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const provider = new GoogleAuthProvider();

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, callback);
  } catch (e) {
    console.error("onAuthChange failed", e);
    callback(null);
    return () => {};
  }
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Auth not initialized");
  return signInWithPopup(auth, provider);
}

export async function signInAnon() {
  if (!auth) throw new Error("Auth not initialized");
  return signInAnonymously(auth);
}

export async function signOutUser() {
  if (!auth) return;
  return signOut(auth);
}

export function getCurrentUser() {
  if (!auth) return null;
  return auth.currentUser;
}
