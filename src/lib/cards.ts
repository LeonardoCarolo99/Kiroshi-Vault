import cardsJson from "@/data/cards.json";
import metaJson from "@/data/card-meta.json";
import type {
  Card,
  CardColor,
  CardMeta,
  CollectionFilters,
  Deck,
  DeckValidation,
  SortKey,
  ValidationIssue,
} from "@/lib/types";

export const cards = (cardsJson as Card[]).slice().sort((a, b) =>
  a.displayName.localeCompare(b.displayName),
);
export const cardMeta = metaJson as CardMeta;

export const cardsById = new Map(cards.map((card) => [card.id, card]));
export const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));

export const COLORS: CardColor[] = ["Red", "Blue", "Green", "Yellow"];
export const TYPES = ["Legend", "Unit", "Gear", "Program"] as const;
export const RARITY_ORDER = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Nova Rare",
  "Secret",
];

export const COLOR_HEX: Record<string, string> = {
  Red: "#ff335f",
  Blue: "#37a7ff",
  Green: "#35e08b",
  Yellow: "#f5e400",
};

export const COLOR_DIM: Record<string, string> = {
  Red: "rgba(255, 51, 95, 0.15)",
  Blue: "rgba(55, 167, 255, 0.15)",
  Green: "rgba(53, 224, 139, 0.15)",
  Yellow: "rgba(245, 228, 0, 0.15)",
};

export const RARITY_COLOR: Record<string, string> = {
  Common: "#8b9bb4",
  Uncommon: "#44d7b6",
  Rare: "#4da3ff",
  Epic: "#c084fc",
  "Nova Rare": "#ffb020",
  Secret: "#ff335f",
};

export function getCard(id: string | null | undefined): Card | undefined {
  return id ? cardsById.get(id) : undefined;
}

