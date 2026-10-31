"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Deck, DeckValidation } from "@/lib/types";
import { COLOR_HEX } from "@/lib/cards";
import { collectionGap } from "@/lib/stats";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

export function DeckValidationPanel({
  deck,
  validation,
  collection,
}: {
  deck: Deck;
  validation: DeckValidation;
  collection: Record<string, number>;
}) {
  const gap = collectionGap(deck, collection);
  const missingCount = gap.filter((entry) => entry.owned < entry.need).length;
  const orderedGap = [...gap].sort((a, b) => {
    const aMissing = a.owned < a.need ? 0 : 1;
    const bMissing = b.owned < b.need ? 0 : 1;
    if (aMissing !== bMissing) return aMissing - bMissing;
    if (aMissing === 0 && bMissing === 0) return a.owned - b.owned;
    return a.card.displayName.localeCompare(b.card.displayName);
  });
  const costEntries = Object.entries(validation.costCurve).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxCostCount = Math.max(1, ...costEntries.map(([, count]) => count));
  const errors = validation.issues.filter((issue) => issue.severity === "error");
  const warnings = validation.issues.filter((issue) => issue.severity === "warning");

  return (
    <section className="hud-panel overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3",
          validation.legal
            ? "border-cp-green/30 bg-cp-green/8"
            : "border-cp-red/30 bg-cp-red/8",
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center border",
            validation.legal
              ? "border-cp-green/50 text-cp-green"
              : "border-cp-red/50 text-cp-red",
          )}
        >
          {validation.legal ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </span>
        <div>
          <p className="hud-label text-[8px]">Rules Check</p>
          <p
            className={cn(
              "font-display text-lg font-bold uppercase leading-none tracking-[0.06em]",
              validation.legal ? "text-cp-green" : "text-cp-red",
            )}
          >
            {validation.legal ? "Tournament Legal" : "Not Legal"}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-[9px] tracking-[0.1em]">
            <span className="text-muted uppercase">Main deck</span>
            <span className={validation.mainCount >= 40 && validation.mainCount <= 50 ? "text-cp-green" : "text-cp-yellow"}>
              {validation.mainCount} / 40–50
            </span>
          </div>
          <ProgressBar
            value={Math.min(validation.mainCount, 50)}
            max={50}
            color={validation.mainCount > 50 ? "#ff335f" : validation.mainCount >= 40 ? "#35e08b" : "#f5e400"}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="border border-line bg-black/20 p-2.5">
            <p className="hud-label text-[8px]">Legends</p>
            <p className={cn("font-display mt-1 text-lg leading-none", validation.legendCount === 3 ? "text-cp-green" : "text-cp-red")}>
              {validation.legendCount}
              <span className="text-[10px] text-muted">/3</span>
            </p>
          </div>
          <div className="border border-line bg-black/20 p-2.5">
            <p className="hud-label text-[8px]">Sideboard</p>
            <p
              className={cn(
                "font-display mt-1 text-lg leading-none",
                validation.sideboardCount === 0 || validation.sideboardCount === 7 ? "text-cp-green" : "text-cp-red",
              )}
            >
              {validation.sideboardCount}
              <span className="text-[10px] text-muted">/7</span>
            </p>
          </div>
        </div>

        <div>
          <p className="hud-label mb-2">RAM Limits</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(["Red", "Blue", "Green", "Yellow"] as const).map((color) => {
              const limit = validation.ramLimits[color] ?? 0;
              const used = validation.colorCounts[color] ?? 0;
              return (
                <div key={color} className="border border-line bg-black/25 p-1.5 text-center">
                  <p className="font-mono text-[7px] tracking-[0.12em] uppercase" style={{ color: COLOR_HEX[color] }}>
                    {color.slice(0, 3)}
                  </p>
                  <p className="font-display mt-0.5 text-sm leading-none" style={{ color: limit ? COLOR_HEX[color] : "#56667a" }}>
                    {limit}
                  </p>
                  <p className="font-mono mt-0.5 text-[7px] text-muted">{used} cards</p>
                </div>
              );
            })}
          </div>
        </div>

        {validation.issues.length > 0 ? (
          <div className="space-y-1.5 border-t border-line pt-3">
            <p className="hud-label mb-1">Issues</p>
            {validation.issues.map((issue) => (
              <div
                key={issue.id}
                className={cn(
                  "flex items-start gap-2 border px-2 py-1.5 text-[11px] leading-snug",
                  issue.severity === "error"
                    ? "border-cp-red/30 bg-cp-red/5 text-cp-red/90"
                    : "border-cp-yellow/30 bg-cp-yellow/5 text-cp-yellow/90",
                )}
              >
                {issue.severity === "error" ? (
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                ) : (
                  <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                )}
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 border-t border-line pt-3 text-[11px] text-cp-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All deck construction checks passed.
          </div>
        )}

        {costEntries.length > 0 ? (
          <div className="border-t border-line pt-3">
            <p className="hud-label mb-2">Cost Curve</p>
            <div className="flex h-16 items-end gap-1">
              {costEntries.map(([cost, count]) => (
                <div key={cost} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full bg-cp-yellow/60 transition-all"
                      style={{ height: `${Math.max(4, (count / maxCostCount) * 100)}%` }}
                      title={`${count} card${count === 1 ? "" : "s"} at cost ${cost}`}
                    />
                  </div>
                  <span className="font-mono text-[8px] text-muted">{cost}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-line pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="hud-label">Collection Gap</p>
            <span className={cn("font-mono text-[9px]", missingCount ? "text-cp-red" : "text-cp-green")}>
              {missingCount ? `${missingCount} MISSING` : "COMPLETE"}
            </span>
          </div>
          {gap.length === 0 ? (
            <p className="font-mono text-[9px] text-muted">No cards in this deck yet.</p>
          ) : (
            <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
              {orderedGap.map((entry) => {
                const complete = entry.owned >= entry.need;
                const partial = !complete && entry.owned > 0;
                return (
                  <div key={entry.card.id} className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate text-muted">
                      {entry.card.name}
                      {entry.card.subname ? `: ${entry.card.subname}` : ""}
                    </span>
                    <span
                      className={cn(
                        "font-mono shrink-0",
                        complete ? "text-cp-green" : partial ? "text-cp-yellow" : "text-cp-red",
                      )}
                    >
                      {Math.min(entry.owned, entry.need)}/{entry.need}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {warnings.length === 0 && errors.length === 0 ? (
          <p className="font-mono border-t border-line pt-3 text-[8px] leading-relaxed tracking-[0.06em] text-muted/60">
            3 UNIQUE LEGENDS · 40–50 MAIN · MAX 3 COPIES · RAM COLOR CAPS · 7-CARD SIDEBOARD
          </p>
        ) : null}
      </div>
    </section>
  );
}
