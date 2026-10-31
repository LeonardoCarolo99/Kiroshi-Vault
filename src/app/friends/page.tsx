import type { Metadata } from "next";
import { FriendsView } from "@/components/friends/FriendsView";

export const metadata: Metadata = {
  title: "Friends",
  description: "Add friends and view their public decks.",
};

export default function FriendsPage() {
  return <FriendsView />;
}
