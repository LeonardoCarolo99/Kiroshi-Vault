import { COLORS, cards, getCard } from "@/lib/cards";
import type { Card, Deck, MatchRecord } from "@/lib/types";
import { percent } from "@/lib/utils";

export type CollectionStats = {
  totalCards: number;
  ownedUnique: number;
  totalCopies: number;
  completion: number;
  byColor: { color: string; owned: number; total: number; copies: number }[];
  byType: { type: string; owned: number; total: number }[];
  byRarity: { rarity: string; owned: number; total: number }[];
  legendsOwned: number;
  legendsTotal: number;
};

export function collectionStats(collection: Record<string, number>): CollectionStats {
  const ownedUnique = cards.filter((card) => (collection[card.id] ?? 0) > 0).length;
  const totalCopies = Object.values(collection).reduce((sum, count) => sum + count, 0);

  const byColor = COLORS.map((color) => {
    const pool = cards.filter((card) => card.color === color);
    return {
      color,
      owned: pool.filter((card) => (collection[card.id] ?? 0) > 0).length,
      total: pool.length,
      copies: pool.reduce((sum, card) => sum + (collection[card.id] ?? 0), 0),
    };
  });

  const typeNames = [...new Set(cards.map((card) => card.type))].sort();
  const byType = typeNames.map((type) => {
    const pool = cards.filter((card) => card.type === type);
    return {
      type,
      owned: pool.filter((card) => (collection[card.id] ?? 0) > 0).length,
      total: pool.length,
    };
  });

  const rarityNames = [...new Set(cards.map((card) => card.rarity))].sort();
  const byRarity = rarityNames.map((rarity) => {
    const pool = cards.filter((card) => card.rarity === rarity);
    return {
      rarity,
      owned: pool.filter((card) => (collection[card.id] ?? 0) > 0).length,
      total: pool.length,
    };
  });

  const legends = cards.filter((card) => card.type === "Legend");

  return {
    totalCards: cards.length,
    ownedUnique,
    totalCopies,
    completion: percent(ownedUnique, cards.length),
    byColor,
    byType,
    byRarity,
    legendsOwned: legends.filter((card) => (collection[card.id] ?? 0) > 0).length,
    legendsTotal: legends.length,
  };
}

export type MatchStats = {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  playCount: number;
  drawCount: number;
  currentStreak: { type: "win" | "loss" | "draw"; count: number } | null;
  byDeck: { deckId: string; name: string; wins: number; losses: number; draws: number; total: number; winRate: number }[];
  byFormat: { format: string; total: number; wins: number }[];
};

export type SplitMatchStats = {
  normal: MatchStats;
  tournament: MatchStats;
  all: MatchStats;
};

function computeMatchStats(matches: MatchRecord[], decks: Deck[]): MatchStats {
  const sorted = matches.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const wins = matches.filter((match) => match.result === "win").length;
  const losses = matches.filter((match) => match.result === "loss").length;
  const draws = matches.filter((match) => match.result === "draw").length;

  let currentStreak: MatchStats["currentStreak"] = null;
  for (const match of sorted) {
    if (!currentStreak) {
      currentStreak = { type: match.result, count: 1 };
    } else if (currentStreak.type === match.result) {
      currentStreak.count += 1;
    } else {
      break;
    }
  }

  const deckMap = new Map<string, { wins: number; losses: number; draws: number; total: number }>();
  for (const match of matches) {
    const key = match.deckId || "__none__";
    const entry = deckMap.get(key) ?? { wins: 0, losses: 0, draws: 0, total: 0 };
    entry.total += 1;
    if (match.result === "win") entry.wins += 1;
    if (match.result === "loss") entry.losses += 1;
    if (match.result === "draw") entry.draws += 1;
    deckMap.set(key, entry);
  }

  const byDeck = [...deckMap.entries()]
    .map(([deckId, entry]) => ({
      deckId,
      name: decks.find((deck) => deck.id === deckId)?.name ?? "Unknown deck",
      ...entry,
      winRate: percent(entry.wins, entry.total),
    }))
    .sort((a, b) => b.total - a.total);

  const formatMap = new Map<string, { total: number; wins: number }>();
  for (const match of matches) {
    const key = match.format || "Unknown";
    const entry = formatMap.get(key) ?? { total: 0, wins: 0 };
    entry.total += 1;
    if (match.result === "win") entry.wins += 1;
    formatMap.set(key, entry);
  }

  return {
    total: matches.length,
    wins,
    losses,
    draws,
    winRate: percent(wins, wins + losses),
    playCount: matches.filter((match) => match.playDraw === "play").length,
    drawCount: matches.filter((match) => match.playDraw === "draw").length,
    currentStreak,
    byDeck,
    byFormat: [...formatMap.entries()].map(([format, entry]) => ({ format, ...entry })),
  };
}

export function matchStats(matches: MatchRecord[], decks: Deck[]): MatchStats {
  return computeMatchStats(matches, decks);
}

export function matchStatsSplit(matches: MatchRecord[], decks: Deck[]): SplitMatchStats {
  const normal = matches.filter((m) => m.type !== "tournament" && !m.tournamentId);
  const tournament = matches.filter((m) => m.type === "tournament" || !!m.tournamentId);
  return {
    normal: computeMatchStats(normal, decks),
    tournament: computeMatchStats(tournament, decks),
    all: computeMatchStats(matches, decks),
  };
}

export function deckLegends(deck: Deck): Card[] {
  return deck.legendIds.map((id) => getCard(id)).filter((card): card is Card => Boolean(card));
}

export type CollectionGapEntry = { card: Card; need: number; owned: number };

export function collectionGap(deck: Deck, collection: Record<string, number>): CollectionGapEntry[] {
  const required = new Map<string, number>();
  for (const [id, count] of Object.entries(deck.cards)) {
    required.set(id, (required.get(id) ?? 0) + count);
  }
  for (const [id, count] of Object.entries(deck.sideboard)) {
    required.set(id, (required.get(id) ?? 0) + count);
  }
  return [...required.entries()]
    .map(([id, need]) => ({ card: getCard(id), need, owned: collection[id] ?? 0 }))
    .filter((entry): entry is CollectionGapEntry => Boolean(entry.card))
    .sort((a, b) => a.card.displayName.localeCompare(b.card.displayName));
}

export function missingCards(deck: Deck, collection: Record<string, number>): CollectionGapEntry[] {
  return collectionGap(deck, collection).filter((entry) => entry.owned < entry.need);
}
