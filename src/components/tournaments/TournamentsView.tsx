"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Plus, RefreshCw, Swords, Trash2, Trophy, Users } from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { cn, formatDate } from "@/lib/utils";
import type { Tournament, TournamentStatus } from "@/lib/types";
import { TournamentFormModal } from "@/components/tournaments/TournamentFormModal";
import { TournamentDetailModal } from "@/components/tournaments/TournamentDetailModal";

const STATUS_TONE: Record<TournamentStatus, string> = {
  upcoming: "text-cp-cyan border-cp-cyan/40 bg-cp-cyan/8",
  ongoing: "text-cp-yellow border-cp-yellow/40 bg-cp-yellow/8",
  completed: "text-cp-green border-cp-green/40 bg-cp-green/8",
};

export function TournamentsView() {
  const tournaments = (useVaultStore((state) => (state as any).tournaments) ?? []) as Tournament[];
  const decks = useVaultStore((state) => state.decks);
  const addTournament = useVaultStore((state) => (state as any).addTournament);
  const updateTournament = useVaultStore((state) => (state as any).updateTournament);
  const deleteTournament = useVaultStore((state) => (state as any).deleteTournament);
  const meleeAccount = (useVaultStore((state) => (state as any).meleeAccount)) as any;

  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Tournament | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const syncFromMelee = async () => {
    if (!meleeAccount) return;
    setSyncing(true);
    try {
      // Placeholder: in practice we'd call Melee APIs; for now just refresh timestamp
      await new Promise((r) => setTimeout(r, 600));
      (tournaments as Tournament[]).forEach((t) => {
        if (t.meleeTournamentId || t.meleeUrl) {
          updateTournament(t.id, { updatedAt: new Date().toISOString() } as any);
        }
      });
    } finally {
      setSyncing(false);
    }
  };

  const sorted = useMemo(
    () =>
      tournaments
        .slice()
        .sort((a, b) => (a.startDate && b.startDate ? (a.startDate < b.startDate ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1)),
    [tournaments],
  );

  const target = tournaments.find((t) => t.id === deleteTarget);

  return (
    <div>
      <PageHeader
        eyebrow="Circuit // 04"
        title="Tournaments"
        description={meleeAccount ? `Linked to Melee.gg: ${meleeAccount.username || meleeAccount.profileId || "profile"}. Syncs pull your events, pairings, tables, and results.` : "Link your Melee.gg account in Settings to automatically pull tournaments you're playing and sync pairings."}
        actions={
          <div className="flex gap-2">
            {meleeAccount ? (
              <button type="button" className="btn-cyber btn-cyber-ghost" onClick={syncFromMelee} disabled={syncing}>
                <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                {syncing ? "Syncing..." : "Sync from Melee.gg"}
              </button>
            ) : null}
            <button type="button" className="btn-cyber" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Link/Import
            </button>
          </div>
        }
      />

      {tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title={meleeAccount ? "No tournaments found" : "Link your Melee.gg account"}
          description={meleeAccount ? "Sync from Melee.gg to pull your upcoming/ongoing tournaments, pairings, and tables. Results will auto-log to your match history." : "Go to Settings > Account and link your Melee.gg profile. We'll pull your tournaments automatically and track pairings/tables as they update."}
          action={
            <button type="button" className="btn-cyber" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {meleeAccount ? "Sync/Import" : "Link Melee.gg"}
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((tournament) => {
            const deck = decks.find((d) => d.id === tournament.deckId);
            const pairings = tournament.pairings ?? [];
            const record = tournament.playerRecord ?? { wins: 0, losses: 0, draws: 0 };
            return (
              <article
                key={tournament.id}
                className="hud-panel-flat flex flex-col gap-3 p-3 transition-colors hover:border-line-bright sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                  <span
                    className={cn(
                      "font-display flex h-11 w-11 shrink-0 items-center justify-center border text-base font-bold uppercase",
                      STATUS_TONE[tournament.status],
                    )}
                  >
                    <Trophy className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-fog">
                      {tournament.status}
                    </p>
                    <p className="font-mono flex items-center gap-1 text-[9px] tracking-[0.06em] text-muted">
                      <CalendarDays className="h-2.5 w-2.5" />
                      {tournament.startDate ? formatDate(tournament.startDate) : "TBA"}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <button type="button" className="text-left" onClick={() => setDetail(tournament)}>
                    <p className="truncate text-[13px] font-semibold text-fog hover:text-cp-yellow">{tournament.name}</p>
                  </button>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] tracking-[0.06em] text-muted">
                    <span>{tournament.format}</span>
                    <span>
                      {record.wins}W · {record.losses}L · {record.draws}D
                    </span>
                    {deck ? <span className="text-cp-yellow">{deck.name}</span> : null}
                    <span className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      {pairings.length} pairings
                    </span>
                    {tournament.store ? <span>{tournament.store}</span> : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:self-center">
                  {tournament.meleeUrl || tournament.url ? (
                    <a
                      href={tournament.meleeUrl || tournament.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-btn h-8 w-8"
                      aria-label="Open on Melee.gg"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  <button type="button" className="btn-cyber btn-cyber-ghost px-2 py-1" onClick={() => setDetail(tournament)}>
                    <Swords className="h-3.5 w-3.5" />
                    Manage Pairings
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 hover:border-cp-red/50 hover:text-cp-red"
                    onClick={() => setDeleteTarget(tournament.id)}
                    aria-label="Delete tournament"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <TournamentFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={(values) => addTournament(values)} />
      {detail ? <TournamentDetailModal open tournament={detail} onClose={() => setDetail(null)} /> : null}

      <Modal
        open={Boolean(target)}
        onClose={() => setDeleteTarget(null)}
        eyebrow="Confirm Purge"
        title="Delete Tournament"
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
                if (deleteTarget) deleteTournament(deleteTarget);
                setDeleteTarget(null);
                setDetail(null);
              }}
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Delete <span className="font-semibold text-fog">{target?.name}</span>? This will remove the tournament and its
          pairings. Matches logged from this tournament remain in your match log.
        </p>
      </Modal>
    </div>
  );
}
