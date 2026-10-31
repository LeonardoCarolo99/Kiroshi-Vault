"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Eye, LayoutGrid, List, Layers3, SearchX, Sparkles } from "lucide-react";
import type { Card, CollectionFilters, SortKey } from "@/lib/types";
import { cards, filterCards, sortCards, COLOR_HEX, RARITY_COLOR } from "@/lib/cards";
import { useVaultStore } from "@/lib/store";
import { CardTile } from "@/components/cards/CardTile";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { FilterPanel } from "@/components/collection/FilterPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Stepper } from "@/components/ui/Stepper";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const DEFAULT_FILTERS: CollectionFilters = {
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
};

export function CollectionView() {
  const collection = useVaultStore((state) => state.collection);
  const adjustCollection = useVaultStore((state) => state.adjustCollection);
  const setCollectionCount = useVaultStore((state) => state.setCollectionCount);

  const [filters, setFilters] = useState<CollectionFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Card | null>(null);

  const visible = useMemo(() => {
    return sortCards(filterCards(cards, filters, collection), sort, collection);
  }, [filters, sort, collection]);

  const ownedUnique = useMemo(
    () => cards.filter((card) => (collection[card.id] ?? 0) > 0).length,
    [collection],
  );
  const totalCopies = useMemo(
    () => Object.values(collection).reduce((sum, count) => sum + count, 0),
    [collection],
  );
  const completion = Math.round((ownedUnique / cards.length) * 100);

  const handleAdjust = (card: Card, delta: number) => adjustCollection(card.id, delta);

  return (
    <div>
      <PageHeader
        eyebrow="Archive // 01"
        title="Collection"
        description="Every card in Night City, indexed. Log what you own and track your run to a full set."
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-yellow">
              <Sparkles className="h-3 w-3" />
              {ownedUnique} / {cards.length} unique
            </span>
            <span className="badge badge-cyan">{totalCopies} copies</span>
          </div>
        }
      />

      <section className="hud-panel mb-4 grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="hud-label">Vault Completion</p>
              <p className="font-display mt-1 text-3xl leading-none text-cp-yellow">
                {completion}
                <span className="ml-1 text-base text-muted">%</span>
              </p>
            </div>
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted">
              {cards.length - ownedUnique} CARDS REMAINING
            </p>
          </div>
          <ProgressBar value={ownedUnique} max={cards.length} color="#f5e400" className="mt-3" />
        </div>
        <div className="grid grid-cols-4 gap-3 border-t border-line pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          {(["Red", "Blue", "Green", "Yellow"] as const).map((color) => {
            const pool = cards.filter((card) => card.color === color);
            const owned = pool.filter((card) => (collection[card.id] ?? 0) > 0).length;
            return (
              <div key={color}>
                <p className="hud-label text-[8px]" style={{ color: COLOR_HEX[color] }}>
                  {color}
                </p>
                <p className="font-display mt-1 text-lg leading-none text-fog">
                  {owned}
                  <span className="text-[10px] text-muted">/{pool.length}</span>
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSort={setSort}
        open={filtersOpen}
        onToggle={() => setFiltersOpen((value) => !value)}
        resultCount={visible.length}
        totalCount={cards.length}
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          {visible.length} result{visible.length === 1 ? "" : "s"}
        </p>
        <div className="flex border border-line bg-black/30">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "flex h-8 w-9 items-center justify-center transition-colors",
              view === "grid" ? "bg-cp-yellow/15 text-cp-yellow" : "text-muted hover:text-fog",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex h-8 w-9 items-center justify-center border-l border-line transition-colors",
              view === "list" ? "bg-cp-yellow/15 text-cp-yellow" : "text-muted hover:text-fog",
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<SearchX className="h-6 w-6" />}
          title="No matches"
          description="No cards in the archive match this filter set. Clear a few filters and scan again."
          action={
            <button type="button" className="btn-cyber" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Reset filters
            </button>
          }
        />
      ) : view === "grid" ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {visible.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              owned={collection[card.id] ?? 0}
              onOpen={setSelected}
              onAdjust={handleAdjust}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-line border border-line bg-black/20">
          {visible.map((card) => {
            const owned = collection[card.id] ?? 0;
            const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
            return (
              <div
                key={card.id}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.025]"
              >
                <button
                  type="button"
                  onClick={() => setSelected(card)}
                  className="relative h-14 w-10 shrink-0 overflow-hidden border border-line bg-black/40"
                  aria-label={`Inspect ${card.displayName}`}
                >
                  <Image src={card.image} alt="" fill sizes="40px" className="object-cover" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setSelected(card)}
                    className="block max-w-full truncate text-left"
                  >
                    <span className="font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-fog">
                      {card.name}
                    </span>
                    {card.subname ? (
                      <span className="ml-1.5 text-[11px] text-muted">{card.subname}</span>
                    ) : null}
                  </button>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9px] tracking-[0.08em] text-muted">
                    <span style={{ color }}>{card.color ?? "—"}</span>
                    <span>·</span>
                    <span>{card.type}</span>
                    <span>·</span>
                    <span style={{ color: RARITY_COLOR[card.rarity] ?? "#7f91a8" }}>{card.rarity}</span>
                    {card.cost != null ? <span>· C{card.cost}</span> : null}
                    {card.power != null ? <span>· P{card.power}</span> : null}
                    {card.ram != null ? <span>· R{card.ram}</span> : null}
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="hud-label text-[8px]">Owned</span>
                  <Stepper
                    compact
                    value={owned}
                    onChange={(value) => setCollectionCount(card.id, value)}
                    label={`Owned copies of ${card.displayName}`}
                  />
                </div>
                <button
                  type="button"
                  className="icon-btn shrink-0"
                  onClick={() => setSelected(card)}
                  aria-label={`Inspect ${card.displayName}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {view === "grid" && visible.length > 0 ? (
        <p className="mt-6 flex items-center justify-center gap-2 font-mono text-[9px] tracking-[0.18em] text-muted/60 uppercase">
          <Layers3 className="h-3 w-3" />
          End of archive · {visible.length} entries
        </p>
      ) : null}

      <CardDetailModal
        card={selected}
        owned={selected ? (collection[selected.id] ?? 0) : 0}
        onClose={() => setSelected(null)}
        onAdjust={handleAdjust}
      />
    </div>
  );
}
