import type { Metadata } from "next";
import { DeckBuilder } from "@/components/decks/DeckBuilder";

export const metadata: Metadata = {
  title: "Deck Builder",
};

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeckBuilder deckId={id} />;
}
