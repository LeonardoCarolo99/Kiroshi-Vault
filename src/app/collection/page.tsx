import type { Metadata } from "next";
import { CollectionView } from "@/components/collection/CollectionView";

export const metadata: Metadata = {
  title: "Collection",
  description: "Track every Cyberpunk TCG card you own.",
};

export default function CollectionPage() {
  return <CollectionView />;
}
