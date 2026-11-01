"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, MessageSquare, Bot } from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { subscribeToMessages, sendMessage, simulateDummyReply } from "@/lib/chat";
import type { ChatMessage } from "@/lib/types";
import { relativeDate } from "@/lib/utils";

export function ChatThreadView({ conversationId }: { conversationId: string }) {
  const user = useVaultStore((state) => state.user);
  const friends = useVaultStore((state) => state.friends);
  const friendCode = useVaultStore((state) => state.friendCode);
  const avatarId = useVaultStore((state) => state.avatarId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUid = useMemo(() => {
    const [uid1, uid2] = conversationId.split("_");
    if (!user) return null;
    return uid1 === user.uid ? uid2 : uid1;
  }, [conversationId, user]);

  const otherFriendCode = useMemo(() => {
    if (!otherUid) return null;
    const friend = friends.find((f) => f.uid === otherUid);
    return friend?.friendCode || otherUid.slice(0, 12);
  }, [otherUid, friends]);

  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId, user.uid, text);
      setText("");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="hud-panel p-6 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted" />
        <h2 className="font-display mt-3 text-xl font-bold uppercase tracking-[0.05em] text-fog">
          Sign in required
        </h2>
        <p className="mt-2 text-sm text-muted">Sign in to view messages.</p>
        <Link href="/chat" className="btn-cyber mt-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/chat"
          className="font-mono flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-muted uppercase transition-colors hover:text-cp-yellow"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Chat
        </Link>
        {otherUid && (
          <Link href={`/users/${otherUid}`} className="font-mono text-[9px] tracking-[0.16em] text-cp-cyan uppercase hover:text-cp-yellow">
            {otherFriendCode}
          </Link>
        )}
      </div>

      <div className="hud-panel flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-line px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-fog">
              {otherFriendCode || "Chat"}
            </h1>
            <p className="font-mono mt-0.5 text-[8px] tracking-[0.1em] text-muted">PRIVATE 1:1 CHANNEL</p>
          </div>
          {otherUid === "test-dummy-friend-12345" && user && (
            <button
              type="button"
              className="btn-cyber btn-cyber-ghost !min-h-7 !py-1 !text-[8px]"
              onClick={() => simulateDummyReply(conversationId, user.uid)}
            >
              <Bot className="h-3 w-3" />
              Simulate Reply
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-6 w-6 text-muted" />
                <p className="mt-2 text-xs text-muted">No messages yet. Say hello!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`border px-3 py-2 ${
                          isOwn
                            ? "border-cp-yellow/40 bg-cp-yellow/10 text-fog"
                            : "border-cp-cyan/40 bg-cp-cyan/10 text-fog"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                      </div>
                      <span className="mt-1 font-mono text-[7px] tracking-[0.08em] text-muted">
                        {relativeDate(msg.createdAt).toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="border-t border-line p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message... (share links, discuss decks)"
              className="hud-input flex-1"
              disabled={sending}
              maxLength={1000}
              autoFocus
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="btn-cyber"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
