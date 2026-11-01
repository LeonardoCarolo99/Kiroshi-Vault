"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, UserPlus } from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { subscribeToConversations } from "@/lib/chat";
import type { ChatConversation } from "@/lib/types";
import { relativeDate } from "@/lib/utils";

export function ChatListView() {
  const user = useVaultStore((state) => state.user);
  const friends = useVaultStore((state) => state.friends);
  const avatarId = useVaultStore((state) => state.avatarId);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
    });
    return () => unsub();
  }, [user]);

  const getOtherParticipant = (conv: ChatConversation) => {
    if (!user) return null;
    const otherUid = conv.participants.find((p) => p !== user.uid);
    if (!otherUid) return null;
    const friend = friends.find((f) => f.uid === otherUid);
    return {
      uid: otherUid,
      friendCode: conv.participantDetails?.[otherUid]?.friendCode || friend?.friendCode || otherUid.slice(0, 12),
    };
  };

  return (
    <div>
      <PageHeader
        eyebrow="Comms // 07"
        title="Chat"
        description="Private 1:1 messages with friends."
        actions={
          <Link href="/friends" className="btn-cyber">
            <UserPlus className="h-4 w-4" />
            Manage Friends
          </Link>
        }
      />

      {!user ? (
        <div className="hud-panel p-6 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted" />
          <h2 className="font-display mt-3 text-xl font-bold uppercase tracking-[0.05em] text-fog">
            Sign in required
          </h2>
          <p className="mt-2 text-sm text-muted">Sign in with Google in Settings to chat with friends.</p>
        </div>
      ) : friends.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title="Add friends to chat"
          description="You need to be friends with someone to start a private conversation."
          action={
            <Link href="/friends" className="btn-cyber">
              <UserPlus className="h-4 w-4" />
              Add Friends
            </Link>
          }
        />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No conversations yet"
          description="Go to a friend and start chatting from the Friends page or create a conversation."
          action={
            <Link href="/friends" className="btn-cyber">
              <UserPlus className="h-4 w-4" />
              View Friends
            </Link>
          }
        />
      ) : (
        <div className="grid gap-2">
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            if (!other) return null;
            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="hud-panel hud-panel-hover flex items-center gap-3 px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden border border-cp-cyan/40 bg-cp-cyan/10">
                  {avatarId ? (
                    <img src={`/avatars/${avatarId}.webp`} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-cp-cyan" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display truncate text-base font-bold uppercase tracking-[0.04em] text-fog">
                      {other.friendCode}
                    </h2>
                    <span className="font-mono text-[8px] tracking-[0.1em] text-muted">
                      {relativeDate(conv.lastMessage?.createdAt || conv.updatedAt).toUpperCase()}
                    </span>
                  </div>
                  {conv.lastMessage ? (
                    <p className="mt-1 truncate text-xs text-muted">
                      {conv.lastMessage.senderId === user.uid ? "You: " : ""}
                      {conv.lastMessage.text}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">Start a conversation</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
