"use client";

import { useMemo, useState } from "react";
import { Save, Swords, Trophy, UserRound } from "lucide-react";
import type { Deck, MatchRecord, MatchResult } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { todayInputValue } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type MatchFormValues = Omit<MatchRecord, "id" | "createdAt">;

const FORMATS = ["Standard", "Sealed", "Draft", "Casual", "Other"];

function mostFrequent(values: string[]) {
  if (values.length === 0) return "";
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = values[0];
  let bestKey = best.toLowerCase();
  let bestCount = counts.get(bestKey) ?? 1;
  for (const value of values.slice(1)) {
    const key = value.toLowerCase();
    const count = counts.get(key) ?? 1;
    if (count > bestCount || (count === bestCount && value.length < best.length)) {
      best = value;
      bestKey = key;
      bestCount = count;
    }
  }
  return best;
}

function blankForm(deckId: string): MatchFormValues {
  return {
    date: todayInputValue(),
    format: "Standard",
    deckId,
    opponentName: "",
    opponentDeck: "",
    result: "win",
    gamesWon: 2,
    gamesLost: 1,
    playDraw: "unknown",
    store: "",
    notes: "",
    type: "casual",
  };
}

function fromRecord(record: MatchRecord): MatchFormValues {
  return {
    date: record.date,
    format: record.format,
    deckId: record.deckId,
    opponentName: record.opponentName,
    opponentDeck: record.opponentDeck,
    result: record.result,
    gamesWon: record.gamesWon,
    gamesLost: record.gamesLost,
    playDraw: record.playDraw,
    store: record.store,
    notes: record.notes,
    type: record.type || (record.tournamentId ? "tournament" : "casual"),
    tournamentId: record.tournamentId,
    tournamentName: record.tournamentName,
    round: record.round,
    tableNumber: record.tableNumber,
    pairingId: record.pairingId,
    eventId: record.eventId,
    venue: record.venue,
  };
}

