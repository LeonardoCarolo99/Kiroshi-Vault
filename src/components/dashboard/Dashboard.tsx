"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Crosshair,
  Database,
  Hand,
  Layers3,
  Plus,
  ScanEye,
  ShieldCheck,
  ShieldAlert,
  Swords,
  Trophy,
  Wallet,
} from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { cards, COLOR_HEX, deckValidationSummary } from "@/lib/cards";
import { collectionStats, deckLegends, matchStats } from "@/lib/stats";
import { formatDate, relativeDate } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

function StatTile({
  label,
  value,
  detail,
  icon,
  tone = "yellow",
  href,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  tone?: "cyan" | "yellow" | "red" | "green";
  href?: string;
}) {
  const tones = {
    cyan: "text-cp-cyan border-cp-cyan/30 bg-cp-cyan/5",
    yellow: "text-cp-yellow border-cp-yellow/30 bg-cp-yellow/5",
    red: "text-cp-red border-cp-red/30 bg-cp-red/5",
    green: "text-cp-green border-cp-green/30 bg-cp-green/5",
  };
  const body = (
    <div className="hud-panel hud-panel-hover flex h-full flex-col justify-between p-4">
      <div className="flex items-start justify-between">
        <span className="hud-label">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center border clip-notch", tones[tone])}>
          {icon}
        </span>
      </div>
      <div className="mt-4">
        <p className="font-display text-3xl leading-none text-fog">{value}</p>
        <p className="mt-1.5 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">{detail}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Dashboard() {
  const collection = useVaultStore((state) => state.collection);
  const decks = useVaultStore((state) => state.decks);
  const matches = useVaultStore((state) => state.matches);

  const stats = collectionStats(collection);
  const matchSummary = matchStats(matches, decks);
  const recentMatches = matches.slice(0, 5);
  const recentDecks = decks.slice(0, 3);

  return (
    <div className="space-y-5 animate-fade">
      {/* Hero */}
      <section className="hud-panel relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-hud-lines opacity-20" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cp-yellow/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cp-cyan/8 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="badge badge-green">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cp-green" />
                Local uplink
              </span>
              <span className="badge">Night City // 2077</span>
              <span className="badge badge-yellow">{cards.length} cards indexed</span>
            </div>
            <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-[0.04em] text-fog sm:text-6xl">
              Kiroshi
              <span className="block text-cp-yellow text-glow-yellow">Vault</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              Your personal command deck for the Cyberpunk Trading Card Game. Track the collection,
              build legal decks, log every match, and test your opening hands before you sit down at
              the table.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:max-w-md">
            <Link href="/matches" className="btn-cyber">
              <Plus className="h-4 w-4" />
              Log Match
            </Link>
            <Link href="/decks" className="btn-cyber">
              <Plus className="h-4 w-4" />
              New Deck
            </Link>
            <Link href="/collection" className="btn-cyber btn-cyber-ghost">
              <ScanEye className="h-4 w-4" />
              Scan Vault
            </Link>
            <Link href="/hand-tester" className="btn-cyber btn-cyber-ghost">
              <Hand className="h-4 w-4" />
              Test Hand
            </Link>
          </div>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="stagger grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Unique Owned"
          value={`${stats.ownedUnique}`}
          detail={`${stats.completion}% of ${stats.totalCards} cards`}
          icon={<Layers3 className="h-4 w-4" />}
          tone="yellow"
          href="/collection"
        />
        <StatTile
          label="Total Copies"
          value={stats.totalCopies}
          detail={`${stats.legendsOwned}/${stats.legendsTotal} legends secured`}
          icon={<Wallet className="h-4 w-4" />}
          tone="cyan"
          href="/collection"
        />
        <StatTile
          label="Decks Built"
          value={decks.length}
          detail={
            decks.length
              ? `${decks.filter((deck) => deckValidationSummary(deck).legal).length} tournament legal`
              : "No decks on file"
          }
          icon={<Boxes className="h-4 w-4" />}
          tone="green"
          href="/decks"
        />
        <StatTile
          label="Win Rate"
          value={matchSummary.total ? `${matchSummary.winRate}%` : "—"}
          detail={
            matchSummary.total
              ? `${matchSummary.wins}W · ${matchSummary.losses}L · ${matchSummary.draws}D`
              : "Log your first match"
          }
          icon={<Trophy className="h-4 w-4" />}
          tone="red"
          href="/matches"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="stagger space-y-5">
          {/* Collection progress */}
          <section className="hud-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="hud-label text-cp-yellow">Archive Progress</p>
                <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
                  Collection
                </h2>
              </div>
              <Link
                href="/collection"
                className="font-mono flex items-center gap-1 text-[9px] tracking-[0.16em] text-cp-yellow uppercase hover:underline"
              >
                Open <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <p className="font-display text-4xl leading-none text-cp-yellow">
                {stats.completion}
                <span className="text-lg text-muted">%</span>
              </p>
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted">
                {stats.ownedUnique} / {stats.totalCards} UNIQUE
              </p>
            </div>
            <ProgressBar value={stats.ownedUnique} max={stats.totalCards} color="#f5e400" className="mt-2.5" />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {stats.byColor.map((entry) => (
                <div key={entry.color} className="border border-line bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono flex items-center gap-2 text-[9px] tracking-[0.16em] uppercase" style={{ color: COLOR_HEX[entry.color] }}>
                      <span className="h-2 w-2" style={{ background: COLOR_HEX[entry.color] }} />
                      {entry.color}
                    </span>
                    <span className="font-mono text-[9px] text-muted">
                      {entry.owned}/{entry.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={entry.owned}
                    max={entry.total}
                    color={COLOR_HEX[entry.color]}
                    className="mt-2"
                  />
                  <p className="mt-1.5 font-mono text-[8px] tracking-[0.12em] text-muted/70">
                    {entry.copies} copies logged
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3">
              {stats.byType.map((entry) => (
                <div key={entry.type} className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">{entry.type}</span>
                  <span className="font-display text-sm text-fog">
                    {entry.owned}
                    <span className="text-[9px] text-muted">/{entry.total}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent matches */}
          <section className="hud-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="hud-label text-cp-red">Combat Log</p>
                <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
                  Recent Matches
                </h2>
              </div>
              <Link
                href="/matches"
                className="font-mono flex items-center gap-1 text-[9px] tracking-[0.16em] text-cp-yellow uppercase hover:underline"
              >
                Full log <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {recentMatches.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center border border-dashed border-line px-6 py-10 text-center">
                <Crosshair className="h-7 w-7 text-muted/60" />
                <p className="font-display mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-fog">
                  No matches logged
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted">
                  Record your first game to start tracking win rates and deck performance.
                </p>
                <Link href="/matches" className="btn-cyber mt-4">
                  <Plus className="h-3.5 w-3.5" />
                  Log Match
                </Link>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-line">
                {recentMatches.map((match) => {
                  const deck = decks.find((item) => item.id === match.deckId);
                  const tone =
                    match.result === "win"
                      ? "text-cp-green border-cp-green/40 bg-cp-green/8"
                      : match.result === "loss"
                        ? "text-cp-red border-cp-red/40 bg-cp-red/8"
                        : "text-cp-yellow border-cp-yellow/40 bg-cp-yellow/8";
                  return (
                    <div key={match.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className={cn(
                          "font-display flex h-9 w-9 shrink-0 items-center justify-center border text-xs font-bold uppercase",
                          tone,
                        )}
                      >
                        {match.result.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-fog">
                          vs {match.opponentName || "Unknown opponent"}
                        </p>
                        <p className="truncate font-mono text-[9px] tracking-[0.08em] text-muted">
                          {deck?.name ?? "No deck"} · {match.gamesWon}–{match.gamesLost} ·{" "}
                          {formatDate(match.date)}
                        </p>
                      </div>
                      <span className="font-mono hidden text-[9px] tracking-[0.1em] text-muted sm:block">
                        {relativeDate(match.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="stagger space-y-5">
          {/* Decks */}
          <section className="hud-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="hud-label text-cp-green">Loadout</p>
                <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
                  Decks
                </h2>
              </div>
              <Link
                href="/decks"
                className="font-mono flex items-center gap-1 text-[9px] tracking-[0.16em] text-cp-yellow uppercase hover:underline"
              >
                All <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {recentDecks.length === 0 ? (
              <div className="mt-4 border border-dashed border-line px-4 py-8 text-center">
                <Boxes className="mx-auto h-6 w-6 text-muted/60" />
                <p className="mt-2 text-xs text-muted">No decks yet. Build your first loadout.</p>
                <Link href="/decks" className="btn-cyber mt-3">
                  <Plus className="h-3.5 w-3.5" />
                  Build Deck
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {recentDecks.map((deck) => {
                  const summary = deckValidationSummary(deck);
                  const legends = deckLegends(deck);
                  return (
                    <Link
                      key={deck.id}
                      href={`/decks/${deck.id}`}
                      className="block border border-line bg-black/20 p-3 transition-colors hover:border-line-bright hover:bg-white/[0.025]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display truncate text-[13px] font-semibold uppercase tracking-[0.04em] text-fog">
                          {deck.name}
                        </p>
                        <span
                          className={cn(
                            "badge shrink-0",
                            summary.legal ? "badge-green" : "badge-red",
                          )}
                        >
                          {summary.legal ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <ShieldAlert className="h-3 w-3" />
                          )}
                          {summary.legal ? "Legal" : `${summary.issueCount}`}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between font-mono text-[9px] tracking-[0.1em] text-muted">
                        <span className="flex items-center gap-1.5">
                          {legends.map((legend) => (
                            <span
                              key={legend.id}
                              className="h-1.5 w-1.5"
                              style={{ background: legend.color ? COLOR_HEX[legend.color] : "#7f91a8" }}
                              title={legend.displayName}
                            />
                          ))}
                          <span className="ml-1">{legends.length}/3 legends</span>
                        </span>
                        <span>
                          {summary.mainCount}/50 · {summary.sideboardCount}/7
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* System feed */}
          <section className="hud-panel p-5">
            <p className="hud-label text-cp-yellow">System Feed</p>
            <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.05em] text-fog">
              Quick Ops
            </h2>
            <div className="mt-3 space-y-2">
              <Link href="/hand-tester" className="flex items-center gap-3 border border-line bg-black/20 p-3 transition-colors hover:border-cp-yellow/40 hover:bg-cp-yellow/5">
                <Hand className="h-4 w-4 text-cp-yellow" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-fog">Opening Hand Tester</p>
                  <p className="font-mono text-[8px] tracking-[0.1em] text-muted">DRAW 6 · ONE MULLIGAN</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
              <Link href="/decks" className="flex items-center gap-3 border border-line bg-black/20 p-3 transition-colors hover:border-cp-green/40 hover:bg-cp-green/5">
                <Boxes className="h-4 w-4 text-cp-green" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-fog">Deck Builder</p>
                  <p className="font-mono text-[8px] tracking-[0.1em] text-muted">FULL RULES VALIDATION</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
              <Link href="/matches" className="flex items-center gap-3 border border-line bg-black/20 p-3 transition-colors hover:border-cp-red/40 hover:bg-cp-red/5">
                <Swords className="h-4 w-4 text-cp-red" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-fog">Match Tracker</p>
                  <p className="font-mono text-[8px] tracking-[0.1em] text-muted">
                    {matchSummary.total} MATCHES · {matchSummary.winRate}% WR
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
              <Link href="/settings" className="flex items-center gap-3 border border-line bg-black/20 p-3 transition-colors hover:border-cp-yellow/40 hover:bg-cp-yellow/5">
                <Database className="h-4 w-4 text-cp-yellow" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-fog">Data & Backup</p>
                  <p className="font-mono text-[8px] tracking-[0.1em] text-muted">EXPORT · IMPORT · RESET</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            </div>
          </section>

          {/* Streak */}
          {matchSummary.currentStreak ? (
            <section className="hud-panel p-5">
              <p className="hud-label text-cp-yellow">Current Streak</p>
              <div className="mt-2 flex items-end gap-3">
                <p
                  className={cn(
                    "font-display text-4xl leading-none",
                    matchSummary.currentStreak.type === "win"
                      ? "text-cp-green"
                      : matchSummary.currentStreak.type === "loss"
                        ? "text-cp-red"
                        : "text-cp-yellow",
                  )}
                >
                  {matchSummary.currentStreak.count}
                </p>
                <p className="font-mono pb-1 text-[10px] tracking-[0.16em] text-muted uppercase">
                  {matchSummary.currentStreak.type}
                  {matchSummary.currentStreak.count === 1 ? "" : "es"} in a row
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
