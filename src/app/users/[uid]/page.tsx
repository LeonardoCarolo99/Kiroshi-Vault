import type { Metadata } from "next";
import { UserDecksView } from "@/components/friends/UserDecksView";

export const metadata: Metadata = {
  title: "User Decks",
};

export default async function UserPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  return <UserDecksView uid={uid} />;
}
