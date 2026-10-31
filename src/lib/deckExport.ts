import type { Card } from "@/lib/types";
import { getCard } from "@/lib/cards";

export type DeckExportFormat = "decklist" | "cardmarket";

const CARDMARKET_SET_CODES: Record<string, string> = {
  welcometonightcityretail: "MS01",
  theheistretailstarterdeck: "SD01",
  embracingpowerretailstarterdeck: "SD02",
  PRM01: "PRM01",
};

export function decklistText(
  name: string,
  legendIds: string[],
  cards: Record<string, number>,
  sideboard: Record<string, number>,
) {
  const lines: string[] = [name, ""];
  lines.push("LEGENDS");
  for (const id of legendIds) {
    const card = getCard(id);
    if (card) lines.push(`1x ${card.displayName}`);
  }
  const main = Object.entries(cards)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ card: getCard(id), count }))
    .filter((entry): entry is { card: Card; count: number } => Boolean(entry.card))
    .sort((a, b) => a.card.displayName.localeCompare(b.card.displayName));
  lines.push("", `MAIN DECK (${main.reduce((sum, entry) => sum + entry.count, 0)})`);
  for (const { card, count } of main) {
    lines.push(`${count}x ${card.name}${card.subname ? `: ${card.subname}` : ""}`);
  }
  const side = Object.entries(sideboard)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ card: getCard(id), count }))
    .filter((entry): entry is { card: Card; count: number } => Boolean(entry.card))
    .sort((a, b) => a.card.displayName.localeCompare(b.card.displayName));
  if (side.length) {
    lines.push("", `SIDEBOARD (${side.reduce((sum, entry) => sum + entry.count, 0)})`);
    for (const { card, count } of side) {
      lines.push(`${count}x ${card.name}${card.subname ? `: ${card.subname}` : ""}`);
    }
  }
  return lines.join("\n");
}

export function cardmarketText(
  legendIds: string[],
  cards: Record<string, number>,
  sideboard: Record<string, number>,
) {
  const entries: { card: Card; count: number }[] = [];
  for (const id of legendIds) {
    const card = getCard(id);
    if (card) entries.push({ card, count: 1 });
  }
  for (const [id, count] of Object.entries(cards)) {
    if (count > 0) {
      const card = getCard(id);
      if (card) entries.push({ card, count });
    }
  }
  for (const [id, count] of Object.entries(sideboard)) {
    if (count > 0) {
      const card = getCard(id);
      if (card) entries.push({ card, count });
    }
  }
  entries.sort((a, b) => a.card.displayName.localeCompare(b.card.displayName));
  return entries
    .map(({ card, count }) => {
      const code = CARDMARKET_SET_CODES[card.set.code] ?? card.set.code.toUpperCase();
      const name = card.subname ? `${card.name} - ${card.subname}` : card.name;
      return `${count}x ${name} ${code}-${card.printNumber}`;
    })
    .join("\n");
}