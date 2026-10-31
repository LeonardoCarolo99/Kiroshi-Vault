"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Search, ShieldCheck, X } from "lucide-react";
import type { Card, CardColor } from "@/lib/types";
import { COLOR_HEX, cards } from "@/lib/cards";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const LEGENDS = cards.filter((card) => card.type === "Legend");

export function LegendPicker({
  open,
  onClose,
  selected,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onToggle: (card: Card) => void;
}) {
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<CardColor | "all">("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LEGENDS.filter((legend) => {
      if (color !== "all" && legend.color !== color) return false;
      if (!q) return true;
      return [legend.name, legend.subname, legend.displayName, legend.rulesText]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, color]);

  const ramTotals = useMemo(() => {
    const totals: Record<string, number> = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
    for (const id of selected) {
      const legend = LEGENDS.find((card) => card.id === id);
      if (legend?.color && legend.ram != null) totals[legend.color] += legend.ram;
    }
    return totals;
  }, [selected]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Squad Assembly"
      title="Select Legends"
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.14em] text-muted">
              {selected.length}/3 SELECTED
            </span>
            {(["Red", "Blue", "Green", "Yellow"] as const).map((entry) => (
              <span key={entry} className="font-mono flex items-center gap-1 text-[9px]" style={{ color: COLOR_HEX[entry] }}>
                <span className="h-1.5 w-1.5" style={{ background: COLOR_HEX[entry] }} />
                {ramTotals[entry]} RAM
              </span>
            ))}
          </div>
          <button type="button" className="btn-cyber" onClick={onClose}>
            <Check className="h-4 w-4" />
            Confirm Squad
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search legends by name or rules..."
            className="hud-input h-10 pl-10 pr-9"
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
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setColor("all")}
            className={cn("chip", color === "all" && "chip-active")}
          >
            All
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
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((legend) => {
          const isSelected = selected.includes(legend.id);
          const disabled = !isSelected && selected.length >= 3;
          const color = legend.color ? COLOR_HEX[legend.color] : "#7f91a8";
          return (
            <button
              key={legend.id}
              type="button"
              onClick={() => onToggle(legend)}
              disabled={disabled}
              className={cn(
                "group relative overflow-hidden border bg-black/30 text-left transition-all",
                isSelected
                  ? "border-cp-yellow shadow-[0_0_0_1px_rgba(245,228,0,0.5),0_0_24px_rgba(245,228,0,0.15)]"
                  : "border-line hover:border-line-bright",
                disabled && "opacity-40",
              )}
            >
              <div className="relative aspect-[5/7]">
                <Image src={legend.image} alt={legend.displayName} fill sizes="220px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                {isSelected ? (
                  <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center border border-cp-yellow bg-cp-yellow text-void">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <p className="truncate text-[11px] font-semibold leading-tight text-fog">{legend.name}</p>
                  <p className="truncate text-[9px] leading-tight text-muted">{legend.subname}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-line px-2 py-1.5">
                <span className="font-mono flex items-center gap-1 text-[8px] tracking-[0.08em]" style={{ color }}>
                  <span className="h-1.5 w-1.5" style={{ background: color }} />
                  {legend.color}
                </span>
                <span className="font-mono flex items-center gap-1 text-[8px] tracking-[0.08em] text-cp-cyan">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {legend.ram ?? 0} RAM
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">No legends match that scan.</p>
      ) : null}

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        Legends must have unique names. Their combined RAM in each color sets the maximum RAM value for cards of
        that color in your deck.
      </p>
    </Modal>
  );
}
