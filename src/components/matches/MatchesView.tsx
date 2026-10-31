"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Crosshair,
  Pencil,
  Plus,
  Search,
  Store,
  Swords,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import type { MatchRecord, MatchResult } from "@/lib/types";
import { useVaultStore } from "@/lib/store";
import { matchStats } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MatchFormModal, type MatchFormValues } from "@/components/matches/MatchFormModal";
import { formatDate, relativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RESULT_TONE: Record<MatchResult, string> = {
  win: "text-cp-green border-cp-green/40 bg-cp-green/8",
  loss: "text-cp-red border-cp-red/40 bg-cp-red/8",
  draw: "text-cp-yellow border-cp-yellow/40 bg-cp-yellow/8",
};

function StatCard({ label, value, detail, tone = "yellow" }: { label: string; value: string; detail: string; tone?: "cyan" | "green" | "red" | "yellow" }) {
  const colors = {
    cyan: "text-cp-cyan",
    green: "text-cp-green",
    red: "text-cp-red",
    yellow: "text-cp-yellow",
  };
  return (
    <div className="hud-panel p-4">
      <p className="hud-label text-[8px]">{label}</p>
      <p className={cn("font-display mt-1.5 text-2xl leading-none", colors[tone])}>{value}</p>
      <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-muted uppercase">{detail}</p>
    </div>
  );
}

export function MatchesView() {
  const matches = useVaultStore((state) => state.matches);
  const decks = useVaultStore((state) => state.decks);
  const addMatch = useVaultStore((state) => state.addMatch);
  const updateMatch = useVaultStore((state) => state.updateMatch);
  const deleteMatch = useVaultStore((state) => state.deleteMatch);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MatchRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | MatchResult>("all");
  const [deckFilter, setDeckFilter] = useState("all");

  const stats = useMemo(() => matchStats(matches, decks), [matches, decks]);

  const sorted = useMemo(
    () =>
      matches
        .slice()
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1)),
    [matches],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((match) => {
      if (resultFilter !== "all" && match.result !== resultFilter) return false;
      if (deckFilter !== "all" && match.deckId !== deckFilter) return false;
      if (!q) return true;
      const deck = decks.find((entry) => entry.id === match.deckId);
      return [match.opponentName, match.opponentDeck, match.store, match.notes, match.format, deck?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [sorted, query, resultFilter, deckFilter, decks]);

  const target = matches.find((match) => match.id === deleteTarget);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (match: MatchRecord) => {
    setEditing(match);
    setFormOpen(true);
  };

  const submit = (values: MatchFormValues) => {
    if (editing) updateMatch(editing.id, values);
    else addMatch(values);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Combat Log // 03"
        title="Matches"
        description="Every game, every matchup. Log results fast, then dig into win rates by deck, format, and play/draw."
        actions={
          <button type="button" className="btn-cyber" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Log Match
          </button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Matches" value={String(stats.total)} detail={`${stats.playCount} on play · ${stats.drawCount} on draw`} />
        <StatCard label="Win Rate" value={stats.total ? `${stats.winRate}%` : "—"} detail={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`} tone="green" />
        <StatCard
          label="Current Streak"
          value={stats.currentStreak ? String(stats.currentStreak.count) : "—"}
          detail={stats.currentStreak ? `${stats.currentStreak.type} in a row` : "No streak"}
          tone={stats.currentStreak?.type === "loss" ? "red" : "yellow"}
        />
        <StatCard
          label="Best Deck"
          value={stats.byDeck[0] ? `${stats.byDeck[0].winRate}%` : "—"}
          detail={stats.byDeck[0]?.name ?? "No data yet"}
          tone="cyan"
        />
      </section>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search opponent, deck, store, notes..."
            className="hud-input h-10 pl-10 pr-9"
            aria-label="Search matches"
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
        <div className="flex gap-1 border border-line bg-black/30 p-1">
          {(["all", "win", "loss", "draw"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setResultFilter(value)}
              className={cn(
                "font-mono px-2.5 py-1.5 text-[9px] tracking-[0.1em] uppercase transition-colors",
                resultFilter === value
                  ? value === "win"
                    ? "bg-cp-green/20 text-cp-green"
                    : value === "loss"
                      ? "bg-cp-red/20 text-cp-red"
                      : value === "draw"
                        ? "bg-cp-yellow/20 text-cp-yellow"
                        : "bg-white/10 text-fog"
                  : "text-muted hover:text-fog",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <select
          value={deckFilter}
          onChange={(event) => setDeckFilter(event.target.value)}
          className="hud-select h-10 w-full sm:w-48"
          aria-label="Filter by deck"
        >
          <option value="all">All decks</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={<Swords className="h-6 w-6" />}
          title="No matches logged"
          description="Start your combat log. Each entry tracks the deck, opponent, score, play/draw, venue, and notes."
          action={
            <button type="button" className="btn-cyber" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Log First Match
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Crosshair className="h-6 w-6" />}
          title="No matching records"
          description="No matches fit this filter set. Adjust the search or result filter."
          action={
            <button
              type="button"
              className="btn-cyber"
              onClick={() => {
                setQuery("");
                setResultFilter("all");
                setDeckFilter("all");
              }}
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((match) => {
            const deck = decks.find((entry) => entry.id === match.deckId);
            return (
              <article
                key={match.id}
                className="hud-panel-flat flex flex-col gap-3 p-3 transition-colors hover:border-line-bright sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                  <span
                    className={cn(
                      "font-display flex h-11 w-11 shrink-0 items-center justify-center border text-base font-bold uppercase",
                      RESULT_TONE[match.result],
                    )}
                  >
                    {match.result.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-fog">
                      {match.result}
                    </p>
                    <p className="font-mono flex items-center gap-1 text-[9px] tracking-[0.06em] text-muted">
                      <CalendarDays className="h-2.5 w-2.5" />
                      {formatDate(match.date)}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-fog">
                    vs <span className="font-semibold">{match.opponentName || "Unknown opponent"}</span>
                    {match.opponentDeck ? <span className="text-muted"> · {match.opponentDeck}</span> : null}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] tracking-[0.06em] text-muted">
                    <span className="text-cp-yellow">{deck?.name ?? "No deck"}</span>
                    <span>{match.format}</span>
                    <span>
                      {match.gamesWon}–{match.gamesLost}
                    </span>
                    <span className="uppercase">{match.playDraw === "unknown" ? "P/D —" : match.playDraw}</span>
                    {match.store ? (
                      <span className="flex items-center gap-1">
                        <Store className="h-2.5 w-2.5" />
                        {match.store}
                      </span>
                    ) : null}
                  </div>
                  {match.notes ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted/80">{match.notes}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:self-center">
                  <span className="font-mono mr-2 hidden text-[8px] tracking-[0.1em] text-muted/60 md:block">
                    {relativeDate(match.createdAt)}
                  </span>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8"
                    onClick={() => openEdit(match)}
                    aria-label="Edit match"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 hover:border-cp-red/50 hover:text-cp-red"
                    onClick={() => setDeleteTarget(match.id)}
                    aria-label="Delete match"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {stats.byDeck.length > 0 ? (
        <section className="hud-panel mt-5 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cp-yellow" />
            <p className="hud-label text-cp-yellow">Performance by Deck</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {stats.byDeck.map((entry) => (
              <div key={entry.deckId} className="border border-line bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[12px] font-medium text-fog">{entry.name}</p>
                  <span className="font-mono text-[9px] text-muted">
                    {entry.wins}W · {entry.losses}L · {entry.draws}D
                  </span>
                </div>
                <ProgressBar
                  value={entry.winRate}
                  max={100}
                  color={entry.winRate >= 50 ? "#35e08b" : "#ff335f"}
                  className="mt-2"
                />
                <p className="font-mono mt-1.5 text-[8px] tracking-[0.1em] text-muted">
                  {entry.winRate}% WIN RATE · {entry.total} MATCHES
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <MatchFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
        decks={decks}
        matches={matches}
        onSubmit={submit}
      />

      <Modal
        open={Boolean(target)}
        onClose={() => setDeleteTarget(null)}
        eyebrow="Confirm Purge"
        title="Delete Match"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => setDeleteTarget(null)}>
              Keep Record
            </button>
            <button
              type="button"
              className="btn-cyber btn-cyber-red"
              onClick={() => {
                if (deleteTarget) deleteMatch(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Delete the match against{" "}
          <span className="font-semibold text-fog">{target?.opponentName || "Unknown opponent"}</span> from{" "}
          {target ? formatDate(target.date) : "this date"}? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
