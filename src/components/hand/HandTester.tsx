"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Dices,
  Eye,
  Hand,
  Layers3,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Swords,
} from "lucide-react";
import type { Card } from "@/lib/types";
import { useVaultStore } from "@/lib/store";
import { COLOR_HEX, deckValidationSummary, getCard } from "@/lib/cards";
import { deckLegends } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { cn } from "@/lib/utils";

function shuffle<T>(list: T[]): T[] {
  const copy = list.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function expandDeck(cards: Record<string, number>): string[] {
  const pool: string[] = [];
  for (const [id, count] of Object.entries(cards)) {
    for (let index = 0; index < count; index += 1) pool.push(id);
  }
  return pool;
}

function dealFrom(cards: Record<string, number>): string[] {
  return shuffle(expandDeck(cards)).slice(0, 6);
}

export function HandTester() {
  const decks = useVaultStore((state) => state.decks);
  const collection = useVaultStore((state) => state.collection);
  const adjustCollection = useVaultStore((state) => state.adjustCollection);

  const [deckId, setDeckId] = useState(decks[0]?.id ?? "");
  const [hand, setHand] = useState<string[]>(() => (decks[0] ? dealFrom(decks[0].cards) : []));
  const [mulliganUsed, setMulliganUsed] = useState(false);
  const [handCount, setHandCount] = useState(decks[0] ? 1 : 0);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [inspected, setInspected] = useState<Card | null>(null);

  const deck = decks.find((entry) => entry.id === deckId) ?? decks[0];
  const summary = useMemo(() => (deck ? deckValidationSummary(deck) : null), [deck]);
  const legends = useMemo(() => (deck ? deckLegends(deck) : []), [deck]);
  const pool = useMemo(() => (deck ? expandDeck(deck.cards) : []), [deck]);

  const deal = () => {
    if (!deck) return;
    setHand(dealFrom(deck.cards));
    setMulliganUsed(false);
    setRevealed([]);
    setHandCount((count) => count + 1);
  };

  const changeDeck = (id: string) => {
    setDeckId(id);
    const next = decks.find((entry) => entry.id === id);
    if (!next) return;
    setHand(dealFrom(next.cards));
    setMulliganUsed(false);
    setRevealed([]);
    setHandCount((count) => count + 1);
  };

  const mulligan = () => {
    if (!deck || mulliganUsed) return;
    setHand(dealFrom(deck.cards));
    setMulliganUsed(true);
    setRevealed([]);
    setHandCount((count) => count + 1);
  };

  const handCards = hand.map((id) => getCard(id)).filter((card): card is Card => Boolean(card));
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of handCards) counts[card.type] = (counts[card.type] ?? 0) + 1;
    return counts;
  }, [handCards]);
  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of handCards) {
      if (card.color) counts[card.color] = (counts[card.color] ?? 0) + 1;
    }
    return counts;
  }, [handCards]);
  const costCurve = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const card of handCards) {
      if (card.cost == null) continue;
      counts[card.cost] = (counts[card.cost] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([cost, count]) => ({ cost: Number(cost), count }))
      .sort((a, b) => a.cost - b.cost);
  }, [handCards]);
  const totalCost = handCards.reduce((sum, card) => sum + (card.cost ?? 0), 0);

  if (decks.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Simulation // 04"
          title="Hand Tester"
          description="Deal opening hands from any saved deck, take your one mulligan, and reveal your Legends."
        />
        <EmptyState
          icon={<Hand className="h-6 w-6" />}
          title="No deck to test"
          description="The hand tester needs a saved deck. Build a loadout first, then come back to simulate opening hands."
          action={
            <Link href="/decks" className="btn-cyber">
              <Swords className="h-4 w-4" />
              Build a Deck
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Simulation // 04"
        title="Hand Tester"
        description="Six cards, one mulligan, three face-down Legends. Practice the opening decision before you commit at the table."
        actions={
          <span className="badge badge-yellow">
            <Sparkles className="h-3 w-3" />
            Hand #{handCount}
          </span>
        }
      />

      <section className="hud-panel mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="block">
              <span className="hud-label mb-1.5 block">Test Deck</span>
              <select
                value={deck?.id ?? ""}
                onChange={(event) => changeDeck(event.target.value)}
                className="hud-select"
              >
                {decks.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            {deck ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] tracking-[0.08em] text-muted">
                <span>{summary?.mainCount ?? 0} MAIN</span>
                <span>{summary?.sideboardCount ?? 0} SIDE</span>
                <span>{legends.length} LEGENDS</span>
                <span className={summary?.legal ? "text-cp-green" : "text-cp-red"}>
                  {summary?.legal ? "LEGAL" : "NOT LEGAL"}
                </span>
                <span className="flex items-center gap-1">
                  {legends.map((legend) => (
                    <span
                      key={legend.id}
                      className="h-1.5 w-1.5"
                      style={{ background: legend.color ? COLOR_HEX[legend.color] : "#7f91a8" }}
                    />
                  ))}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-cyber" onClick={deal}>
              <Dices className="h-4 w-4" />
              Deal New Hand
            </button>
            <button
              type="button"
              className="btn-cyber"
              onClick={mulligan}
              disabled={mulliganUsed || hand.length === 0}
            >
              <RefreshCw className="h-4 w-4" />
              {mulliganUsed ? "Mulligan Used" : "Mulligan"}
            </button>
            <button
              type="button"
              className="btn-cyber btn-cyber-ghost"
              onClick={() => setRevealed(revealed.length === 3 ? [] : [0, 1, 2])}
            >
              <Eye className="h-4 w-4" />
              {revealed.length === 3 ? "Hide Legends" : "Reveal Legends"}
            </button>
          </div>
        </div>
        {pool.length < 6 ? (
          <p className="mt-3 flex items-center gap-2 border border-cp-red/30 bg-cp-red/5 px-3 py-2 text-[11px] text-cp-red">
            <ShieldAlert className="h-3.5 w-3.5" />
            This deck has fewer than 6 main-deck cards. Add cards in the builder before testing.
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {/* Legends */}
          <section className="hud-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="hud-label text-cp-yellow">Legends Area</p>
                <p className="font-display mt-0.5 text-sm font-bold uppercase tracking-[0.06em] text-fog">
                  Face-Down Squad
                </p>
              </div>
              <button
                type="button"
                className="font-mono flex items-center gap-1 text-[9px] tracking-[0.12em] text-cp-yellow uppercase hover:underline"
                onClick={() => setRevealed(revealed.length === 3 ? [] : [0, 1, 2])}
              >
                <Eye className="h-3 w-3" />
                {revealed.length === 3 ? "Hide" : "Reveal all"}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-md">
              {[0, 1, 2].map((index) => {
                const legend = legends[index];
                const isRevealed = revealed.includes(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setRevealed((current) =>
                        current.includes(index) ? current.filter((entry) => entry !== index) : [...current, index],
                      )
                    }
                    className="group relative aspect-[5/7] overflow-hidden border border-line bg-black/40"
                    aria-label={isRevealed ? "Hide legend" : "Reveal legend"}
                  >
                    {legend && isRevealed ? (
                      <Image src={legend.image} alt={legend.displayName} fill sizes="180px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_35%,rgba(245,228,0,0.12),transparent_65%)]">
                        <Layers3 className="h-6 w-6 text-cp-yellow/70" />
                        <span className="font-mono text-[8px] tracking-[0.16em] text-muted uppercase">Legend {index + 1}</span>
                        <span className="font-display text-2xl text-cp-yellow/30">?</span>
                      </span>
                    )}
                    {legend && isRevealed ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-1.5">
                          <p className="truncate text-[9px] font-semibold text-fog">{legend.name}</p>
                          <p className="font-mono text-[7px] text-muted">
                            {legend.color} · RAM {legend.ram}
                          </p>
                        </div>
                      </>
                    ) : null}
                    <span className="absolute inset-x-0 top-0 h-0.5 bg-cp-yellow/50" />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 font-mono text-[8px] leading-relaxed tracking-[0.06em] text-muted/70">
              LEGENDS BEGIN FACE-DOWN IN RANDOM ORDER · CALL ONE BY SPENDING 1 €$ · SPEND A LEGEND FOR 1 €$
            </p>
          </section>

          {/* Hand */}
          <section className="hud-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="hud-label text-cp-yellow">Opening Hand</p>
                <p className="font-display mt-0.5 text-sm font-bold uppercase tracking-[0.06em] text-fog">
                  {handCards.length} Cards
                </p>
              </div>
              <span className={cn("badge", mulliganUsed ? "badge-red" : "badge-green")}>
                {mulliganUsed ? "Mulligan used" : "Mulligan ready"}
              </span>
            </div>

            {handCards.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center border border-dashed border-line px-6 py-10 text-center">
                <Dices className="h-7 w-7 text-muted/60" />
                <p className="font-display mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-fog">
                  No hand dealt
                </p>
                <button type="button" className="btn-cyber mt-4" onClick={deal}>
                  <Dices className="h-4 w-4" />
                  Deal Hand
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {handCards.map((card, index) => {
                  const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
                  return (
                    <button
                      key={`${card.id}-${index}`}
                      type="button"
                      onClick={() => setInspected(card)}
                      className="group relative overflow-hidden border border-line bg-black/40 text-left transition-transform hover:-translate-y-1 hover:border-line-bright"
                    >
                      <div className="relative aspect-[5/7]">
                        <Image src={card.image} alt={card.displayName} fill sizes="160px" className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                        <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
                        <div className="absolute inset-x-0 bottom-0 p-1.5">
                          <p className="truncate text-[9px] font-semibold leading-tight text-fog">{card.name}</p>
                          <p className="font-mono text-[7px] text-muted">
                            {card.cost != null ? `C${card.cost}` : card.type}
                            {card.ram != null ? ` · R${card.ram}` : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {handCards.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <button type="button" className="btn-cyber btn-cyber-ghost !min-h-8 !py-1.5 !text-[9px]" onClick={deal}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reshuffle
                </button>
                <p className="font-mono text-[8px] tracking-[0.1em] text-muted">
                  CLICK A CARD TO INSPECT · ONE MULLIGAN PER HAND
                </p>
              </div>
            ) : null}
          </section>
        </div>

        {/* Analysis */}
        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="hud-panel p-4">
            <p className="hud-label text-cp-yellow">Hand Analysis</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="border border-line bg-black/20 p-2.5">
                <p className="hud-label text-[8px]">Total Cost</p>
                <p className="font-display mt-1 text-xl leading-none text-cp-yellow">{totalCost}</p>
              </div>
              <div className="border border-line bg-black/20 p-2.5">
                <p className="hud-label text-[8px]">Avg Cost</p>
                <p className="font-display mt-1 text-xl leading-none text-cp-cyan">
                  {handCards.length ? (totalCost / handCards.length).toFixed(1) : "—"}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="hud-label mb-1.5">Composition</p>
              <div className="space-y-1">
                {(["Unit", "Gear", "Program"] as const).map((type) => (
                  <div key={type} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">{type}</span>
                    <span className="font-mono text-fog">{typeCounts[type] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="hud-label mb-1.5">Colors</p>
              <div className="flex flex-wrap gap-1.5">
                {(["Red", "Blue", "Green", "Yellow"] as const).map((color) => (
                  <span
                    key={color}
                    className="font-mono flex items-center gap-1 border px-1.5 py-1 text-[8px] tracking-[0.08em]"
                    style={{
                      borderColor: colorCounts[color] ? `${COLOR_HEX[color]}55` : "#1c2a3a",
                      color: colorCounts[color] ? COLOR_HEX[color] : "#56667a",
                    }}
                  >
                    <span className="h-1.5 w-1.5" style={{ background: colorCounts[color] ? COLOR_HEX[color] : "#1c2a3a" }} />
                    {color} {colorCounts[color] ?? 0}
                  </span>
                ))}
              </div>
            </div>

            {costCurve.length ? (
              <div className="mt-3">
                <p className="hud-label mb-1.5">Cost Curve</p>
                <div className="space-y-1">
                  {costCurve.map((entry) => (
                    <div key={entry.cost} className="flex items-center gap-2">
                      <span className="font-mono w-3 text-[9px] text-muted">{entry.cost}</span>
                      <div className="h-1.5 flex-1 overflow-hidden bg-white/5">
                        <div
                          className="h-full bg-cp-yellow/70"
                          style={{ width: `${(entry.count / handCards.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono w-3 text-right text-[9px] text-muted">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="hud-panel p-4">
            <p className="hud-label text-cp-yellow">Protocol</p>
            <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
              <li className="flex gap-2">
                <span className="font-mono text-cp-cyan">01</span>
                Draw 6 cards for your opening hand.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-cp-cyan">02</span>
                You may take one mulligan: shuffle your hand back and draw 6 new cards.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-cp-cyan">03</span>
                Your 3 Legends begin face-down in a random order.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-cp-cyan">04</span>
                The first player starts with 2 Legends spent.
              </li>
            </ul>
          </section>
        </div>
      </div>

      <CardDetailModal
        card={inspected}
        owned={inspected ? (collection[inspected.id] ?? 0) : 0}
        onClose={() => setInspected(null)}
        onAdjust={(card, delta) => adjustCollection(card.id, delta)}
      />
    </div>
  );
}
