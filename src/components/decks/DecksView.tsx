"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Copy,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { COLOR_HEX, deckValidationSummary } from "@/lib/cards";
import { deckLegends } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

export function DecksView() {
  const router = useRouter();
  const { playClick, playSuccess, playNavigate } = useSound();
  const decks = useVaultStore((state) => state.decks);
  const matches = useVaultStore((state) => state.matches);
  const createDeck = useVaultStore((state) => state.createDeck);
  const deleteDeck = useVaultStore((state) => state.deleteDeck);
  const duplicateDeck = useVaultStore((state) => state.duplicateDeck);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const deckRows = useMemo(
    () =>
      decks.map((deck) => ({
        deck,
        summary: deckValidationSummary(deck),
        legends: deckLegends(deck),
        matches: matches.filter((match) => match.deckId === deck.id),
      })),
    [decks, matches],
  );

  const legalCount = deckRows.filter((row) => row.summary.legal).length;

  const submitCreate = () => {
    playSuccess();
    const id = createDeck(name.trim() || "Untitled Deck", description.trim());
    setCreateOpen(false);
    setName("");
    setDescription("");
    router.push(`/decks/${id}`);
  };

  const target = decks.find((deck) => deck.id === deleteTarget);

  return (
    <div>
      <PageHeader
        eyebrow="Loadout // 02"
        title="Decks"
        description="Build and maintain tournament-legal loadouts. Every list is checked against official deck construction rules as you go."
        actions={
          <>
            <span className="badge badge-green">
              <ShieldCheck className="h-3 w-3" />
              {legalCount} legal
            </span>
            <button type="button" className="btn-cyber" onClick={() => { playClick(); setCreateOpen(true); }}>
              <Plus className="h-4 w-4" />
              New Deck
            </button>
          </>
        }
      />

      {decks.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title="No decks on file"
          description="Start a new loadout, pick exactly three Legends, and the builder will handle counts, copy limits, and RAM restrictions."
          action={
            <button type="button" className="btn-cyber" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Build First Deck
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {deckRows.map(({ deck, summary, legends, matches: deckMatches }) => {
            const wins = deckMatches.filter((match) => match.result === "win").length;
            return (
              <article key={deck.id} className="hud-panel hud-panel-hover flex flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/decks/${deck.id}`} className="block">
                      <h2 className="font-display truncate text-lg font-bold uppercase leading-tight tracking-[0.04em] text-fog transition-colors hover:text-cp-yellow">
                        {deck.name}
                      </h2>
                    </Link>
                    <p className="mt-0.5 truncate font-mono text-[9px] tracking-[0.1em] text-muted">
                      UPDATED {relativeDate(deck.updatedAt).toUpperCase()}
                    </p>
                  </div>
                  <span className={cn("badge shrink-0", summary.legal ? "badge-green" : "badge-red")}>
                    {summary.legal ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                    {summary.legal ? "Legal" : `${summary.issueCount} issue${summary.issueCount === 1 ? "" : "s"}`}
                  </span>
                </div>

                <div className="flex-1 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {legends.length === 0 ? (
                      <p className="font-mono text-[10px] tracking-[0.1em] text-cp-red">NO LEGENDS SELECTED</p>
                    ) : (
                      legends.map((legend) => (
                        <div key={legend.id} className="relative">
                          <div className="relative h-16 w-11 overflow-hidden border border-line bg-black/40">
                            <Image src={legend.image} alt={legend.displayName} fill sizes="44px" className="object-cover" />
                          </div>
                          <span
                            className="absolute inset-x-0 bottom-0 h-0.5"
                            style={{ background: legend.color ? COLOR_HEX[legend.color] : "#7f91a8" }}
                          />
                        </div>
                      ))
                    )}
                    {legends.length > 0 && legends.length < 3 ? (
                      <span className="font-mono text-[9px] tracking-[0.1em] text-muted">
                        +{3 - legends.length} needed
                      </span>
                    ) : null}
                  </div>

                  {deck.description ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{deck.description}</p>
                  ) : null}

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
                    <div>
                      <p className="hud-label text-[8px]">Main</p>
                      <p className="font-display mt-0.5 text-sm text-fog">
                        {summary.mainCount}
                        <span className="text-[9px] text-muted">/50</span>
                      </p>
                    </div>
                    <div>
                      <p className="hud-label text-[8px]">Sideboard</p>
                      <p className="font-display mt-0.5 text-sm text-fog">
                        {summary.sideboardCount}
                        <span className="text-[9px] text-muted">/7</span>
                      </p>
                    </div>
                    <div>
                      <p className="hud-label text-[8px]">Record</p>
                      <p className="font-display mt-0.5 text-sm text-fog">
                        {wins}
                        <span className="text-[9px] text-muted">/{deckMatches.length}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 border-t border-line px-3 py-2">
                  <Link href={`/decks/${deck.id}`} className="btn-cyber flex-1 !min-h-8 !py-1.5 !text-[9px]">
                    Open Builder
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8"
                    onClick={() => {
                      playClick();
                      duplicateDeck(deck.id);
                    }}
                    aria-label={`Duplicate ${deck.name}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 hover:border-cp-red/50 hover:text-cp-red"
                    onClick={() => {
                      playClick();
                      setDeleteTarget(deck.id);
                    }}
                    aria-label={`Delete ${deck.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        eyebrow="New Loadout"
        title="Build a Deck"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => { playClick(); setCreateOpen(false); }}>
              Cancel
            </button>
            <button type="button" className="btn-cyber" onClick={submitCreate}>
              <Plus className="h-4 w-4" />
              Create Deck
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="hud-label mb-1.5 block">Deck Name</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitCreate();
              }}
              placeholder="e.g. Arasaka Black ICE"
              className="hud-input"
              maxLength={60}
            />
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Notes / Strategy</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional. Game plan, matchup notes, or the vibe."
              className="hud-textarea"
              maxLength={280}
            />
          </label>
          <div className="flex items-start gap-2 border border-cp-yellow/25 bg-cp-yellow/5 p-3">
            <Swords className="mt-0.5 h-4 w-4 shrink-0 text-cp-yellow" />
            <p className="text-xs leading-relaxed text-muted">
              The builder enforces exactly 3 unique Legends, 40–50 main deck cards, a max of 3 copies per
              card name, per-color RAM limits, and an optional 7-card sideboard.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(target)}
        onClose={() => setDeleteTarget(null)}
        eyebrow="Confirm Purge"
        title="Delete Deck"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => { playClick(); setDeleteTarget(null); }}>
              Keep Deck
            </button>
            <button
              type="button"
              className="btn-cyber btn-cyber-red"
              onClick={() => {
                playClick();
                if (deleteTarget) deleteDeck(deleteTarget);
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
          Delete <span className="font-semibold text-fog">{target?.name}</span>? This removes the list
          permanently. Matches logged with this deck will be kept but marked with no deck.
        </p>
      </Modal>
    </div>
  );
}
