"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChatConversation, ChatMessage } from "@/lib/types";

export function getConversationId(uid1: string, uid2: string) {
  const sorted = [uid1, uid2].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

const LOCAL_KEY = "kiroshi-chat-local";

function getLocalData() {
  if (typeof window === "undefined") return { conversations: {}, messages: {} };
  try {
    const data = localStorage.getItem(LOCAL_KEY);
    return data ? JSON.parse(data) : { conversations: {}, messages: {} };
  } catch {
    return { conversations: {}, messages: {} };
  }
}

function saveLocalData(data: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("kiroshi-chat-updated"));
    }
  } catch {}
}

export async function getOrCreateConversation(
  currentUid: string,
  friendUid: string,
  currentUserInfo?: { friendCode?: string | null; displayName?: string | null },
  friendInfo?: { friendCode?: string | null; displayName?: string | null },
): Promise<string> {
  const conversationId = getConversationId(currentUid, friendUid);
  
  if (db) {
    try {
      const convRef = doc(db, "conversations", conversationId);
      const convSnap = await getDoc(convRef);
      if (!convSnap.exists()) {
        const conversation = {
          id: conversationId,
          participants: [currentUid, friendUid],
          participantDetails: {
            [currentUid]: {
              friendCode: currentUserInfo?.friendCode ?? undefined,
              displayName: currentUserInfo?.displayName ?? undefined,
            },
            [friendUid]: {
              friendCode: friendInfo?.friendCode ?? undefined,
              displayName: friendInfo?.displayName ?? undefined,
            },
          },
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };
        await setDoc(convRef, conversation);
        return conversationId;
      }
      return conversationId;
    } catch (error) {
      console.error("Error creating conversation:", error);
      // Fall through to localStorage
    }
  }
  
  // Fallback to localStorage
  const data = getLocalData();
  if (!data.conversations[conversationId]) {
    data.conversations[conversationId] = {
      id: conversationId,
      participants: [currentUid, friendUid],
      participantDetails: {
        [currentUid]: {
          friendCode: currentUserInfo?.friendCode ?? undefined,
          displayName: currentUserInfo?.displayName ?? undefined,
        },
        [friendUid]: {
          friendCode: friendInfo?.friendCode ?? undefined,
          displayName: friendInfo?.displayName ?? undefined,
        },
      },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    data.messages[conversationId] = [];
    saveLocalData(data);
  }
  return conversationId;
}

export function subscribeToConversations(
  uid: string,
  callback: (conversations: ChatConversation[]) => void,
) {
  if (db) {
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", uid),
      );
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const conversations: ChatConversation[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            conversations.push({
              id: doc.id,
              participants: data.participants || [],
              participantDetails: data.participantDetails || {},
              lastMessage: data.lastMessage,
              updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || new Date().toISOString(),
              createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || new Date().toISOString(),
            });
          });
          conversations.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
          callback(conversations);
        },
        () => {
          // On error, fall back to local
          const data = getLocalData();
          const convs = Object.values(data.conversations as any).filter((c: any) => c.participants?.includes(uid));
          convs.sort((a: any, b: any) => (b.updatedAt > a.updatedAt ? 1 : -1));
          callback(convs as any);
        },
      );
      return unsub;
    } catch {
      // Fall through
    }
  }
  
  // Local fallback
  const loadLocal = () => {
    const data = getLocalData();
    const convs = Object.values((data as any).conversations || {}).filter((c: any) => c.participants?.includes(uid));
    convs.sort((a: any, b: any) => (b.updatedAt > a.updatedAt ? 1 : -1));
    callback(convs as any);
  };
  loadLocal();
  if (typeof window !== "undefined") {
    const handler = () => loadLocal();
    window.addEventListener("kiroshi-chat-updated", handler);
    return () => {
      window.removeEventListener("kiroshi-chat-updated", handler);
    };
  }
  const interval = setInterval(loadLocal, 1000);
  return () => clearInterval(interval);
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
) {
  if (db) {
    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const messages: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            messages.push({
              id: doc.id,
              conversationId,
              senderId: data.senderId,
              text: data.text || "",
              createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || new Date().toISOString(),
              readBy: data.readBy || [],
            });
          });
          callback(messages);
        },
        () => {
          // Fallback
          const data = getLocalData();
          callback(data.messages[conversationId] || []);
        },
      );
      // Also listen to local events
      if (typeof window !== "undefined") {
        const handler = () => {
          const data = getLocalData();
          callback(data.messages[conversationId] || []);
        };
        window.addEventListener("kiroshi-chat-updated", handler);
        return () => {
          unsub();
          window.removeEventListener("kiroshi-chat-updated", handler);
        };
      }
      return unsub;
    } catch {
      // Fall through
    }
  }
  
  const loadLocal = () => {
    const data = getLocalData();
    callback(data.messages[conversationId] || []);
  };
  loadLocal();
  if (typeof window !== "undefined") {
    const handler = () => loadLocal();
    window.addEventListener("kiroshi-chat-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("kiroshi-chat-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }
  const interval = setInterval(loadLocal, 200);
  return () => clearInterval(interval);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
) {
  if (!text.trim()) return;
  const trimmed = text.trim();
  
  if (db) {
    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      await addDoc(messagesRef, {
        senderId,
        text: trimmed,
        createdAt: serverTimestamp(),
        readBy: [senderId],
      });
      const convRef = doc(db, "conversations", conversationId);
      try {
        await updateDoc(convRef, {
          lastMessage: {
            text: trimmed,
            senderId,
            createdAt: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error(e);
      }
      return;
    } catch (error) {
      console.error("Error sending message:", error);
      // Fall through to local
    }
  }
  
  // Local fallback
  const data = getLocalData();
  if (!data.messages[conversationId]) data.messages[conversationId] = [];
  const msg = {
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    senderId,
    text: trimmed,
    createdAt: new Date().toISOString(),
    readBy: [senderId],
  };
  data.messages[conversationId].push(msg);
  if (!data.conversations[conversationId]) {
    const sorted = conversationId.split("_");
    data.conversations[conversationId] = {
      id: conversationId,
      participants: sorted,
      participantDetails: {},
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
  data.conversations[conversationId].lastMessage = {
    text: trimmed,
    senderId,
    createdAt: new Date().toISOString(),
  };
  data.conversations[conversationId].updatedAt = new Date().toISOString();
  saveLocalData(data);
}

export function simulateDummyReply(conversationId: string, currentUid: string) {
  const data = getLocalData();
  if (!data.messages[conversationId]) data.messages[conversationId] = [];
  const sorted = conversationId.split("_");
  const dummyUid = sorted.find((u) => u !== currentUid) || "test-dummy-friend-12345";
  const replies = [
    "Hey choom, nice to see ya!",
    "Got any good decks to recommend?",
    "Wanna run some matches later?",
    "That looks sick, tell me more",
    "I'll check it out, thanks!",
  ];
  const msg = {
    id: `dummy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    senderId: dummyUid,
    text: replies[Math.floor(Math.random() * replies.length)],
    createdAt: new Date().toISOString(),
    readBy: [],
  };
  data.messages[conversationId].push(msg);
  if (!data.conversations[conversationId]) {
    data.conversations[conversationId] = {
      id: conversationId,
      participants: sorted,
      participantDetails: {},
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
  data.conversations[conversationId].lastMessage = {
    text: msg.text,
    senderId: dummyUid,
    createdAt: new Date().toISOString(),
  };
  data.conversations[conversationId].updatedAt = new Date().toISOString();
  saveLocalData(data);
}
