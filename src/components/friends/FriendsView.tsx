"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Users, ExternalLink, Trash2, Copy, Check, MessageSquare, User } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useVaultStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeDate } from "@/lib/utils";
import { getOrCreateConversation } from "@/lib/chat";

export function FriendsView() {
  const user = useVaultStore((state) => state.user);
  const friends = useVaultStore((state) => state.friends);
  const addFriend = useVaultStore((state) => state.addFriend);
  const removeFriend = useVaultStore((state) => state.removeFriend);
  const addTestFriend = useVaultStore((state) => state.addTestFriend);
  const friendCode = useVaultStore((state) => state.friendCode);
  const ensureFriendCode = useVaultStore((state) => state.ensureFriendCode);
  const avatarId = useVaultStore((state) => state.avatarId);

  const [addOpen, setAddOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const copyCode = async () => {
    const code = friendCode || ensureFriendCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleAdd = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code || !db || !user) return;
    setAdding(true);
    setError(null);
    try {
      const codeRef = doc(db, "friendCodes", code);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) {
        setError("Friend code not found");
        setAdding(false);
        return;
      }
      const data = codeSnap.data() as { uid: string };
      if (data.uid === user.uid) {
        setError("You can't add yourself");
        setAdding(false);
        return;
      }
      if (friends.some((f) => f.uid === data.uid)) {
        setError("Already friends");
        setAdding(false);
        return;
      }
      addFriend({ uid: data.uid, friendCode: code, addedAt: new Date().toISOString() });
      setCodeInput("");
      setAddOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add friend");
    } finally {
      setAdding(false);
    }
  };

  const startChat = async (friendUid: string, friendCodeVal?: string) => {
    if (!user) {
      alert("Sign in required");
      return;
    }
    setStartingChat(friendUid);
    try {
      const conversationId = await getOrCreateConversation(
        user.uid,
        friendUid,
        { friendCode: friendCode || undefined, displayName: user.displayName },
        { friendCode: friendCodeVal },
      );
      window.location.href = `/chat/${conversationId}`;
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to start chat - check Firestore permissions");
      setStartingChat(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Network // 06"
        title="Friends"
        description="Add friends with a 5-character code and browse their public decklists."
        actions={
          <>
            {user ? (
              <button type="button" className="btn-cyber btn-cyber-ghost" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : `Copy Code ${(friendCode || ensureFriendCode())}`}
              </button>
            ) : null}
            {process.env.NODE_ENV !== "production" ? (
              <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => addTestFriend?.()}>
                Add Test Friend
              </button>
            ) : null}
            <button type="button" className="btn-cyber" onClick={() => setAddOpen(true)} disabled={!user}>
              <UserPlus className="h-4 w-4" />
              Add Friend
            </button>
          </>
        }
      />

      {!user ? (
        <div className="hud-panel p-6 text-center">
          <Users className="mx-auto h-8 w-8 text-muted" />
          <h2 className="font-display mt-3 text-xl font-bold uppercase tracking-[0.05em] text-fog">
            Sign in required
          </h2>
          <p className="mt-2 text-sm text-muted">Sign in with Google in Settings to sync and connect with friends.</p>
        </div>
      ) : friends.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No friends yet"
          description="Share your friend code with chooms and add theirs to see their public decks."
          action={
            <button type="button" className="btn-cyber" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Add Friend
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {friends.map((friend) => (
            <article key={friend.uid} className="hud-panel hud-panel-hover flex flex-col">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-cp-cyan/40 bg-cp-cyan/10">
                  {avatarId ? (
                    <img src={`/avatars/${avatarId}.webp`} alt="Profile avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-cp-cyan" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/users/${friend.uid}`} className="block">
                    <h2 className="font-display truncate text-lg font-bold uppercase leading-tight tracking-[0.04em] text-fog transition-colors hover:text-cp-yellow">
                      {friend.friendCode || friend.uid.slice(0, 12)}
                    </h2>
                  </Link>
                  <p className="mt-0.5 truncate font-mono text-[9px] tracking-[0.1em] text-muted">
                    ADDED {relativeDate(friend.addedAt).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex-1 px-4 py-2">
                <p className="text-xs text-muted">View public decks from this user.</p>
              </div>
              <div className="flex items-center gap-1 border-t border-line px-3 py-2">
                <button
                  type="button"
                  className="btn-cyber flex-1 !min-h-8 !py-1.5 !text-[9px]"
                  onClick={() => startChat(friend.uid, friend.friendCode)}
                  disabled={startingChat === friend.uid}
                >
                  <MessageSquare className="h-3 w-3" />
                  {startingChat === friend.uid ? "Opening..." : "Chat"}
                </button>
                <Link href={`/users/${friend.uid}`} className="icon-btn h-8 w-8" aria-label="View decks">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  className="icon-btn h-8 w-8 hover:border-cp-red/50 hover:text-cp-red"
                  onClick={() => removeFriend(friend.uid)}
                  aria-label="Remove friend"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        eyebrow="Connect"
        title="Add Friend"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => { setAddOpen(false); setError(null); setCodeInput(""); }}>
              Cancel
            </button>
            <button type="button" className="btn-cyber" onClick={handleAdd} disabled={!codeInput.trim() || adding}>
              <UserPlus className="h-4 w-4" />
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="hud-label mb-1.5 block">Friend Code</span>
            <input
              autoFocus
              value={codeInput}
              onChange={(event) => { setCodeInput(event.target.value.toUpperCase()); setError(null); }}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAdd();
              }}
              placeholder="F78K2"
              maxLength={5}
              className="hud-input font-mono tracking-[0.3em] uppercase"
            />
          </label>
          {error ? <p className="text-xs text-cp-red">{error}</p> : null}
          <p className="text-xs text-muted">Enter your friend&apos;s 5-character code. They need to be signed in.</p>
        </div>
      </Modal>
    </div>
  );
}
