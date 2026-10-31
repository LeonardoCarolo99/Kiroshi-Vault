import type { Metadata } from "next";
import { MatchesView } from "@/components/matches/MatchesView";

export const metadata: Metadata = {
  title: "Matches",
  description: "Track Cyberpunk TCG match results and performance.",
};

export default function MatchesPage() {
  return <MatchesView />;
}
