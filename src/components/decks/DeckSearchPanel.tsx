"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { Card, DeckValidation } from "@/lib/types";
import { COLOR_HEX, cards, searchCards } from "@/lib/cards";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/utils";

type Target = "main" | "sideboard";

export function DeckSearchPanel({
  validation,
  target,
  onTargetChange,
  onAdd,
  onInspect,
  collection,
}: {
  validation: DeckValidation;
  target: Target;
  onTargetChange: (target: Target) => void;
  onAdd: (card: Card) => void;
  onInspect: (card: Card) => void;
  collection: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<"all" | "Red" | "Blue" | "Green" | "Yellow">("all");
  const [type, setType] = useState<"all" | "Unit" | "Gear" | "Program">("all");
  const [showFilters, setShowFilters] = useState(false);

  const pool = useMemo(() => cards.filter((card) => card.type !== "Legend"), []);

  const results = useMemo(() => {
    let list = searchCards(query, pool);
    if (color !== "all") list = list.filter((card) => card.color === color);
    if (type !== "all") list = list.filter((card) => card.type === type);
    return list.slice(0, 80);
  }, [query, color, type, pool]);

  const ramLimits = validation.ramLimits;
  const targetFull = target === "main" ? validation.mainCount >= 50 : validation.sideboardCount >= 7;

  return (
    <section className="hud-panel flex flex-col overflow-hidden">
      <div className="border-b border-line bg-black/25 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="hud-label text-cp-yellow">Card Scanner</p>
            <p className="font-display mt-0.5 text-sm font-bold uppercase tracking-[0.06em] text-fog">
              Add to Deck
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={cn("icon-btn h-8 w-8", showFilters && "border-cp-yellow/50 text-cp-yellow")}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <Segmented
          className="mt-2.5"
          value={target}
          onChange={onTargetChange}
          options={[
            { value: "main", label: `Main · ${validation.mainCount}/50`, tone: "yellow" },
            { value: "sideboard", label: `Side · ${validation.sideboardCount}/7`, tone: "cyan" },
          ]}
        />
      </div>

      <div className="space-y-2 border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, tag, keyword, rules..."
            className="hud-input h-10 pl-10 pr-9"
            aria-label="Search cards to add"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fog"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {showFilters ? (
          <div className="animate-rise space-y-2 border border-line bg-black/25 p-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setColor("all")}
                className={cn("chip", color === "all" && "chip-active")}
              >
                All colors
              </button>
              {(["Red", "Blue", "Green", "Yellow"] as const).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setColor(entry)}
                  className={cn("chip", color === entry && "chip-active")}
                  style={color === entry ? { borderColor: `${COLOR_HEX[entry]}99`, color: COLOR_HEX[entry] } : undefined}
                >
                  <span className="h-2 w-2" style={{ background: COLOR_HEX[entry] }} />
                  {entry}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
                className="hud-select h-8 text-xs"
                aria-label="Filter by type"
              >
                <option value="all">All types</option>
                <option value="Unit">Unit</option>
                <option value="Gear">Gear</option>
                <option value="Program">Program</option>
              </select>
              <div className="font-mono flex items-center justify-end text-[8px] tracking-[0.1em] text-muted">
                {results.length} SHOWN
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="max-h-[540px] flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted">No cards match that scan.</p>
        ) : (
          results.map((card) => {
            const copies = validation.copies[`${card.name}::${card.subname}`] ?? 0;
            const ramBlocked =
              card.ram != null && card.color != null && card.ram > (ramLimits[card.color] ?? 0);
            const maxed = copies >= 3;
            const disabled = maxed || ramBlocked || targetFull;
            const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
            const owned = collection[card.id] ?? 0;
            return (
              <div
                key={card.id}
                className="flex items-center gap-2 border-b border-line/60 px-2.5 py-1.5 last:border-b-0 hover:bg-white/[0.02]"
              >
                <button
                  type="button"
                  onClick={() => onInspect(card)}
                  className="relative h-12 w-9 shrink-0 overflow-hidden border border-line bg-black/40"
                  aria-label={`Inspect ${card.displayName}`}
                >
                  <Image src={card.image} alt="" fill sizes="36px" className="object-cover" />
                </button>
                <button type="button" onClick={() => onInspect(card)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[12px] font-medium leading-tight text-fog">
                    {card.name}
                    {card.subname ? <span className="text-muted">: {card.subname}</span> : null}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[8px] tracking-[0.06em] text-muted">
                    <span style={{ color }}>{card.color ?? "—"}</span>
                    <span>· {card.type}</span>
                    {card.cost != null ? <span>· C{card.cost}</span> : null}
                    {card.ram != null ? <span>· R{card.ram}</span> : null}
                    {owned > 0 ? <span className="text-cp-green/80">· {owned} owned</span> : null}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  {copies > 0 ? (
                    <span className="font-mono text-[9px] tabular-nums text-cp-yellow">×{copies}</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onAdd(card)}
                    disabled={disabled}
                    title={
                      maxed
                        ? "Maximum 3 copies"
                        : ramBlocked
                          ? `Requires ${card.ram} ${card.color} RAM`
                          : targetFull
                            ? `${target === "main" ? "Main deck" : "Sideboard"} is full`
                            : `Add ${card.displayName}`
                    }
                    className={cn(
                      "flex h-7 w-7 items-center justify-center border transition-colors",
                      disabled
                        ? "border-line text-muted/40"
                        : "border-cp-yellow/40 text-cp-yellow hover:bg-cp-yellow hover:text-void",
                    )}
                    aria-label={`Add ${card.displayName}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-line bg-black/25 px-3 py-2">
        <p className="font-mono text-[8px] leading-relaxed tracking-[0.06em] text-muted/80">
          {targetFull
            ? "TARGET FULL — remove cards or switch target."
            : ramBlockedHint(validation)}
        </p>
      </div>
    </section>
  );
}

function ramBlockedHint(validation: DeckValidation): string {
  const hasLegends = validation.legendCount > 0;
  if (!hasLegends) return "SELECT LEGENDS TO UNLOCK COLORED CARDS.";
  return "GREYED CARDS EXCEED RAM LIMITS OR COPY CAPS.";
}
