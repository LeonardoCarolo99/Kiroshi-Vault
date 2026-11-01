import type { Metadata } from "next";
import { ChatThreadView } from "@/components/chat/ChatThreadView";

export const metadata: Metadata = {
  title: "Chat",
};

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatThreadView conversationId={conversationId} />;
}
