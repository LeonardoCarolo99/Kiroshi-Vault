"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Swords, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useVaultStore } from "@/lib/store";
import type { Tournament, TournamentPairing } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MatchFormModal, type MatchFormValues } from "@/components/matches/MatchFormModal";

export function TournamentDetailModal({
  open,
  tournament,
  onClose,
}: {
  open: boolean;
  tournament: Tournament;
  onClose: () => void;
}) {
  const tournaments = (useVaultStore((state) => (state as any).tournaments) ?? []) as Tournament[];
  const current = tournaments.find((t) => t.id === tournament.id) ?? tournament;
  const decks = useVaultStore((state) => state.decks);
  const matches = useVaultStore((state) => state.matches);
  const upsertTournamentPairing = useVaultStore((state) => (state as any).upsertTournamentPairing);
  const recordTournamentMatch = useVaultStore((state) => (state as any).recordTournamentMatch);
  const updateTournament = useVaultStore((state) => (state as any).updateTournament);

  const [pairingForm, setPairingForm] = useState<Partial<TournamentPairing>>({
    pairingId: `pair-${Date.now()}`,
    round: 1,
    opponentName: "",
    opponentDeck: "",
    tableNumber: "",
    result: "not-reported",
  });
  const [logMatchFor, setLogMatchFor] = useState<TournamentPairing | null>(null);

  const pairings = current.pairings ?? [];
  const record = current.playerRecord ?? { wins: 0, losses: 0, draws: 0 };

  const openLog = (pairing: TournamentPairing) => {
    setLogMatchFor(pairing);
  };

  const submitPairing = () => {
    if (!pairingForm.opponentName?.trim()) return;
    const pairing: TournamentPairing = {
      pairingId: pairingForm.pairingId || `pair-${Date.now()}`,
      round: pairingForm.round || 1,
      opponentName: pairingForm.opponentName.trim(),
      opponentDeck: pairingForm.opponentDeck?.trim() || "",
      tableNumber: pairingForm.tableNumber?.toString().trim() || "",
      result: pairingForm.result || "not-reported",
    };
    upsertTournamentPairing(current.id, pairing);
    setPairingForm({
      pairingId: `pair-${Date.now()}`,
      round: (Number(pairingForm.round) || 1) + 1,
      opponentName: "",
      opponentDeck: "",
      tableNumber: "",
      result: "not-reported",
    });
  };

  const submitTournamentMatch = (values: MatchFormValues) => {
    if (!logMatchFor) return;
    recordTournamentMatch(current.id, logMatchFor.pairingId, {
      ...values,
      type: "tournament",
      tournamentId: current.id,
      tournamentName: current.name,
      pairingId: logMatchFor.pairingId,
      round: logMatchFor.round,
      tableNumber: logMatchFor.tableNumber,
    } as any);
    setLogMatchFor(null);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} eyebrow="Circuit Intel" title={current.name} size="xl">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 border border-line bg-black/25 p-3">
            <div>
              <p className="hud-label text-[8px]">Record</p>
              <p className="font-display mt-1 text-lg text-cp-yellow">
                {record.wins}W · {record.losses}L · {record.draws}D
              </p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="hud-label text-[8px]">Format</p>
              <p className="mt-1 text-[12px] text-fog">{current.format}</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="hud-label text-[8px]">Status</p>
              <p className="mt-1 text-[12px] uppercase text-fog">{current.status}</p>
            </div>
            {current.meleeUrl || current.url ? (
              <>
                <div className="h-8 w-px bg-line" />
                <a
                  href={current.meleeUrl || current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cyber btn-cyber-ghost px-2 py-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View on Melee.gg
                </a>
              </>
            ) : null}
          </div>

          <div className="hud-panel p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cp-yellow" />
              <p className="hud-label text-cp-yellow">Add Pairing</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              <input
                type="number"
                min={1}
                value={pairingForm.round || ""}
                onChange={(event) => setPairingForm((p) => ({ ...p, round: Number(event.target.value) || 1 }))}
                className="hud-input"
                placeholder="Round"
              />
              <input
                value={pairingForm.tableNumber || ""}
                onChange={(event) => setPairingForm((p) => ({ ...p, tableNumber: event.target.value }))}
                className="hud-input sm:col-span-1"
                placeholder="Table"
              />
              <input
                value={pairingForm.opponentName || ""}
                onChange={(event) => setPairingForm((p) => ({ ...p, opponentName: event.target.value }))}
                className="hud-input sm:col-span-2"
                placeholder="Opponent name"
              />
              <input
                value={pairingForm.opponentDeck || ""}
                onChange={(event) => setPairingForm((p) => ({ ...p, opponentDeck: event.target.value }))}
                className="hud-input sm:col-span-1"
                placeholder="Opponent deck"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button type="button" className="btn-cyber" onClick={submitPairing} disabled={!pairingForm.opponentName?.trim()}>
                <Plus className="h-4 w-4" />
                Add Pairing
              </button>
            </div>
          </div>

          <div className="hud-panel p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-cp-yellow" />
                <p className="hud-label text-cp-yellow">Pairings</p>
              </div>
              <p className="font-mono text-[8px] tracking-[0.1em] text-muted">{pairings.length} ENTRIES</p>
            </div>
            {pairings.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No pairings yet. Add rounds as they appear on Melee.gg.</p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {pairings
                  .slice()
                  .sort((a, b) => Number(b.round) - Number(a.round))
                  .map((pairing) => (
                    <div key={pairing.pairingId} className="flex flex-wrap items-center gap-2 border border-line bg-black/20 px-3 py-2">
                      <span className="font-mono text-[9px] tracking-[0.1em] text-muted">R{pairing.round}</span>
                      {pairing.tableNumber ? (
                        <span className="font-mono text-[9px] tracking-[0.1em] text-muted">T{pairing.tableNumber}</span>
                      ) : null}
                      <span className="flex-1 text-[12px] text-fog">
                        vs <span className="font-semibold">{pairing.opponentName}</span>
                        {pairing.opponentDeck ? <span className="text-muted"> · {pairing.opponentDeck}</span> : null}
                      </span>
                      {pairing.result && pairing.result !== "not-reported" ? (
                        <span
                          className={cn(
                            "border px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] uppercase",
                            pairing.result === "win" && "border-cp-green/40 text-cp-green",
                            pairing.result === "loss" && "border-cp-red/40 text-cp-red",
                            pairing.result === "draw" && "border-cp-yellow/40 text-cp-yellow",
                          )}
                        >
                          {pairing.result}
                        </span>
                      ) : null}
                      <button type="button" className="btn-cyber btn-cyber-ghost px-2 py-1" onClick={() => openLog(pairing)}>
                        <Swords className="h-3.5 w-3.5" />
                        Log Match
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {logMatchFor ? (
        <MatchFormModal
          open
          onClose={() => setLogMatchFor(null)}
          initial={null}
          decks={decks}
          matches={matches}
          onSubmit={submitTournamentMatch}
        />
      ) : null}
    </>
  );
}
