"use client";

import Image from "next/image";
import { Eye, Plus } from "lucide-react";
import type { Card } from "@/lib/types";
import { COLOR_HEX, RARITY_COLOR } from "@/lib/cards";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/Stepper";
import { useSound } from "@/hooks/useSound";

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
  const { playSelect, playClick } = useSound();
  const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
  const rarity = RARITY_COLOR[card.rarity] ?? "#7f91a8";

  return (
    <article className="card-shell group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-1.5">
      <button
        type="button"
        onClick={() => {
          playSelect();
          onOpen(card);
        }}
        className="relative block w-full text-left scanline-hover overflow-hidden"
        aria-label={`Inspect ${card.displayName}`}
      >
        <div className={cn("card-image-wrap", owned === 0 && mode === "collection" && "card-owned-zero")}>
          <Image
            src={card.image}
            alt={card.displayName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
          />
          <div className="card-scan" />

          <span
            className="absolute left-2 top-2 h-6 w-1"
            style={{ background: color, boxShadow: `0 0 10px ${color}88` }}
          />
          <span
            className={cn(
              "absolute right-2 top-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] border shadow-[0_0_12px_rgba(0,0,0,0.7)] backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-0",
              card.type === "Unit" && "border-cp-cyan bg-cp-cyan text-black",
              card.type === "Gear" && "border-orange-400 bg-orange-400 text-black",
              card.type === "Program" && "border-violet-400 bg-violet-400 text-black",
              card.type === "Event" && "border-pink-400 bg-pink-400 text-black",
              card.type === "Action" && "border-amber-300 bg-amber-300 text-black",
              card.type === "Resource" && "border-lime-400 bg-lime-400 text-black",
              card.type === "Upgrade" && "border-sky-400 bg-sky-400 text-black",
              !["Unit", "Gear", "Program", "Event", "Action", "Resource", "Upgrade"].includes(card.type) &&
                "border-fog/60 bg-fog text-black"
            )}
          >
            {card.type}
          </span>
          {owned > 0 && mode === "collection" ? (
            <span className="font-mono absolute right-2 top-9 border border-cp-yellow/60 bg-black/75 px-1.5 py-0.5 text-[9px] tracking-widest text-cp-yellow backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-0">
              ×{owned}
            </span>
          ) : null}
          {mode === "deck" && deckCount > 0 ? (
            <span className="font-mono absolute right-2 top-9 border border-cp-yellow/60 bg-black/75 px-1.5 py-0.5 text-[9px] tracking-widest text-cp-yellow backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-0">
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
        <button
          type="button"
          onClick={() => {
            playSelect();
            onOpen(card);
          }}
          className="min-w-0 text-left"
        >
          <h3 className="font-display truncate text-[13px] font-semibold uppercase leading-tight tracking-[0.05em] text-fog transition-colors group-hover:text-cp-yellow">
            {card.name}
          </h3>
          {card.subname ? (
            <p className="mt-0.5 truncate text-[11px] leading-tight text-muted">{card.subname}</p>
          ) : (
            <p className="mt-0.5 truncate text-[11px] leading-tight text-muted">
              {card.classifications.slice(0, 2).join(" · ") || "Night City"}
            </p>
          )}
        </button>

        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: rarity }}>
            {card.rarity.toUpperCase()}
          </span>
        </div>

        {mode === "collection" && onAdjust ? (
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-2">
            <span className="hud-label text-[9px] shrink-0">Owned</span>
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
            <span className="font-mono text-[10px] text-muted">
              {owned > 0 ? `${owned} owned` : "not owned"}
            </span>
            <button
              type="button"
              onClick={() => {
                playClick();
                onAdd(card);
              }}
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
