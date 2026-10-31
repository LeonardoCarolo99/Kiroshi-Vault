"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Boxes, ShieldCheck, Globe } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLOR_HEX, deckValidationSummary } from "@/lib/cards";
import { deckLegends } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Deck, VaultSnapshot } from "@/lib/types";

export function UserDecksView({ uid }: { uid: string }) {
  const [snapshot, setSnapshot] = useState<VaultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!db) {
        setError("Firestore not initialized");
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!mounted) return;
        if (!snap.exists()) {
          setError("User not found");
          setLoading(false);
          return;
        }
        const data = snap.data() as VaultSnapshot;
        setSnapshot({
          collection: data.collection ?? {},
          decks: Array.isArray(data.decks) ? data.decks : [],
          matches: Array.isArray(data.matches) ? data.matches : [],
          buyList: Array.isArray(data.buyList) ? data.buyList : [],
          friends: Array.isArray(data.friends) ? data.friends : [],
        });
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [uid]);

  const publicDecks = useMemo(() => {
    if (!snapshot || !snapshot.decks) return [];
    return snapshot.decks.filter((deck) => deck.public);
  }, [snapshot]);

  const deckRows = useMemo(
    () =>
      publicDecks.map((deck) => ({
        deck,
        summary: deckValidationSummary(deck),
        legends: deckLegends(deck),
      })),
    [publicDecks],
  );

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/friends"
          className="font-mono flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-muted uppercase transition-colors hover:text-cp-yellow"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Friends
        </Link>
      </div>

      <PageHeader
        eyebrow="Shared // Net"
        title="Public Decks"
        description="Viewing public loadouts"
        actions={
          <span className="badge badge-cyan">
            <Globe className="h-3 w-3" />
            {publicDecks.length} public
          </span>
        }
      />

      {loading ? (
        <div className="hud-panel p-6 text-center text-sm text-muted">Loading...</div>
      ) : error ? (
        <div className="hud-panel p-6 text-center text-sm text-cp-red">{error}</div>
      ) : publicDecks.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title="No public decks"
          description="This user has no decks marked as public."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {deckRows.map(({ deck, summary, legends }) => (
            <article key={deck.id} className="hud-panel hud-panel-hover flex flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                <div className="min-w-0">
                  <h2 className="font-display truncate text-lg font-bold uppercase leading-tight tracking-[0.04em] text-fog">
                    {deck.name}
                  </h2>
                  <p className="mt-0.5 truncate font-mono text-[9px] tracking-[0.1em] text-muted">
                    UPDATED {relativeDate(deck.updatedAt).toUpperCase()}
                  </p>
                </div>
                <span className={cn("badge shrink-0", summary.legal ? "badge-green" : "badge-red")}>
                  <ShieldCheck className="h-3 w-3" />
                  {summary.legal ? "Legal" : `${summary.issueCount} issue${summary.issueCount === 1 ? "" : "s"}`}
                </span>
              </div>

              <div className="flex-1 px-4 py-3">
                <div className="flex items-center gap-2">
                  {legends.length === 0 ? (
                    <p className="font-mono text-[10px] tracking-[0.1em] text-cp-red">NO LEGENDS</p>
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
                </div>
                {deck.description ? <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{deck.description}</p> : null}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
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
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
