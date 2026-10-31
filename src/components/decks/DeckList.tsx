"use client";

import Image from "next/image";
import { Minus, Plus, ShieldPlus, Trash2, UserRound } from "lucide-react";
import type { Card, Deck, DeckValidation } from "@/lib/types";
import { COLOR_HEX, getCard } from "@/lib/cards";
import { cn } from "@/lib/utils";

const TYPE_ORDER = ["Unit", "Gear", "Program"];

function typeRank(type: string): number {
  const index = TYPE_ORDER.indexOf(type);
  return index === -1 ? TYPE_ORDER.length : index;
}

function DeckCardTile({
  card,
  count,
  canIncrease,
  onAdjust,
  onInspect,
  tone = "yellow",
}: {
  card: Card;
  count: number;
  canIncrease: boolean;
  onAdjust: (delta: number) => void;
  onInspect: () => void;
  tone?: "yellow" | "cyan";
}) {
  const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
  return (
    <div className="group relative overflow-hidden border border-line bg-black/40 transition-all hover:border-line-bright hover:shadow-[0_0_0_1px_rgba(245,228,0,0.15)]">
      <button
        type="button"
        onClick={onInspect}
        className="relative block aspect-[5/7] w-full"
        aria-label={`Inspect ${card.displayName}`}
      >
        <Image
          src={card.image}
          alt={card.displayName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="object-cover object-top"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-1.5">
          <p className="truncate text-[9px] font-semibold leading-tight text-fog">
            {card.name}
            {card.subname ? <span className="text-muted">: {card.subname}</span> : null}
          </p>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-[7px] tracking-[0.08em] text-muted">
            <span style={{ color }}>{card.color ?? "—"}</span>
            <span>·</span>
            <span>{card.type}</span>
            {card.cost != null ? (
              <>
                <span>·</span>
                <span>C{card.cost}</span>
              </>
            ) : null}
            {card.ram != null ? (
              <>
                <span>·</span>
                <span>R{card.ram}</span>
              </>
            ) : null}
          </p>
        </div>
      </button>
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
      <div className="absolute left-1 top-1 flex items-center border border-line bg-black/90 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdjust(-1);
          }}
          className="flex h-6 w-6 items-center justify-center text-muted transition-colors hover:bg-white/5 hover:text-cp-red"
          aria-label={`Remove one ${card.displayName}`}
        >
          <Minus className="h-3 w-3" />
        </button>
        <span
          className={cn(
            "font-mono flex h-6 min-w-6 items-center justify-center border-x border-line px-1 text-[10px] tabular-nums",
            tone === "cyan" ? "text-cp-cyan" : "text-cp-yellow",
          )}
        >
          {count}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdjust(1);
          }}
          disabled={!canIncrease}
          className="flex h-6 w-6 items-center justify-center text-muted transition-colors hover:bg-white/5 hover:text-cp-cyan disabled:opacity-25"
          aria-label={`Add one ${card.displayName}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  value,
  target,
  hint,
  tone = "yellow",
}: {
  label: string;
  value: string;
  target: string;
  hint?: string;
  tone?: "cyan" | "yellow" | "green";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-black/25 px-3 py-2">
      <div className="flex items-baseline gap-2">
        <p className="hud-label text-cp-yellow">{label}</p>
        {hint ? <span className="font-mono text-[8px] tracking-[0.1em] text-muted/70">{hint}</span> : null}
      </div>
      <p className="font-mono text-[10px] tracking-[0.1em]">
        <span
          className={cn(
            tone === "yellow" ? "text-cp-yellow" : tone === "green" ? "text-cp-green" : "text-cp-yellow",
          )}
        >
          {value}
        </span>
        <span className="text-muted"> {target}</span>
      </p>
    </div>
  );
}

export function DeckList({
  deck,
  validation,
  legends,
  onOpenLegendPicker,
  onRemoveLegend,
  onAdjust,
  onInspect,
}: {
  deck: Deck;
  validation: DeckValidation;
  legends: Card[];
  onOpenLegendPicker: () => void;
  onRemoveLegend: (card: Card) => void;
  onAdjust: (card: Card, target: "main" | "sideboard", delta: number) => void;
  onInspect: (card: Card) => void;
}) {
  const grouped = new Map<string, { card: Card; count: number }[]>();
  for (const [id, count] of Object.entries(deck.cards)) {
    if (count <= 0) continue;
    const card = getCard(id);
    if (!card) continue;
    const bucket = grouped.get(card.type) ?? [];
    bucket.push({ card, count });
    grouped.set(card.type, bucket);
  }

  const groups = [...grouped.entries()].sort((a, b) => typeRank(a[0]) - typeRank(b[0]));
  for (const [, list] of groups) {
    list.sort(
      (a, b) => (a.card.cost ?? 99) - (b.card.cost ?? 99) || a.card.displayName.localeCompare(b.card.displayName),
    );
  }

  const sideRows = Object.entries(deck.sideboard)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ card: getCard(id), count }))
    .filter((entry): entry is { card: Card; count: number } => Boolean(entry.card));

  const totalMain = validation.mainCount;
  const mainTone = totalMain >= 40 && totalMain <= 50 ? "green" : "yellow";
  const uniqueMain = Object.keys(deck.cards).filter((id) => (deck.cards[id] ?? 0) > 0).length;

  return (
    <div className="space-y-4">
      <section className="hud-panel">
        <SectionHeader label="Legends" value={`${legends.length}/3`} target="selected" hint="Unique names" />
        <div className="grid grid-cols-3 gap-2 p-3">
          {[0, 1, 2].map((index) => {
            const legend = legends[index];
            if (!legend) {
              return (
                <button
                  key={`empty-${index}`}
                  type="button"
                  onClick={onOpenLegendPicker}
                  className="flex aspect-[5/7] flex-col items-center justify-center gap-2 border border-dashed border-line-bright/60 bg-black/20 text-muted transition-colors hover:border-cp-yellow/50 hover:bg-cp-yellow/5 hover:text-cp-yellow"
                >
                  <UserRound className="h-5 w-5" />
                  <span className="font-mono text-[8px] tracking-[0.14em] uppercase">Add Legend</span>
                </button>
              );
            }
            const color = legend.color ? COLOR_HEX[legend.color] : "#7f91a8";
            return (
              <div key={legend.id} className="group relative overflow-hidden border border-line bg-black/40">
                <button
                  type="button"
                  onClick={() => onInspect(legend)}
                  className="relative block aspect-[5/7] w-full"
                  aria-label={`Inspect ${legend.displayName}`}
                >
                  <Image src={legend.image} alt={legend.displayName} fill sizes="140px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-1.5">
                    <p className="truncate text-[9px] font-semibold leading-tight text-fog">{legend.name}</p>
                    <p className="font-mono truncate text-[7px] tracking-[0.06em] text-muted">
                      {legend.color} · RAM {legend.ram ?? "—"}
                    </p>
                  </div>
                </button>
                <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
                <button
                  type="button"
                  onClick={() => onRemoveLegend(legend)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-cp-red/40 bg-black/80 text-cp-red opacity-0 transition-opacity hover:bg-cp-red hover:text-void group-hover:opacity-100"
                  aria-label={`Remove ${legend.displayName}`}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-line px-3 py-2">
          <button
            type="button"
            onClick={onOpenLegendPicker}
            className="font-mono flex w-full items-center justify-center gap-1.5 text-[9px] tracking-[0.14em] text-cp-yellow uppercase hover:underline"
          >
            <ShieldPlus className="h-3 w-3" />
            {legends.length === 3 ? "Review legend squad" : "Select legends"}
          </button>
        </div>
      </section>

      <section className="hud-panel">
        <SectionHeader
          label="Main Deck"
          value={String(totalMain)}
          target="/ 40–50"
          tone={mainTone}
          hint={`${uniqueMain} unique`}
        />
        {groups.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-fog">
              Main deck is empty
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
              Use the card scanner to add Units, Gear, and Programs. Legends do not count toward the 40–50 total.
            </p>
          </div>
        ) : (
          <div>
            {groups.map(([type, list]) => (
              <div key={type}>
                <div className="flex items-center justify-between bg-white/[0.015] px-3 py-1">
                  <span className="font-mono text-[8px] tracking-[0.18em] text-muted uppercase">{type}</span>
                  <span className="font-mono text-[8px] text-muted">
                    {list.reduce((sum, entry) => sum + entry.count, 0)}
                  </span>
                </div>
                {list.map(({ card, count }) => {
                  const key = `${card.name}::${card.subname}`;
                  const canIncrease = (validation.copies[key] ?? 0) < 3 && validation.mainCount < 50;
                  return (
                    <DeckRow
                      key={card.id}
                      card={card}
                      count={count}
                      canIncrease={canIncrease}
                      onAdjust={(delta) => onAdjust(card, "main", delta)}
                      onInspect={() => onInspect(card)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="hud-panel">
        <SectionHeader
          label="Sideboard"
          value={String(validation.sideboardCount)}
          target="/ 7"
          tone={validation.sideboardCount === 0 || validation.sideboardCount === 7 ? "green" : "yellow"}
          hint="Optional · exactly 7 or empty"
        />
        {sideRows.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-muted">
              No sideboard cards. Switch the scanner target to <span className="text-cp-yellow">Sideboard</span> to add
              up to 7.
            </p>
          </div>
        ) : (
          <div>
            {sideRows.map(({ card, count }) => {
              const key = `${card.name}::${card.subname}`;
              const canIncrease = (validation.copies[key] ?? 0) < 3 && validation.sideboardCount < 7;
              return (
                <DeckRow
                  key={card.id}
                  card={card}
                  count={count}
                  canIncrease={canIncrease}
                  tone="cyan"
                  onAdjust={(delta) => onAdjust(card, "sideboard", delta)}
                  onInspect={() => onInspect(card)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
