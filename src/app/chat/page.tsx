import type { Metadata } from "next";
import { ChatListView } from "@/components/chat/ChatListView";

export const metadata: Metadata = {
  title: "Chat",
  description: "Private 1:1 chat with friends.",
};

export default function ChatPage() {
  return <ChatListView />;
}
