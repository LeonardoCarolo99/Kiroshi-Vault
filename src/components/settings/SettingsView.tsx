"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  Download,
  FileJson,
  HardDrive,
  Info,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Upload,
  User,
} from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { cardMeta, cards } from "@/lib/cards";
import { collectionStats } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { signInWithGoogle, signInAnon, signOutUser } from "@/lib/auth";

export function SettingsView() {
  const collection = useVaultStore((state) => state.collection);
  const decks = useVaultStore((state) => state.decks);
  const matches = useVaultStore((state) => state.matches);
  const importData = useVaultStore((state) => state.importData);
  const resetAll = useVaultStore((state) => state.resetAll);
  const user = useVaultStore((state) => state.user);
  const syncStatus = useVaultStore((state) => state.syncStatus);
  const lastSyncedAt = useVaultStore((state) => state.lastSyncedAt);
  const syncToCloud = useVaultStore((state) => state.syncToCloud);
  const syncFromCloud = useVaultStore((state) => state.syncFromCloud);

  const fileRef = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const RESET_PHRASE = "Choombas be doing anything but meeting Hanako at Embers";
  const [status, setStatus] = useState<{ tone: "ok" | "error"; message: string } | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const stats = collectionStats(collection);

  const payload = () => ({
    app: "Kiroshi Vault",
    version: 1,
    exportedAt: new Date().toISOString(),
    collection,
    decks,
    matches,
  });

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kiroshi-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus({ tone: "ok", message: "Backup file downloaded." });
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload(), null, 2));
      setStatus({ tone: "ok", message: "Backup JSON copied to clipboard." });
    } catch {
      setStatus({ tone: "error", message: "Clipboard access failed. Use the download instead." });
    }
  };

  const applyImport = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as {
        collection?: Record<string, number>;
        decks?: unknown;
        matches?: unknown;
      };
      if (!parsed || typeof parsed !== "object") throw new Error("Not a JSON object");
      if (!parsed.collection && !parsed.decks && !parsed.matches) {
        throw new Error("No collection, decks, or matches found");
      }
      importData({
        collection: parsed.collection,
        decks: parsed.decks as never,
        matches: parsed.matches as never,
      });
      setStatus({ tone: "ok", message: "Backup imported. Your vault has been restored." });
      setPasteOpen(false);
      setPasteValue("");
    } catch (error) {
      setStatus({
        tone: "error",
        message: `Import failed: ${error instanceof Error ? error.message : "invalid file"}.`,
      });
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    applyImport(await file.text());
  };

  const storageSize = new Blob([JSON.stringify({ collection, decks, matches })]).size;

  return (
    <div>
      <PageHeader
        eyebrow="Archive // 05"
        title="Settings"
        description="Local data controls, backups, and the card index that powers Kiroshi Vault."
        actions={<span className="badge badge-green">Local storage</span>}
      />

      {status ? (
        <div
          className={cn(
            "mb-4 flex items-center gap-2 border px-4 py-3 text-[12px]",
            status.tone === "ok"
              ? "border-cp-green/40 bg-cp-green/8 text-cp-green"
              : "border-cp-red/40 bg-cp-red/8 text-cp-red",
          )}
        >
          {status.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          {status.message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="hud-panel p-5">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-cp-cyan" />
            <p className="hud-label text-cp-cyan">Cloud Sync</p>
          </div>
          <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
            Sync Across Devices
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Sign in to sync your collection, decks, and matches to Firebase. Changes sync automatically when signed in.
          </p>

          {user ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 border border-line bg-black/20 p-3">
                <User className="h-4 w-4 text-cp-cyan" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-fog truncate">{user.displayName || user.email || "Signed in user"}</p>
                  <p className="font-mono text-[9px] text-muted truncate">{user.uid}</p>
                </div>
                <span
                  className={cn(
                    "badge",
                    syncStatus === "synced" && "badge-green",
                    syncStatus === "syncing" && "badge-yellow",
                    syncStatus === "error" && "badge-red",
                  )}
                >
                  {syncStatus === "synced" && <Cloud className="h-2.5 w-2.5" />}
                  {syncStatus === "syncing" && <RefreshCw className="h-2.5 w-2.5 animate-spin" />}
                  {syncStatus === "error" && <CloudOff className="h-2.5 w-2.5" />}
                  {syncStatus}
                </span>
              </div>
              {lastSyncedAt ? (
                <p className="font-mono text-[9px] text-muted">
                  Last synced: {formatDateTime(lastSyncedAt)}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-cyber btn-cyber-cyan"
                  disabled={syncStatus === "syncing" || authBusy}
                  onClick={() => {
                    setAuthBusy(true);
                    void syncToCloud().finally(() => setAuthBusy(false));
                  }}
                >
                  <RefreshCw className={cn("h-4 w-4", syncStatus === "syncing" && "animate-spin")} />
                  Sync Now
                </button>
                <button
                  type="button"
                  className="btn-cyber btn-cyber-ghost"
                  disabled={syncStatus === "syncing" || authBusy}
                  onClick={() => {
                    setAuthBusy(true);
                    void syncFromCloud(true).finally(() => setAuthBusy(false));
                  }}
                >
                  <Download className="h-4 w-4" />
                  Pull from Cloud
                </button>
                <button
                  type="button"
                  className="btn-cyber btn-cyber-ghost"
                  disabled={authBusy}
                  onClick={async () => {
                    setAuthBusy(true);
                    try {
                      await signOutUser();
                      setStatus({ tone: "ok", message: "Signed out." });
                    } catch (error) {
                      setStatus({
                        tone: "error",
                        message: `Sign out failed: ${error instanceof Error ? error.message : "unknown"}`,
                      });
                    } finally {
                      setAuthBusy(false);
                    }
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-cyber"
                  disabled={authBusy}
                  onClick={async () => {
                    setAuthBusy(true);
                    try {
                      await signInWithGoogle();
                      setStatus({ tone: "ok", message: "Signed in with Google." });
                    } catch (error) {
                      setStatus({
                        tone: "error",
                        message: `Sign in failed: ${error instanceof Error ? error.message : "unknown"}`,
                      });
                    } finally {
                      setAuthBusy(false);
                    }
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Sign in with Google
                </button>
                <button
                  type="button"
                  className="btn-cyber btn-cyber-ghost"
                  disabled={authBusy}
                  onClick={async () => {
                    setAuthBusy(true);
                    try {
                      await signInAnon();
                      setStatus({ tone: "ok", message: "Signed in anonymously." });
                    } catch (error) {
                      setStatus({
                        tone: "error",
                        message: `Sign in failed: ${error instanceof Error ? error.message : "unknown"}`,
                      });
                    } finally {
                      setAuthBusy(false);
                    }
                  }}
                >
                  <User className="h-4 w-4" />
                  Anonymous
                </button>
              </div>
              <p className="text-[10px] text-muted">
                Google sign-in recommended for easy access across devices. Anonymous works but is harder to recover.
              </p>
              <p className="text-[9px] text-cp-yellow/70">
                If signing in from another device, add its host to Firebase Auth → Authorized domains.
              </p>
            </div>
          )}
        </section>

        <section className="hud-panel p-5">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cp-yellow" />
            <p className="hud-label text-cp-yellow">Vault Data</p>
          </div>
          <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
            Backup & Restore
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Everything lives in this browser&apos;s local storage. Export a JSON backup before clearing site data,
            switching devices, or trying a risky import.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="border border-line bg-black/20 p-2.5">
              <p className="hud-label text-[8px]">Unique</p>
              <p className="font-display mt-1 text-lg leading-none text-cp-yellow">
                {stats.ownedUnique}
                <span className="text-[9px] text-muted">/{stats.totalCards}</span>
              </p>
            </div>
            <div className="border border-line bg-black/20 p-2.5">
              <p className="hud-label text-[8px]">Decks</p>
              <p className="font-display mt-1 text-lg leading-none text-fog">{decks.length}</p>
            </div>
            <div className="border border-line bg-black/20 p-2.5">
              <p className="hud-label text-[8px]">Matches</p>
              <p className="font-display mt-1 text-lg leading-none text-fog">{matches.length}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-cyber" onClick={exportFile}>
              <Download className="h-4 w-4" />
              Export Backup
            </button>
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={copyJson}>
              <FileJson className="h-4 w-4" />
              Copy JSON
            </button>
            <button type="button" className="btn-cyber btn-cyber-cyan" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Import File
            </button>
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => setPasteOpen(true)}>
              Paste JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="font-mono flex items-center gap-1.5 text-[9px] tracking-[0.1em] text-muted">
              <HardDrive className="h-3 w-3" />
              LOCAL PAYLOAD
            </span>
            <span className="font-mono text-[9px] text-muted">{(storageSize / 1024).toFixed(1)} KB</span>
          </div>
        </section>

        <section className="hud-panel p-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-cp-yellow" />
            <p className="hud-label text-cp-yellow">Card Index</p>
          </div>
          <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
            Data Source
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Card mechanics come from the Netdeck Cyberpunk endpoint. Images are downloaded once and cached locally,
            so signed source URLs expiring does not break the vault.
          </p>

          <dl className="mt-4 space-y-2">
            {[
              ["Cards indexed", String(cardMeta.count)],
              ["Sets", String(cardMeta.sets.length)],
              ["Legends", String(cards.filter((card) => card.type === "Legend").length)],
              ["Snapshot generated", formatDateTime(cardMeta.generatedAt)],
              ["Image cache", "public/cards · WebP 600px"],
              ["Source", "api.netdeck.gg · tenant snapshot"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-line/60 pb-1.5 text-[11px]">
                <dt className="text-muted">{label}</dt>
                <dd className="font-mono text-right text-fog">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border border-cp-yellow/20 bg-cp-yellow/5 p-3">
            <p className="font-mono text-[8px] leading-relaxed tracking-[0.06em] text-cp-yellow/90">
              NETDECK&apos;S PUBLIC API IS STILL MARKED COMING SOON. THE CURRENT ENDPOINT IS UNDOCUMENTED AND MAY
              CHANGE. RE-RUN <span className="text-cp-yellow">node scripts/sync-cards.mjs</span> TO REFRESH THE
              SNAPSHOT.
            </p>
          </div>
        </section>

        <section className="hud-panel p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="hud-label text-cp-red">Danger Zone</p>
              <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
                Reset Local Vault
              </h2>
              <p className="mt-1 text-xs text-muted">
                Clears the collection, every deck, and the full match log. Card data stays intact.
              </p>
            </div>
            <button type="button" className="btn-cyber btn-cyber-red" onClick={() => { setResetConfirm(""); setResetOpen(true); }}>
              <RotateCcw className="h-4 w-4" />
              Reset Everything
            </button>
          </div>
        </section>
      </div>

      <p className="mt-6 text-center font-mono text-[8px] tracking-[0.18em] text-muted/50 uppercase">
        Kiroshi Vault · Local build · Not affiliated with CD Projekt Red or WeirdCo
      </p>

      <Modal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        eyebrow="Restore Data"
        title="Paste Backup JSON"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => setPasteOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-cyber" onClick={() => applyImport(pasteValue)} disabled={!pasteValue.trim()}>
              <Upload className="h-4 w-4" />
              Import
            </button>
          </div>
        }
      >
        <textarea
          value={pasteValue}
          onChange={(event) => setPasteValue(event.target.value)}
          className="hud-textarea min-h-64 font-mono text-[11px]"
          placeholder='{"collection": { ... }, "decks": [ ... ], "matches": [ ... ]}'
        />
        <p className="mt-2 text-[11px] text-muted">
          Import merges at the top level: collection, decks, and matches replace their current values.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => { setResetOpen(false); setResetConfirm(""); }}
        eyebrow="Confirm Purge"
        title="Reset Local Vault"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => { setResetOpen(false); setResetConfirm(""); }}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-cyber btn-cyber-red"
              disabled={resetConfirm.trim() !== RESET_PHRASE}
              onClick={() => {
                resetAll();
                setResetOpen(false);
                setResetConfirm("");
                setStatus({ tone: "ok", message: "Local vault cleared." });
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          This deletes {stats.ownedUnique} owned cards, {decks.length} decks, and {matches.length} matches from this
          browser. Export a backup first if you might want them back.
        </p>
        <div className="mt-4 space-y-2">
          <p className="font-mono text-[10px] tracking-[0.1em] text-cp-red/90">
            To confirm, type exactly:{" "}
            <span className="font-bold text-cp-red">{RESET_PHRASE}</span>
          </p>
          <input
            type="text"
            value={resetConfirm}
            onChange={(event) => setResetConfirm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && resetConfirm.trim() === RESET_PHRASE) {
                resetAll();
                setResetOpen(false);
                setResetConfirm("");
                setStatus({ tone: "ok", message: "Local vault cleared." });
              }
            }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="hud-input w-full font-mono text-[12px]"
            placeholder={RESET_PHRASE}
            aria-label="Type the confirmation phrase to reset the vault"
          />
        </div>
      </Modal>
    </div>
  );
}
