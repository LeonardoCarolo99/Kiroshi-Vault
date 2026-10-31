"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Users, ExternalLink, Trash2, Copy, Check } from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeDate } from "@/lib/utils";

export function FriendsView() {
  const user = useVaultStore((state) => state.user);
  const friends = useVaultStore((state) => state.friends);
  const addFriend = useVaultStore((state) => state.addFriend);
  const removeFriend = useVaultStore((state) => state.removeFriend);

  const [addOpen, setAddOpen] = useState(false);
  const [uidInput, setUidInput] = useState("");
  const [copied, setCopied] = useState(false);

  const copyUid = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleAdd = () => {
    const uid = uidInput.trim();
    if (!uid) return;
    addFriend({ uid, addedAt: new Date().toISOString() });
    setUidInput("");
    setAddOpen(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Network // 06"
        title="Friends"
        description="Add friends and browse their public decklists."
        actions={
          <>
            {user?.uid ? (
              <button type="button" className="btn-cyber btn-cyber-ghost" onClick={copyUid}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy My UID"}
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
          description="Share your UID with chooms or add theirs to see their public decks."
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
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/users/${friend.uid}`} className="block">
                    <h2 className="font-display truncate text-lg font-bold uppercase leading-tight tracking-[0.04em] text-fog transition-colors hover:text-cp-yellow">
                      {friend.uid.slice(0, 12)}...
                    </h2>
                  </Link>
                  <p className="mt-0.5 truncate font-mono text-[9px] tracking-[0.1em] text-muted">
                    ADDED {relativeDate(friend.addedAt).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex-1 px-4 py-3">
                <p className="text-xs text-muted">View public decks from this user.</p>
              </div>
              <div className="flex items-center gap-1 border-t border-line px-3 py-2">
                <Link href={`/users/${friend.uid}`} className="btn-cyber flex-1 !min-h-8 !py-1.5 !text-[9px]">
                  View Decks
                  <ExternalLink className="h-3 w-3" />
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
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-cyber" onClick={handleAdd} disabled={!uidInput.trim()}>
              <UserPlus className="h-4 w-4" />
              Add
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="hud-label mb-1.5 block">Friend UID</span>
            <input
              autoFocus
              value={uidInput}
              onChange={(event) => setUidInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAdd();
              }}
              placeholder="Paste their Firebase UID"
              className="hud-input"
            />
          </label>
          <p className="text-xs text-muted">They need to be signed in and have some public decks visible.</p>
        </div>
      </Modal>
    </div>
  );
}
