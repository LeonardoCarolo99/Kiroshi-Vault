import type { Metadata } from "next";
import { BuyListView } from "@/components/buy-list/BuyListView";

export const metadata: Metadata = {
  title: "Buy List",
  description: "Track cards to buy and what you still need for your decks.",
};

export default function BuyListPage() {
  return <BuyListView />;
}