export function getCardmarketUrl(card: Card): string {
  const base = "https://www.cardmarket.com/en/Cyberpunk/Products/Singles";
  const setName = card.set.name
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "-");
  const setPath = encodeURIComponent(setName);
  
  if (card.slug) {
    return `${base}/${setPath}/${card.slug}`;
  }
  
  const cardName = card.subname ? `${card.name} ${card.subname}` : card.name;
  let cardPath = cardName
    .replace(/'/g, "-")
    .replace(/:/g, "-")
    .replace(/,/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  
  cardPath = encodeURIComponent(cardPath);
  return `${base}/${setPath}/${cardPath}`;
}

export function cardCopyKey(card: Card): string {
  return `${card.name}::${card.subname}`;
}

export function cardSubtitle(card: Card): string {
  return card.subname ? `${card.name}: ${card.subname}` : card.name;
}

export function cardsForType(type: string): Card[] {
  return cards.filter((card) => card.type === type);
}

export function searchCards(query: string, source: Card[] = cards): Card[] {
  const q = query.trim().toLowerCase();
  if (!q) return source;
  return source.filter((card) => {
    const haystack = [
      card.name,
      card.subname,
      card.displayName,
      card.type,
      card.color,
      card.rarity,
      card.set.name,
      ...card.classifications,
      ...card.keywords,
      card.rulesText,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterCards(
  list: Card[],
  filters: CollectionFilters,
  owned: Record<string, number>,
): Card[] {
  const searched = searchCards(filters.query, list);
  return searched.filter((card) => {
    if (filters.colors.length && (!card.color || !filters.colors.includes(card.color))) return false;
    if (filters.types.length && !filters.types.includes(card.type)) return false;
    if (filters.rarities.length && !filters.rarities.includes(card.rarity)) return false;
    if (filters.sets.length && !filters.sets.includes(card.set.code)) return false;
    if (
      filters.classifications.length &&
      !card.classifications.some((tag) => filters.classifications.includes(tag))
    ) {
      return false;
    }
    if (filters.keywords.length && !card.keywords.some((keyword) => filters.keywords.includes(keyword))) {
      return false;
    }
    if (filters.costs.length) {
      const cost = card.cost == null ? "x" : String(card.cost);
      if (!filters.costs.includes(cost)) return false;
    }
    if (filters.rams.length) {
      const ram = card.ram == null ? "x" : String(card.ram);
      if (!filters.rams.includes(ram)) return false;
    }
    const count = owned[card.id] ?? 0;
    if (filters.owned === "owned" && count <= 0) return false;
    if (filters.owned === "missing" && count > 0) return false;
    return true;
  });
}

export function sortCards(list: Card[], sort: SortKey, owned: Record<string, number>): Card[] {
  const sorted = list.slice();
  sorted.sort((a, b) => {
    switch (sort) {
      case "name-desc":
        return b.displayName.localeCompare(a.displayName);
      case "cost-asc":
        return (a.cost ?? 99) - (b.cost ?? 99) || a.displayName.localeCompare(b.displayName);
      case "cost-desc":
        return (b.cost ?? -1) - (a.cost ?? -1) || a.displayName.localeCompare(b.displayName);
      case "power-desc":
        return (b.power ?? -1) - (a.power ?? -1) || a.displayName.localeCompare(b.displayName);
      case "ram-asc":
        return (a.ram ?? 99) - (b.ram ?? 99) || a.displayName.localeCompare(b.displayName);
      case "rarity":
        return (
          (RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity)) ||
          a.displayName.localeCompare(b.displayName)
        );
      case "owned-desc":
        return (owned[b.id] ?? 0) - (owned[a.id] ?? 0) || a.displayName.localeCompare(b.displayName);
      default:
        return a.displayName.localeCompare(b.displayName);
    }
  });
  return sorted;
}

export function deckColorSet(deck: Deck): CardColor[] {
  const colors = new Set<CardColor>();
  for (const id of deck.legendIds) {
    const card = getCard(id);
    if (card?.color) colors.add(card.color);
  }
  return COLORS.filter((color) => colors.has(color));
}

export function deckTotal(deck: Deck): number {
  return Object.values(deck.cards).reduce((sum, count) => sum + count, 0);
}

export function sideboardTotal(deck: Deck): number {
  return Object.values(deck.sideboard).reduce((sum, count) => sum + count, 0);
}

export function deckUniqueCount(deck: Deck): number {
  return Object.keys(deck.cards).filter((id) => (deck.cards[id] ?? 0) > 0).length;
}

export function validateDeck(deck: Deck): DeckValidation {
  const issues: ValidationIssue[] = [];
  const legends = deck.legendIds.map((id) => getCard(id)).filter(Boolean) as Card[];
  const mainEntries = Object.entries(deck.cards).filter(([, count]) => count > 0);
  const sideEntries = Object.entries(deck.sideboard).filter(([, count]) => count > 0);
  const mainCount = mainEntries.reduce((sum, [, count]) => sum + count, 0);
  const sideboardCount = sideEntries.reduce((sum, [, count]) => sum + count, 0);

  if (legends.length !== 3) {
    issues.push({
      id: "legend-count",
      severity: "error",
      message: `Add exactly 3 Legends (${legends.length}/3 selected).`,
    });
  }

  const legendNames = new Map<string, number>();
  for (const legend of legends) {
    legendNames.set(legend.name, (legendNames.get(legend.name) ?? 0) + 1);
  }
  for (const [name, count] of legendNames) {
    if (count > 1) {
      issues.push({
        id: `legend-duplicate-${name}`,
        severity: "error",
        message: `Legends must have unique names — ${name} appears ${count} times.`,
      });
    }
  }

  if (mainCount < 40 || mainCount > 50) {
    issues.push({
      id: "main-count",
      severity: "error",
      message: `Main deck must contain 40–50 cards (currently ${mainCount}).`,
    });
  }

  if (sideboardCount > 0 && sideboardCount !== 7) {
    issues.push({
      id: "sideboard-count",
      severity: "error",
      message: `Sideboard must be exactly 7 cards or empty (currently ${sideboardCount}).`,
    });
  }

  const copies: Record<string, number> = {};
  const allEntries = [...mainEntries, ...sideEntries];
  for (const [id, count] of allEntries) {
    const card = getCard(id);
    if (!card) continue;
    const key = cardCopyKey(card);
    copies[key] = (copies[key] ?? 0) + count;
  }
  for (const [key, count] of Object.entries(copies)) {
    if (count > 3) {
      issues.push({
        id: `copies-${key}`,
        severity: "error",
        message: `No more than 3 copies of ${key.replace("::", ": ")} (currently ${count}).`,
      });
    }
  }

  const ramLimits: Record<string, number> = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
  for (const legend of legends) {
    if (legend.color && typeof legend.ram === "number") {
      ramLimits[legend.color] = (ramLimits[legend.color] ?? 0) + legend.ram;
    }
  }

  const overLimit: DeckValidation["overLimit"] = [];
  for (const [id] of allEntries) {
    const card = getCard(id);
    if (!card?.color || card.ram == null) continue;
    const limit = ramLimits[card.color] ?? 0;
    if (card.ram > limit) {
      overLimit.push({ card, color: card.color, limit });
    }
  }
  if (overLimit.length) {
    issues.push({
      id: "ram-limit",
      severity: "error",
      message: `${overLimit.length} card${overLimit.length === 1 ? "" : "s"} exceed your Legends' RAM limits.`,
    });
  }

  for (const [id] of allEntries) {
    const card = getCard(id);
    if (card?.type === "Legend") {
      issues.push({
        id: `legend-in-main-${id}`,
        severity: "error",
        message: `${card.displayName} is a Legend and cannot be in the main deck or sideboard.`,
      });
    }
  }

  const illegal = allEntries
    .map(([id]) => getCard(id))
    .filter((card): card is Card => Boolean(card))
    .filter((card) => card.legality !== "legal" && card.legalities?.standard !== "legal");
  if (illegal.length) {
    issues.push({
      id: "illegal-cards",
      severity: "warning",
      message: `${illegal.length} card${illegal.length === 1 ? "" : "s"} are not marked Standard legal.`,
    });
  }

  const colorCounts: Record<string, number> = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
  const costCurve: Record<string, number> = {};
  for (const [id, count] of mainEntries) {
    const card = getCard(id);
    if (!card) continue;
    if (card.color) colorCounts[card.color] = (colorCounts[card.color] ?? 0) + count;
    const cost = card.cost == null ? "X" : String(card.cost);
    costCurve[cost] = (costCurve[cost] ?? 0) + count;
  }

  return {
    legal: issues.every((issue) => issue.severity !== "error"),
    issues,
    legendCount: legends.length,
    mainCount,
    sideboardCount: sideboardCount,
    copies,
    ramLimits,
    overLimit,
    colorCounts,
    costCurve,
  };
}

export function deckValidationSummary(deck: Deck): {
  legal: boolean;
  mainCount: number;
  sideboardCount: number;
  issueCount: number;
} {
  const validation = validateDeck(deck);
  return {
    legal: validation.legal,
    mainCount: validation.mainCount,
    sideboardCount: validation.sideboardCount,
    issueCount: validation.issues.filter((issue) => issue.severity === "error").length,
  };
}
