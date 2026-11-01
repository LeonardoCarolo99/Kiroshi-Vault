"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { todayInputValue } from "@/lib/utils";
import type { Tournament, TournamentStatus } from "@/lib/types";

const STATUSES: TournamentStatus[] = ["upcoming", "ongoing", "completed"];
const FORMATS = ["Standard", "Sealed", "Draft", "Casual", "Other"];

export type TournamentFormValues = Omit<Tournament, "id" | "createdAt" | "updatedAt" | "pairings"> & {
  pairings?: Tournament["pairings"];
};

export function TournamentFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TournamentFormValues) => void;
}) {
  const [form, setForm] = useState<TournamentFormValues>({
    name: "",
    status: "upcoming",
    format: "Standard",
    startDate: todayInputValue(),
    endDate: "",
    url: "",
    meleeUrl: "",
    meleeTournamentId: "",
    location: "",
    store: "",
    deckId: "",
    playerRecord: { wins: 0, losses: 0, draws: 0 },
    pairings: [],
  });

  const set = (patch: Partial<TournamentFormValues>) => setForm((current) => ({ ...current, ...patch }));

  const submit = () => {
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      url: form.url?.trim() || "",
      meleeUrl: form.meleeUrl?.trim() || "",
      meleeTournamentId: form.meleeTournamentId?.trim() || "",
      location: form.location?.trim() || "",
      store: form.store?.trim() || "",
    });
    setForm({
      name: "",
      status: "upcoming",
      format: "Standard",
      startDate: todayInputValue(),
      endDate: "",
      url: "",
      meleeUrl: "",
      meleeTournamentId: "",
      location: "",
      store: "",
      deckId: "",
      playerRecord: { wins: 0, losses: 0, draws: 0 },
      pairings: [],
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow="Melee.gg Sync" title="Import from Melee.gg" size="lg">
      <div className="space-y-4">
        <label className="block">
          <span className="hud-label mb-1.5 block">Melee.gg Profile URL or Username</span>
          <input
            value={form.name}
            onChange={(event) => set({ name: event.target.value })}
            placeholder="https://melee.gg/Profile/Index/YourName or YourName"
            className="hud-input"
            maxLength={200}
          />
          <p className="mt-1 font-mono text-[8px] tracking-[0.08em] text-muted">Link in Settings first for automatic sync. You can also paste a profile here to import.</p>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="hud-label mb-1.5 block">Melee.gg Tournament URL (optional)</span>
            <input
              value={form.meleeUrl || ""}
              onChange={(event) => set({ meleeUrl: event.target.value })}
              placeholder="https://melee.gg/Tournament/View/..."
              className="hud-input"
            />
            <p className="mt-1 font-mono text-[8px] tracking-[0.08em] text-muted">If you want to import a specific event.</p>
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Melee Tournament ID</span>
            <input
              value={form.meleeTournamentId || ""}
              onChange={(event) => set({ meleeTournamentId: event.target.value })}
              placeholder="Extracted from URL"
              className="hud-input"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="hud-label mb-1.5 block">Status</span>
            <select value={form.status} onChange={(event) => set({ status: event.target.value as TournamentStatus })} className="hud-select">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Format</span>
            <select value={form.format} onChange={(event) => set({ format: event.target.value })} className="hud-select">
              {FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Start Date</span>
            <input type="date" value={form.startDate || ""} onChange={(event) => set({ startDate: event.target.value })} className="hud-input" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="hud-label mb-1.5 block">Store / Venue</span>
            <input
              value={form.store || ""}
              onChange={(event) => set({ store: event.target.value })}
              placeholder="Local game store"
              className="hud-input"
              maxLength={80}
            />
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Location</span>
            <input
              value={form.location || ""}
              onChange={(event) => set({ location: event.target.value })}
              placeholder="City / Region"
              className="hud-input"
              maxLength={80}
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="font-mono hidden text-[8px] tracking-[0.12em] text-muted sm:block">Melee.gg API integration pending; manual entry works now</p>
          <div className="flex gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-cyber" onClick={submit} disabled={!form.name.trim()}>
              <Save className="h-4 w-4" />
              Import/Link
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