function MatchForm({
  initial,
  decks,
  matches,
  onSubmit,
  onClose,
}: {
  initial: MatchRecord | null;
  decks: Deck[];
  matches: MatchRecord[];
  onSubmit: (values: MatchFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MatchFormValues>(() =>
    initial ? fromRecord(initial) : blankForm(decks[0]?.id ?? ""),
  );

  const set = (patch: Partial<MatchFormValues>) => setForm((current) => ({ ...current, ...patch }));

  const frequentOpponents = useMemo(() => {
    const map = new Map<string, { name: string; opponentDeck: string; count: number; lastSeen: string }>();
    for (const match of matches) {
      const name = match.opponentName.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (match.date > existing.lastSeen) existing.lastSeen = match.date;
        if (!existing.opponentDeck && match.opponentDeck.trim()) {
          existing.opponentDeck = match.opponentDeck.trim();
        }
      } else {
        map.set(key, {
          name,
          opponentDeck: match.opponentDeck.trim(),
          count: 1,
          lastSeen: match.date,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : b.lastSeen.localeCompare(a.lastSeen)))
      .slice(0, 6);
  }, [matches]);

  const submit = () => {
    onSubmit({
      ...form,
      opponentName: form.opponentName.trim(),
      opponentDeck: form.opponentDeck.trim(),
      store: form.store.trim(),
      notes: form.notes.trim(),
      gamesWon: Math.max(0, Math.floor(form.gamesWon)),
      gamesLost: Math.max(0, Math.floor(form.gamesLost)),
      type: form.type || ((form as any).tournamentId ? "tournament" : "casual"),
    });
    onClose();
  };

  const formats = FORMATS.includes(form.format) ? FORMATS : [form.format, ...FORMATS];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="hud-label mb-1.5 block">Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => set({ date: event.target.value })}
            className="hud-input"
          />
        </label>
        <label className="block">
          <span className="hud-label mb-1.5 block">Format</span>
          <select
            value={form.format}
            onChange={(event) => set({ format: event.target.value })}
            className="hud-select"
          >
            {formats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="hud-label mb-1.5 block">Match Type</span>
          <select
            value={(form as any).type || ((form as any).tournamentId ? "tournament" : "casual")}
            onChange={(event) => set({ type: event.target.value as any })}
            className="hud-select"
          >
            <option value="casual">Normal</option>
            <option value="tournament">Tournament</option>
          </select>
        </label>
      </div>

      {((form as any).type === "tournament" || (form as any).tournamentId) ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block sm:col-span-2">
            <span className="hud-label mb-1.5 block">Tournament Name</span>
            <input
              value={(form as any).tournamentName || ""}
              onChange={(event) => set({ tournamentName: event.target.value } as any)}
              placeholder="Event name"
              className="hud-input"
            />
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Round</span>
            <input
              value={(form as any).round || ""}
              onChange={(event) => set({ round: event.target.value } as any)}
              placeholder="1"
              className="hud-input"
            />
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Table</span>
            <input
              value={(form as any).tableNumber || ""}
              onChange={(event) => set({ tableNumber: event.target.value } as any)}
              placeholder="Table #"
              className="hud-input"
            />
          </label>
        </div>
      ) : null}

      <label className="block">
        <span className="hud-label mb-1.5 block">Your Deck</span>
        <select
          value={form.deckId}
          onChange={(event) => set({ deckId: event.target.value })}
          className="hud-select"
        >
          <option value="">No deck logged</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </label>

      {frequentOpponents.length > 0 ? (
        <div>
          <span className="hud-label mb-1.5 flex items-center gap-1.5">
            <UserRound className="h-3 w-3" />
            Frequent Opponents
          </span>
          <div className="flex flex-wrap gap-1.5">
            {frequentOpponents.map((opponent) => (
              <button
                key={opponent.name.toLowerCase()}
                type="button"
                onClick={() =>
                  set({
                    opponentName: opponent.name,
                    opponentDeck: opponent.opponentDeck || form.opponentDeck,
                  })
                }
                className={cn(
                  "group flex items-center gap-2 border border-line px-2 py-1 text-left transition-colors hover:border-cp-yellow/60 hover:bg-cp-yellow/5",
                  form.opponentName.trim().toLowerCase() === opponent.name.toLowerCase()
                    ? "border-cp-yellow/70 bg-cp-yellow/10"
                    : "bg-black/25",
                )}
              >
                <span className="text-[11px] text-fog">{opponent.name}</span>
                {opponent.count > 1 ? (
                  <span className="font-mono text-[8px] tracking-[0.08em] text-muted">{opponent.count}x</span>
                ) : null}
                {opponent.opponentDeck ? (
                  <span className="font-mono hidden max-w-[140px] truncate text-[8px] tracking-[0.06em] text-muted sm:block">
                    {opponent.opponentDeck}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-1.5 block">Opponent</span>
          <input
            value={form.opponentName}
            onChange={(event) => set({ opponentName: event.target.value })}
            placeholder="Handle or name"
            className="hud-input"
            maxLength={60}
          />
        </label>
        <label className="block">
          <span className="hud-label mb-1.5 block">Opponent Deck</span>
          <input
            value={form.opponentDeck}
            onChange={(event) => set({ opponentDeck: event.target.value })}
            placeholder="Archetype or legend"
            className="hud-input"
            maxLength={80}
          />
        </label>
      </div>

      <div>
        <span className="hud-label mb-1.5 block">Result</span>
        <Segmented<MatchResult>
          value={form.result}
          onChange={(result) => set({ result })}
          options={[
            { value: "win", label: "Win", tone: "green" },
            { value: "loss", label: "Loss", tone: "red" },
            { value: "draw", label: "Draw", tone: "yellow" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-1.5 block">Games Won</span>
          <input
            type="number"
            min={0}
            max={9}
            value={form.gamesWon}
            onChange={(event) => set({ gamesWon: Number(event.target.value) || 0 })}
            className="hud-input"
          />
        </label>
        <label className="block">
          <span className="hud-label mb-1.5 block">Games Lost</span>
          <input
            type="number"
            min={0}
            max={9}
            value={form.gamesLost}
            onChange={(event) => set({ gamesLost: Number(event.target.value) || 0 })}
            className="hud-input"
          />
        </label>
      </div>

      <div>
        <span className="hud-label mb-1.5 block">Play / Draw</span>
        <Segmented<"play" | "draw" | "unknown">
          value={form.playDraw}
          onChange={(playDraw) => set({ playDraw })}
          options={[
            { value: "play", label: "On the play", tone: "green" },
            { value: "draw", label: "On the draw", tone: "cyan" },
            { value: "unknown", label: "Not tracked" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-1.5 block">Store / Venue</span>
          <input
            value={form.store}
            onChange={(event) => set({ store: event.target.value })}
            placeholder="Local game store"
            className="hud-input"
            maxLength={80}
          />
        </label>
        <div className="flex items-end">
          <div className="flex w-full items-center gap-2 border border-line bg-black/25 px-3 py-2.5">
            <Swords className="h-4 w-4 text-cp-yellow" />
            <p className="font-mono text-[8px] leading-relaxed tracking-[0.08em] text-muted">
              Best of 3 recommended
            </p>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="hud-label mb-1.5 block">Notes</span>
        <textarea
          value={form.notes}
          onChange={(event) => set({ notes: event.target.value })}
          placeholder="Key plays, matchup reads, sideboard notes..."
          className="hud-textarea"
          maxLength={1000}
        />
      </label>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="font-mono hidden items-center gap-2 text-[8px] tracking-[0.12em] text-muted sm:flex">
          {form.date} · {form.result.toUpperCase()} · {form.gamesWon}–{form.gamesLost}
          {((form as any).type === "tournament" || (form as any).tournamentId) ? (
            <span className="flex items-center gap-1 text-cp-yellow">
              <Trophy className="h-2.5 w-2.5" />
              TOURNAMENT
            </span>
          ) : null}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-cyber btn-cyber-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-cyber" onClick={submit} disabled={!form.date}>
            <Save className="h-4 w-4" />
            {initial ? "Save Changes" : "Log Match"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MatchFormModal({
  open,
  onClose,
  initial,
  decks,
  matches,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: MatchRecord | null;
  decks: Deck[];
  matches: MatchRecord[];
  onSubmit: (values: MatchFormValues) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={initial ? "Edit Record" : "Quick Entry"}
      title={initial ? "Edit Match" : "Log a Match"}
      size="lg"
    >
      <MatchForm initial={initial} decks={decks} matches={matches} onSubmit={onSubmit} onClose={onClose} />
    </Modal>
  );
}
