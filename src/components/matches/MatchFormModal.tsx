"use client";

import { useState } from "react";
import { Save, Swords } from "lucide-react";
import type { Deck, MatchRecord, MatchResult } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { todayInputValue } from "@/lib/utils";

export type MatchFormValues = Omit<MatchRecord, "id" | "createdAt">;

const FORMATS = ["Standard", "Sealed", "Draft", "Casual", "Other"];

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
  };
}

function MatchForm({
  initial,
  decks,
  onSubmit,
  onClose,
}: {
  initial: MatchRecord | null;
  decks: Deck[];
  onSubmit: (values: MatchFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MatchFormValues>(() =>
    initial ? fromRecord(initial) : blankForm(decks[0]?.id ?? ""),
  );

  const set = (patch: Partial<MatchFormValues>) => setForm((current) => ({ ...current, ...patch }));

  const submit = () => {
    onSubmit({
      ...form,
      opponentName: form.opponentName.trim(),
      opponentDeck: form.opponentDeck.trim(),
      store: form.store.trim(),
      notes: form.notes.trim(),
      gamesWon: Math.max(0, Math.floor(form.gamesWon)),
      gamesLost: Math.max(0, Math.floor(form.gamesLost)),
    });
    onClose();
  };

  const formats = FORMATS.includes(form.format) ? FORMATS : [form.format, ...FORMATS];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>

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
        <p className="font-mono hidden text-[8px] tracking-[0.12em] text-muted sm:block">
          {form.date} · {form.result.toUpperCase()} · {form.gamesWon}–{form.gamesLost}
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
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: MatchRecord | null;
  decks: Deck[];
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
      <MatchForm initial={initial} decks={decks} onSubmit={onSubmit} onClose={onClose} />
    </Modal>
  );
}
