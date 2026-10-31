"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  ArrowDownToLine,
  Layers,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  BarChart3,
  Globe,
  Lock,
  Euro,
} from "lucide-react";
import type { Card } from "@/lib/types";
import { useVaultStore } from "@/lib/store";
import { COLOR_HEX, deckValidationSummary, validateDeck, getCard } from "@/lib/cards";
import { decklistText, cardmarketText } from "@/lib/deckExport";
import type { DeckExportFormat } from "@/lib/deckExport";
import { deckLegends } from "@/lib/stats";
import { DeckList } from "@/components/decks/DeckList";
import { DeckSearchPanel } from "@/components/decks/DeckSearchPanel";
import { DeckValidationPanel } from "@/components/decks/DeckValidationPanel";
import { LegendPicker } from "@/components/decks/LegendPicker";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

type MobileTab = "deck" | "add" | "analysis";

export function DeckBuilder({ deckId }: { deckId: string }) {
  const router = useRouter();
  const { playClick, playSuccess } = useSound();
  const decks = useVaultStore((state) => state.decks);
  const collection = useVaultStore((state) => state.collection);
  const adjustCollection = useVaultStore((state) => state.adjustCollection);
  const updateDeck = useVaultStore((state) => state.updateDeck);
  const deleteDeck = useVaultStore((state) => state.deleteDeck);
  const toggleLegend = useVaultStore((state) => state.toggleLegend);
  const adjustDeckCard = useVaultStore((state) => state.adjustDeckCard);

  const deck = useMemo(() => decks.find((entry) => entry.id === deckId), [decks, deckId]);
  const [target, setTarget] = useState<"main" | "sideboard">("main");
  const [mobileTab, setMobileTab] = useState<MobileTab>("deck");
  const [legendOpen, setLegendOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inspected, setInspected] = useState<Card | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<DeckExportFormat>("decklist");
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const validation = useMemo(() => (deck ? validateDeck(deck) : null), [deck]);
  const summary = useMemo(() => (deck ? deckValidationSummary(deck) : null), [deck]);
  const legends = useMemo(() => (deck ? deckLegends(deck) : []), [deck]);

  const deckPrice = useMemo(() => {
    if (!deck) return 0;
    let total = 0;
    for (const id of deck.legendIds) {
      const card = getCard(id);
      if (card?.prices?.eur) total += card.prices.eur;
    }
    for (const [id, count] of Object.entries(deck.cards)) {
      const card = getCard(id);
      if (card?.prices?.eur) total += card.prices.eur * count;
    }
    for (const [id, count] of Object.entries(deck.sideboard)) {
      const card = getCard(id);
      if (card?.prices?.eur) total += card.prices.eur * count;
    }
    return total;
  }, [deck]);

  const exportText = useMemo(() => {
    if (!deck) return "";
    return exportFormat === "cardmarket"
      ? cardmarketText(deck.legendIds, deck.cards, deck.sideboard)
      : decklistText(deck.name, deck.legendIds, deck.cards, deck.sideboard);
  }, [deck, exportFormat]);

  if (!deck || !validation || !summary) {
    return (
      <div className="hud-panel mx-auto mt-10 max-w-lg p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-cp-red" />
        <h1 className="font-display mt-3 text-2xl font-bold uppercase tracking-[0.06em] text-fog">
          Deck Not Found
        </h1>
        <p className="mt-2 text-sm text-muted">
          This loadout is not in the local archive. It may have been deleted or belong to another profile.
        </p>
        <Link href="/decks" className="btn-cyber mt-5">
          <ArrowLeft className="h-4 w-4" />
          Back to Decks
        </Link>
      </div>
    );
  }

  const colors = [...new Set(legends.map((legend) => legend.color).filter(Boolean))] as string[];

  const handleAdd = (card: Card) => {
    adjustDeckCard(deck.id, card.id, target, 1);
  };

  const handleAdjust = (card: Card, targetKey: "main" | "sideboard", delta: number) => {
    adjustDeckCard(deck.id, card.id, targetKey, delta);
  };

  const openSettings = () => {
    setNameDraft(deck.name);
    setDescriptionDraft(deck.description);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    playSuccess();
    updateDeck(deck.id, {
      name: nameDraft.trim() || deck.name,
      description: descriptionDraft.trim(),
    });
    setSettingsOpen(false);
  };

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      playClick();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const downloadList = () => {
    playClick();
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${deck.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "deck"}-${exportFormat}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const inspectContext =
    inspected && inspected.type !== "Legend"
      ? {
          deckName: deck.name,
          count:
            target === "main" ? (deck.cards[inspected.id] ?? 0) : (deck.sideboard[inspected.id] ?? 0),
          onAdd: () => adjustDeckCard(deck.id, inspected.id, target, 1),
          onRemove: () => adjustDeckCard(deck.id, inspected.id, target, -1),
        }
      : undefined;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/decks"
          className="font-mono flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-muted uppercase transition-colors hover:text-cp-yellow"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Deck Archive
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-green">
            <Euro className="h-3 w-3" />
            {deckPrice > 0 ? `€${deckPrice.toFixed(2)}` : "€0.00"}
          </span>
          <span className={cn("badge", summary.legal ? "badge-green" : "badge-red")}>
            {summary.legal ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            {summary.legal ? "Legal" : `${summary.issueCount} issue${summary.issueCount === 1 ? "" : "s"}`}
          </span>
          <div className="flex items-center gap-1">
            <select
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value as DeckExportFormat)}
              aria-label="Export format"
              className="hud-input !min-h-8 !py-1.5 !text-[9px] !w-auto"
            >
              <option value="decklist">Decklist</option>
              <option value="cardmarket">CardMarket</option>
            </select>
            <button type="button" className="btn-cyber btn-cyber-ghost !min-h-8 !py-1.5 !text-[9px]" onClick={copyList}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" className="icon-btn h-8 w-8" onClick={downloadList} aria-label="Download deck list">
              <ArrowDownToLine className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={cn("icon-btn h-8 w-8", deck.public ? "text-cp-cyan border-cp-cyan/40" : "")}
              onClick={() => updateDeck(deck.id, { public: !deck.public })}
              aria-label={deck.public ? "Make deck private" : "Make deck public"}
              title={deck.public ? "Public - visible to friends" : "Private"}
            >
              {deck.public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={() => {
              playClick();
              openSettings();
            }}
            aria-label="Deck settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="icon-btn h-8 w-8 hover:border-cp-red/50 hover:text-cp-red"
            onClick={() => {
              playClick();
              setDeleteOpen(true);
            }}
            aria-label="Delete deck"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Identity */}
      <section className="hud-panel mb-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="hud-label text-cp-yellow">Active Loadout</p>
              <span className="font-mono flex items-center gap-1 text-[8px] tracking-[0.14em] text-cp-green">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cp-green" />
                AUTO-SAVED
              </span>
            </div>
            <input
              value={deck.name}
              onChange={(event) => updateDeck(deck.id, { name: event.target.value })}
              className="font-display w-full border-0 bg-transparent p-0 text-2xl font-bold uppercase tracking-[0.04em] text-fog outline-none placeholder:text-muted/50 focus:text-cp-yellow sm:text-3xl"
              maxLength={60}
              aria-label="Deck name"
            />
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
              {deck.description || "No strategy notes yet. Add them from deck settings."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {colors.length ? (
              colors.map((color) => (
                <span
                  key={color}
                  className="font-mono flex items-center gap-1 border px-2 py-1 text-[8px] tracking-[0.12em] uppercase"
                  style={{
                    borderColor: `${COLOR_HEX[color]}55`,
                    color: COLOR_HEX[color],
                    background: `${COLOR_HEX[color]}10`,
                  }}
                >
                  <span className="h-1.5 w-1.5" style={{ background: COLOR_HEX[color] }} />
                  {color}
                </span>
              ))
            ) : (
              <span className="badge">No colors locked</span>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:grid-cols-4">
          <div>
            <p className="hud-label text-[8px]">Legends</p>
            <p className="font-display mt-0.5 text-lg text-fog">
              {validation.legendCount}
              <span className="text-[10px] text-muted">/3</span>
            </p>
          </div>
          <div>
            <p className="hud-label text-[8px]">Main Deck</p>
            <p className={cn("font-display mt-0.5 text-lg", validation.mainCount >= 40 && validation.mainCount <= 50 ? "text-cp-green" : "text-fog")}>
              {validation.mainCount}
              <span className="text-[10px] text-muted">/50</span>
            </p>
          </div>
          <div>
            <p className="hud-label text-[8px]">Sideboard</p>
            <p className="font-display mt-0.5 text-lg text-fog">
              {validation.sideboardCount}
              <span className="text-[10px] text-muted">/7</span>
            </p>
          </div>
          <div>
            <p className="hud-label text-[8px]">Unique Main</p>
            <p className="font-display mt-0.5 text-lg text-fog">
              {Object.keys(deck.cards).filter((id) => (deck.cards[id] ?? 0) > 0).length}
            </p>
          </div>
        </div>
      </section>

      {/* Mobile tabs */}
      <div className="mb-4 grid grid-cols-3 gap-1 border border-line bg-black/30 p-1 xl:hidden">
        {(
          [
            { key: "deck", label: "Deck", icon: <Layers className="h-3.5 w-3.5" /> },
            { key: "add", label: "Add Cards", icon: <Search className="h-3.5 w-3.5" /> },
            { key: "analysis", label: "Analysis", icon: <BarChart3 className="h-3.5 w-3.5" /> },
          ] as { key: MobileTab; label: string; icon: React.ReactNode }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              playClick();
              setMobileTab(tab.key);
            }}
            className={cn(
              "font-mono flex items-center justify-center gap-1.5 border px-2 py-2 text-[9px] tracking-[0.1em] uppercase transition-colors",
              mobileTab === tab.key
                ? "border-cp-yellow/50 bg-cp-yellow/10 text-cp-yellow"
                : "border-transparent text-muted hover:text-fog",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className={cn(mobileTab !== "deck" && "hidden xl:block")}>
          <DeckList
            deck={deck}
            validation={validation}
            legends={legends}
            onOpenLegendPicker={() => setLegendOpen(true)}
            onRemoveLegend={(card) => toggleLegend(deck.id, card.id)}
            onAdjust={handleAdjust}
            onInspect={setInspected}
          />
        </div>

        <div className={cn("space-y-4 xl:sticky xl:top-4 xl:self-start", mobileTab === "deck" && "hidden xl:block")}>
          <div className={cn(mobileTab === "analysis" ? "block" : "hidden xl:block")}>
            <DeckValidationPanel deck={deck} validation={validation} collection={collection} />
          </div>
          <div className={cn(mobileTab === "add" ? "block" : "hidden xl:block")}>
            <DeckSearchPanel
              validation={validation}
              target={target}
              onTargetChange={setTarget}
              onAdd={handleAdd}
              onInspect={setInspected}
              collection={collection}
            />
          </div>
        </div>
      </div>

      {/* Quick add hint on desktop */}
      <p className="mt-6 hidden items-center justify-center gap-2 font-mono text-[8px] tracking-[0.16em] text-muted/50 uppercase xl:flex">
        <Plus className="h-3 w-3" />
        Auto-save enabled · changes persist locally
      </p>

      <LegendPicker
        open={legendOpen}
        onClose={() => setLegendOpen(false)}
        selected={deck.legendIds}
        onToggle={(card) => toggleLegend(deck.id, card.id)}
      />

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        eyebrow="Loadout Config"
        title="Deck Settings"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => { playClick(); setSettingsOpen(false); }}>
              Cancel
            </button>
            <button type="button" className="btn-cyber" onClick={saveSettings}>
              <Check className="h-4 w-4" />
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="hud-label mb-1.5 block">Deck Name</span>
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className="hud-input"
              maxLength={60}
            />
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Notes / Strategy</span>
            <textarea
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              className="hud-textarea"
              maxLength={280}
              placeholder="Game plan, matchups, tech choices..."
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        eyebrow="Confirm Purge"
        title="Delete Deck"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-cyber btn-cyber-ghost" onClick={() => { playClick(); setDeleteOpen(false); }}>
              Keep Deck
            </button>
            <button
              type="button"
              className="btn-cyber btn-cyber-red"
              onClick={() => {
                playClick();
                deleteDeck(deck.id);
                router.push("/decks");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Delete <span className="font-semibold text-fog">{deck.name}</span> permanently? Matches logged with
          this deck will be kept but marked with no deck.
        </p>
      </Modal>

      <CardDetailModal
        card={inspected}
        owned={inspected ? (collection[inspected.id] ?? 0) : 0}
        onClose={() => setInspected(null)}
        onAdjust={(card, delta) => adjustCollection(card.id, delta)}
        deckContext={inspectContext}
      />
    </div>
  );
}
