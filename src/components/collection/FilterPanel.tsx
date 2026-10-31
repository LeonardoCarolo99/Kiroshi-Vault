"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import type { CollectionFilters, SortKey } from "@/lib/types";
import { COLORS, COLOR_HEX, cardMeta } from "@/lib/cards";
import { cn } from "@/lib/utils";

type FilterPanelProps = {
  filters: CollectionFilters;
  onChange: (filters: CollectionFilters) => void;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  open: boolean;
  onToggle: () => void;
  resultCount: number;
  totalCount: number;
};

const COSTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const RAMS = ["1", "2", "3", "4", "5", "6"];
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "cost-asc", label: "Cost low → high" },
  { value: "cost-desc", label: "Cost high → low" },
  { value: "power-desc", label: "Power high → low" },
  { value: "ram-asc", label: "RAM low → high" },
  { value: "rarity", label: "Rarity" },
  { value: "owned-desc", label: "Owned count" },
];

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function activeCount(filters: CollectionFilters): number {
  return (
    filters.colors.length +
    filters.types.length +
    filters.rarities.length +
    filters.sets.length +
    filters.classifications.length +
    filters.keywords.length +
    filters.costs.length +
    filters.rams.length +
    (filters.owned === "all" ? 0 : 1)
  );
}

function Chip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("chip", active && "chip-active")}>
      {dot ? <span className="h-2 w-2" style={{ background: dot }} /> : null}
      {children}
    </button>
  );
}

export function FilterPanel({
  filters,
  onChange,
  sort,
  onSort,
  open,
  onToggle,
  resultCount,
  totalCount,
}: FilterPanelProps) {
  const count = activeCount(filters);
  const set = (patch: Partial<CollectionFilters>) => onChange({ ...filters, ...patch });
  const clear = () =>
    onChange({
      query: "",
      colors: [],
      types: [],
      rarities: [],
      sets: [],
      classifications: [],
      keywords: [],
      costs: [],
      rams: [],
      owned: "all",
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={filters.query}
            onChange={(event) => set({ query: event.target.value })}
            placeholder="Search by name, type, tag, rules text..."
            className="hud-input h-11 pl-10 pr-9"
            aria-label="Search cards"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => set({ query: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fog"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn("btn-cyber shrink-0", open && "!bg-cp-yellow !text-void !border-cp-yellow")}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {count ? (
            <span className="font-mono flex h-4 min-w-4 items-center justify-center bg-cp-yellow px-1 text-[9px] text-void">
              {count}
            </span>
          ) : null}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
        <select
          value={sort}
          onChange={(event) => onSort(event.target.value as SortKey)}
          className="hud-select h-11 w-full sm:w-48"
          aria-label="Sort cards"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {open ? (
        <div className="hud-panel-flat animate-rise space-y-5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="hud-label">Ownership</span>
              <div className="flex border border-line">
                {(["all", "owned", "missing"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set({ owned: value })}
                    className={cn(
                      "font-mono px-3 py-1.5 text-[9px] tracking-[0.12em] uppercase transition-colors",
                      filters.owned === value
                        ? "bg-cp-yellow text-void"
                        : "text-muted hover:bg-white/5 hover:text-fog",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] tracking-[0.12em] text-muted">
                {resultCount} / {totalCount} CARDS
              </span>
              <button type="button" onClick={clear} className="font-mono text-[9px] tracking-[0.12em] text-cp-red hover:underline">
                CLEAR ALL
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="hud-label mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((color) => (
                  <Chip
                    key={color}
                    active={filters.colors.includes(color)}
                    onClick={() => set({ colors: toggleValue(filters.colors, color) })}
                    dot={COLOR_HEX[color]}
                  >
                    {color}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="hud-label mb-2">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {cardMeta.types.map((type) => (
                  <Chip
                    key={type}
                    active={filters.types.includes(type)}
                    onClick={() => set({ types: toggleValue(filters.types, type) })}
                  >
                    {type}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="hud-label mb-1.5 block">Rarity</span>
              <select
                value={filters.rarities[0] ?? ""}
                onChange={(event) => set({ rarities: event.target.value ? [event.target.value] : [] })}
                className="hud-select h-9"
              >
                <option value="">All rarities</option>
                {cardMeta.rarities.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="hud-label mb-1.5 block">Set</span>
              <select
                value={filters.sets[0] ?? ""}
                onChange={(event) => set({ sets: event.target.value ? [event.target.value] : [] })}
                className="hud-select h-9"
              >
                <option value="">All sets</option>
                {cardMeta.sets.map((set) => (
                  <option key={set.code} value={set.code}>
                    {set.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="hud-label mb-1.5 block">Tag</span>
              <select
                value={filters.classifications[0] ?? ""}
                onChange={(event) =>
                  set({ classifications: event.target.value ? [event.target.value] : [] })
                }
                className="hud-select h-9"
              >
                <option value="">All tags</option>
                {cardMeta.classifications.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="hud-label mb-1.5 block">Keyword</span>
              <select
                value={filters.keywords[0] ?? ""}
                onChange={(event) =>
                  set({ keywords: event.target.value ? [event.target.value] : [] })
                }
                className="hud-select h-9"
              >
                <option value="">All keywords</option>
                {cardMeta.keywords.map((keyword) => (
                  <option key={keyword} value={keyword}>
                    {keyword}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="hud-label mb-2">Cost</p>
              <div className="flex flex-wrap gap-1.5">
                {COSTS.map((cost) => (
                  <Chip
                    key={cost}
                    active={filters.costs.includes(cost)}
                    onClick={() => set({ costs: toggleValue(filters.costs, cost) })}
                  >
                    {cost}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="hud-label mb-2">RAM</p>
              <div className="flex flex-wrap gap-1.5">
                {RAMS.map((ram) => (
                  <Chip
                    key={ram}
                    active={filters.rams.includes(ram)}
                    onClick={() => set({ rams: toggleValue(filters.rams, ram) })}
                  >
                    {ram}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
