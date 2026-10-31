"use client";

import Image from "next/image";
import { Eye, Plus } from "lucide-react";
import type { Card } from "@/lib/types";
import { COLOR_HEX, RARITY_COLOR } from "@/lib/cards";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/Stepper";

type CardTileProps = {
  card: Card;
  owned: number;
  onOpen: (card: Card) => void;
  onAdjust?: (card: Card, delta: number) => void;
  mode?: "collection" | "deck";
  deckCount?: number;
  onAdd?: (card: Card) => void;
  addDisabled?: boolean;
};

export function CardTile({
  card,
  owned,
  onOpen,
  onAdjust,
  mode = "collection",
  deckCount = 0,
  onAdd,
  addDisabled,
}: CardTileProps) {
  const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
  const rarity = RARITY_COLOR[card.rarity] ?? "#7f91a8";

  return (
    <article className="card-shell group flex flex-col">
      <button
        type="button"
        onClick={() => onOpen(card)}
        className="relative block w-full text-left"
        aria-label={`Inspect ${card.displayName}`}
      >
        <div className={cn("card-image-wrap", owned === 0 && mode === "collection" && "card-owned-zero")}>
          <Image
            src={card.image}
            alt={card.displayName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
          <div className="card-scan" />

          <span
            className="absolute left-2 top-2 h-6 w-1"
            style={{ background: color, boxShadow: `0 0 10px ${color}88` }}
          />
          <span className="badge absolute left-3 top-2 border-white/10 bg-black/60 text-[8px] text-fog backdrop-blur-sm">
            {card.type}
          </span>
          {owned > 0 && mode === "collection" ? (
            <span className="font-mono absolute right-2 top-2 border border-cp-yellow/60 bg-black/75 px-1.5 py-0.5 text-[9px] tracking-widest text-cp-yellow backdrop-blur-sm">
              ×{owned}
            </span>
          ) : null}
          {mode === "deck" && deckCount > 0 ? (
            <span className="font-mono absolute right-2 top-2 border border-cp-yellow/60 bg-black/75 px-1.5 py-0.5 text-[9px] tracking-widest text-cp-yellow backdrop-blur-sm">
              ×{deckCount}
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 translate-y-2 px-2 pb-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <span className="font-mono flex items-center justify-center gap-1 border border-white/15 bg-black/70 py-1 text-[8px] tracking-[0.18em] text-fog backdrop-blur-sm">
              <Eye className="h-3 w-3" /> INSPECT
            </span>
          </div>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <button type="button" onClick={() => onOpen(card)} className="min-w-0 text-left">
          <h3 className="font-display truncate text-[12px] font-semibold uppercase leading-tight tracking-[0.04em] text-fog transition-colors group-hover:text-cp-yellow">
            {card.name}
          </h3>
          {card.subname ? (
            <p className="mt-0.5 truncate text-[10px] leading-tight text-muted">{card.subname}</p>
          ) : (
            <p className="mt-0.5 truncate text-[10px] leading-tight text-muted">
              {card.classifications.slice(0, 2).join(" · ") || "Night City"}
            </p>
          )}
        </button>

        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] tracking-[0.08em]" style={{ color: rarity }}>
            {card.rarity.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted">
            {card.cost != null ? <span>C{card.cost}</span> : null}
            {card.power != null ? <span>P{card.power}</span> : null}
            {card.ram != null ? <span>R{card.ram}</span> : null}
          </div>
        </div>

        {mode === "collection" && onAdjust ? (
          <div className="mt-auto flex items-center justify-between border-t border-line/70 pt-2">
            <span className="hud-label text-[8px]">Owned</span>
            <Stepper
              value={owned}
              onChange={(value) => onAdjust(card, value - owned)}
              compact
              label={`Owned copies of ${card.displayName}`}
            />
          </div>
        ) : null}

        {mode === "deck" && onAdd ? (
          <div className="mt-auto flex items-center justify-between border-t border-line/70 pt-2">
            <span className="font-mono text-[9px] text-muted">
              {owned > 0 ? `${owned} owned` : "not owned"}
            </span>
            <button
              type="button"
              onClick={() => onAdd(card)}
              disabled={addDisabled}
              className="icon-btn h-7 w-7 border-cp-yellow/30 text-cp-yellow hover:border-cp-yellow hover:bg-cp-yellow/10 disabled:opacity-30"
              aria-label={`Add ${card.displayName} to deck`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
