import type { Metadata } from "next";
import { DecksView } from "@/components/decks/DecksView";

export const metadata: Metadata = {
  title: "Decks",
  description: "Build and validate Cyberpunk TCG decks.",
};

export default function DecksPage() {
  return <DecksView />;
}
