"use client";

import Image from "next/image";
import { Minus, Plus, Star, Wallet } from "lucide-react";
import type { Card } from "@/lib/types";
import { COLOR_HEX, RARITY_COLOR } from "@/lib/cards";
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
  if (!card) return null;
  const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
  const rarity = RARITY_COLOR[card.rarity] ?? "#7f91a8";

  return (
    <Modal open={Boolean(card)} onClose={onClose} size="xl" eyebrow="Card File" title={card.name}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div>
          <div className="relative overflow-hidden border border-line bg-black/40 clip-notch">
            <div className="relative aspect-[5/7]">
              <Image
                src={card.image}
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
            <span className="badge badge-cyan">{card.type}</span>
            <span className="badge" style={{ borderColor: `${rarity}66`, color: rarity }}>
              {card.rarity}
            </span>
            <span className="badge">{card.set.name}</span>
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
            <span>SET: {card.set.name}</span>
            <span>PRINT: {card.printNumber || "—"}</span>
            <span>ARTIST: {card.artist || "—"}</span>
            <span className={cn(card.legality === "legal" ? "text-cp-green" : "text-cp-red")}>
              STANDARD: {card.legality.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
