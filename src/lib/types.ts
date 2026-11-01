export type CardColor = "Red" | "Blue" | "Green" | "Yellow";

export type CardType = "Legend" | "Unit" | "Gear" | "Program";

export type CardPrinting = {
  id: string;
  collectorNumber: string;
  image: string;
  imageUrl?: string;
  set: { code: string; name: string };
  rarity: string;
  artist: string;
  finish?: string | null;
  language?: string;
};

export type CardPrice = {
  eur?: number | null;
  trendEur?: number | null;
  lowEur?: number | null;
  avgEur?: number | null;
  updatedAt?: string;
  soldCount?: number | null;
  salesCount?: number | null;
  sold?: number | null;
};

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
  printings?: CardPrinting[];
  prices?: CardPrice;
  cardmarketUrl?: string;
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
  public?: boolean;
};

export type MeleeAccount = {
  profileId?: string;
  username?: string;
  profileUrl?: string;
  linkedAt?: string;
  lastSyncedAt?: string;
};

export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  avatarId?: string;
  meleeAccount?: MeleeAccount | null;
};

export const AVATAR_OPTIONS = [
  { id: "avatar-01", label: "Ripperdoc" },
  { id: "avatar-02", label: "Solo" },
  { id: "avatar-03", label: "Netrunner" },
  { id: "avatar-04", label: "Techie" },
  { id: "avatar-05", label: "Nomad" },
  { id: "avatar-06", label: "Corpo" },
] as const;

export type Friend = {
  uid: string;
  friendCode?: string;
  addedAt: string;
};

export type MatchResult = "win" | "loss" | "draw";

export type MatchType = "casual" | "tournament";

export type MatchRecord = {
  id: string;
  type?: MatchType;
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
  tournamentId?: string;
  tournamentName?: string;
  round?: number | string;
  tableNumber?: number | string;
  pairingId?: string;
  eventId?: string;
  venue?: string;
};

export type TournamentStatus = "upcoming" | "ongoing" | "completed";

export type TournamentPairing = {
  pairingId: string;
  round: number | string;
  opponentName: string;
  opponentDeck?: string;
  tableNumber?: number | string;
  result?: MatchResult | "not-reported";
  gamesWon?: number;
  gamesLost?: number;
  matchId?: string;
};

export type Tournament = {
  id: string;
  name: string;
  status: TournamentStatus;
  format: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  location?: string;
  store?: string;
  deckId?: string;
  pairings: TournamentPairing[];
  playerRecord?: { wins: number; losses: number; draws: number; gamesWon?: number; gamesLost?: number };
  createdAt: string;
  updatedAt: string;
  meleeTournamentId?: string;
  meleeUrl?: string;
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

export type BuyListPriority = "low" | "normal" | "high" | "urgent";

export type BuyListEntry = {
  id: string;
  listId?: string;
  cardId: string;
  quantity: number;
  priority: BuyListPriority;
  notes: string;
  obtained: number;
  createdAt: string;
  updatedAt: string;
};

export type BuyList = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readBy?: string[];
};

export type ChatConversation = {
  id: string;
  participants: string[];
  participantDetails?: Record<string, { friendCode?: string; displayName?: string }>;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  updatedAt: string;
  createdAt: string;
};

export type VaultSnapshot = {
  collection?: Record<string, number>;
  decks?: Deck[];
  matches?: unknown[];
  buyList?: BuyListEntry[];
  buyLists?: BuyList[];
  friends?: Friend[];
  friendCode?: string | null;
};
