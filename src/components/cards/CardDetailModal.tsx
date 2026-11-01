"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, Minus, Plus, Star, Wallet } from "lucide-react";
import type { Card } from "@/lib/types";
import { COLOR_HEX, RARITY_COLOR, getCardmarketUrl } from "@/lib/cards";
import { Modal } from "@/components/ui/Modal";
import { Stepper } from "@/components/ui/Stepper";
import { RulesText } from "@/components/cards/RulesText";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

type CardDetailModalProps = {
  card: Card | null;
  owned: number;
  onClose: () => void;
  onAdjust: (card: Card, delta: number) => void;
  deckContext?: {
    deckName: string;
    count: number;
    onAdd: () => void;
    onRemove: () => void;
  };
};

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="border border-line bg-black/25 px-3 py-2">
      <p className="hud-label text-[8px]">{label}</p>
      <p className="font-display mt-1 text-lg leading-none" style={{ color: tone ?? "#e7eef7" }}>
        {value}
      </p>
    </div>
  );
}

export function CardDetailModal({ card, owned, onClose, onAdjust, deckContext }: CardDetailModalProps) {
  const { playClick } = useSound();
  const [selectedPrintingIdx, setSelectedPrintingIdx] = useState(0);
  
  if (!card) return null;
  
  const printings = card.printings && card.printings.length > 0 ? card.printings : null;
  const activePrinting = printings ? printings[selectedPrintingIdx] : null;
  const displayImage = activePrinting?.imageUrl || activePrinting?.image || card.image;
  
  const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
  const rarity = activePrinting?.rarity || card.rarity;
  const rarityColor = RARITY_COLOR[rarity] ?? "#7f91a8";
  const artist = activePrinting?.artist || card.artist;
  const printNumber = activePrinting?.collectorNumber || card.printNumber;
  const setName = activePrinting?.set?.name || card.set.name;
  const cardmarketUrl = card.cardmarketUrl || getCardmarketUrl(card);
  const price = card.prices;

  return (
    <Modal open={Boolean(card)} onClose={onClose} size="xl" eyebrow="Card File" title={card.name}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div>
          <div className="relative overflow-hidden border border-line bg-black/40 clip-notch">
            <div className="relative aspect-[5/7]">
              <Image
                src={displayImage}
                alt={card.displayName}
                fill
                sizes="(max-width: 768px) 90vw, 320px"
                className="object-cover"
                priority
              />
            </div>
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: color, boxShadow: `0 0 18px ${color}` }}
            />
          </div>
          
          {printings && printings.length > 1 ? (
            <div className="mt-3 border border-line bg-black/25 p-3">
              <p className="hud-label text-[8px] mb-2">Artwork / Version</p>
              <div className="flex flex-wrap gap-2">
                {printings.map((printing, idx) => (
                  <button
                    key={printing.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedPrintingIdx(idx);
                    }}
                    className={cn(
                      "px-2 py-1 text-[9px] font-mono border transition-colors",
                      selectedPrintingIdx === idx
                        ? "border-cp-yellow/60 bg-cp-yellow/10 text-cp-yellow"
                        : "border-line bg-black/40 text-muted hover:text-fog hover:border-line/80"
                    )}
                  >
                    {printing.collectorNumber || `#${idx + 1}`}
                    {printing.finish ? ` (${printing.finish})` : ""}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-3 border border-line bg-black/25 p-3">
            <div>
              <p className="hud-label text-[8px]">Your Collection</p>
              <p className="font-display mt-1 text-2xl leading-none text-cp-yellow">
                {owned}
                <span className="ml-1 text-xs text-muted">owned</span>
              </p>
            </div>
            <Stepper value={owned} onChange={(value) => onAdjust(card, value - owned)} max={99} />
          </div>
          
          {price && (price.eur || price.lowEur || price.avgEur || price.trendEur) ? (
            <div className="mt-3 border border-cp-green/25 bg-cp-green/5 p-3">
              <p className="hud-label text-[8px] text-cp-green">Market Price (EUR)</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {price.eur != null && (
                  <div>
                    <p className="text-[8px] text-muted">Price</p>
                    <p className="font-display text-lg text-fog">€{price.eur.toFixed(2)}</p>
                  </div>
                )}
                {price.trendEur != null && (
                  <div>
                    <p className="text-[8px] text-muted">Trend</p>
                    <p className="font-display text-lg text-fog">€{price.trendEur.toFixed(2)}</p>
                  </div>
                )}
                {price.lowEur != null && (
                  <div>
                    <p className="text-[8px] text-muted">Low</p>
                    <p className="font-mono text-xs text-fog">€{price.lowEur.toFixed(2)}</p>
                  </div>
                )}
                {price.avgEur != null && (
                  <div>
                    <p className="text-[8px] text-muted">Avg</p>
                    <p className="font-mono text-xs text-fog">€{price.avgEur.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          
          <a
            href={cardmarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClick()}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-cp-cyan/40 bg-cp-cyan/10 px-3 py-2 text-[10px] font-mono tracking-[0.12em] text-cp-cyan transition-colors hover:bg-cp-cyan/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            VIEW ON CARDMARKET
          </a>
          {deckContext ? (
            <div className="mt-3 border border-cp-yellow/25 bg-cp-yellow/5 p-3">
              <p className="hud-label text-[8px] text-cp-yellow">{deckContext.deckName}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-xs text-fog">{deckContext.count} in deck</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      playClick();
                      deckContext.onRemove();
                    }}
                    aria-label="Remove from deck"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      playClick();
                      deckContext.onAdd();
                    }}
                    aria-label="Add to deck"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge" style={{ borderColor: `${color}66`, color }}>
              {card.color ?? "Colorless"}
            </span>
            <span
              className={cn(
                "badge font-bold",
                card.type === "Unit" && "border-cp-cyan/80 bg-cp-cyan/15 text-cp-cyan",
                card.type === "Gear" && "border-orange-400/80 bg-orange-400/15 text-orange-400",
                card.type === "Program" && "border-violet-400/80 bg-violet-400/15 text-violet-400",
                card.type === "Event" && "border-pink-400/80 bg-pink-400/15 text-pink-400",
                card.type === "Action" && "border-amber-300/80 bg-amber-300/15 text-amber-300",
                card.type === "Resource" && "border-lime-400/80 bg-lime-400/15 text-lime-400",
                card.type === "Upgrade" && "border-sky-400/80 bg-sky-400/15 text-sky-400",
                !["Unit", "Gear", "Program", "Event", "Action", "Resource", "Upgrade"].includes(card.type) &&
                  "text-fog"
              )}
            >
              {card.type}
            </span>
            <span className="badge" style={{ borderColor: `${rarityColor}66`, color: rarityColor }}>
              {rarity}
            </span>
            <span className="badge">{setName}</span>
          </div>

          <h3 className="font-display mt-4 text-2xl font-bold uppercase leading-tight tracking-[0.04em] text-fog">
            {card.displayName}
          </h3>
          {card.subname ? <p className="mt-1 text-sm text-muted">{card.subname}</p> : null}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Cost" value={card.cost ?? "—"} tone="#f5e400" />
            <Stat label="Power" value={card.power ?? "—"} tone="#ff335f" />
            <Stat label="RAM" value={card.ram ?? "—"} tone="#00e5ff" />
            <Stat
              label="Sellable"
              value={
                card.eddies ? (
                  <span className="flex items-center gap-1 text-cp-yellow">
                    <Wallet className="h-4 w-4" /> YES
                  </span>
                ) : (
                  "NO"
                )
              }
            />
          </div>

          <div className="mt-5 border border-line bg-black/20 p-4">
            <p className="hud-label mb-3 text-cp-yellow">Rules Text</p>
            <RulesText text={card.rulesText} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-line bg-black/20 p-3">
              <p className="hud-label text-[8px]">Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {card.classifications.length ? (
                  card.classifications.map((tag) => (
                    <span key={tag} className="chip !py-1 !text-[8px]">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted">None</span>
                )}
              </div>
            </div>
            <div className="border border-line bg-black/20 p-3">
              <p className="hud-label text-[8px]">Keywords</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {card.keywords.length ? (
                  card.keywords.map((keyword) => (
                    <span key={keyword} className="chip chip-active !py-1 !text-[8px]">
                      <Star className="h-2.5 w-2.5" />
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted">None</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3 font-mono text-[9px] tracking-[0.08em] text-muted">
            <span>SET: {setName}</span>
            <span>PRINT: {printNumber || "—"}</span>
            <span>ARTIST: {artist || "—"}</span>
            <span className={cn(card.legality === "legal" ? "text-cp-green" : "text-cp-red")}>
              STANDARD: {card.legality.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
