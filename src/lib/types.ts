export type CardColor = "Red" | "Blue" | "Green" | "Yellow";

export type CardType = "Legend" | "Unit" | "Gear" | "Program";

export type Card = {
  id: string;
  slug: string;
  name: string;
  subname: string;
  displayName: string;
  canonicalName: string;
  rulesText: string;
  flavorText: string;
  color: CardColor | null;
  type: CardType | string;
  classifications: string[];
  keywords: string[];
  cost: number | null;
  power: number | null;
  ram: number | null;
  eddies: boolean;
  rarity: string;
  set: { code: string; name: string };
  artist: string;
  printNumber: string;
  legalities: Record<string, string>;
  legality: string;
  image: string;
  printingCount: number;
};

export type CardMeta = {
  generatedAt: string;
  count: number;
  sets: { code: string; name: string }[];
  colors: string[];
  types: string[];
  rarities: string[];
  classifications: string[];
  keywords: string[];
};

export type Deck = {
  id: string;
  name: string;
  description: string;
  legendIds: string[];
  cards: Record<string, number>;
  sideboard: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

export type MatchResult = "win" | "loss" | "draw";

export type MatchRecord = {
  id: string;
  date: string;
  format: string;
  deckId: string;
  opponentName: string;
  opponentDeck: string;
  result: MatchResult;
  gamesWon: number;
  gamesLost: number;
  playDraw: "play" | "draw" | "unknown";
  store: string;
  notes: string;
  createdAt: string;
};

export type CollectionFilters = {
  query: string;
  colors: string[];
  types: string[];
  rarities: string[];
  sets: string[];
  classifications: string[];
  keywords: string[];
  costs: string[];
  rams: string[];
  owned: "all" | "owned" | "missing";
};

export type SortKey =
  | "name-asc"
  | "name-desc"
  | "cost-asc"
  | "cost-desc"
  | "power-desc"
  | "ram-asc"
  | "rarity"
  | "owned-desc";

export type ValidationIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
};

export type DeckValidation = {
  legal: boolean;
  issues: ValidationIssue[];
  legendCount: number;
  mainCount: number;
  sideboardCount: number;
  copies: Record<string, number>;
  ramLimits: Record<string, number>;
  overLimit: { card: Card; color: string; limit: number }[];
  colorCounts: Record<string, number>;
  costCurve: Record<string, number>;
};
