"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle2, ListPlus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { cards, getCard, COLOR_HEX, RARITY_COLOR } from "@/lib/cards";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import type { Card, BuyListPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_ORDER: BuyListPriority[] = ["urgent", "high", "normal", "low"];
const PRIORITY_TONE: Record<BuyListPriority, string> = {
  urgent: "text-cp-red border-cp-red/40 bg-cp-red/10",
  high: "text-cp-orange border-cp-orange/40 bg-cp-orange/10",
  normal: "text-cp-yellow border-cp-yellow/40 bg-cp-yellow/10",
  low: "text-muted border-line bg-black/20",
};

const PRIORITY_LABEL: Record<BuyListPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

export function BuyListView() {
  const buyList = useVaultStore((state) => state.buyList);
  const collection = useVaultStore((state) => state.collection);
  const addBuyListEntry = useVaultStore((state) => state.addBuyListEntry);
  const adjustBuyListObtained = useVaultStore((state) => state.adjustBuyListObtained);
  const removeBuyListEntry = useVaultStore((state) => state.removeBuyListEntry);
  const clearObtainedBuyList = useVaultStore((state) => state.clearObtainedBuyList);

  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | BuyListPriority>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const ownedCount = useMemo(() => Object.values(collection).filter((c) => c > 0).length, [collection]);

  const items = useMemo(() => {
    return buyList
      .map((item) => {
        const card = getCard(item.cardId);
        if (!card) return null;
        return { ...item, card };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => {
        const pa = PRIORITY_ORDER.indexOf(a.priority);
        const pb = PRIORITY_ORDER.indexOf(b.priority);
        if (pa !== pb) return pa - pb;
        if (a.obtained >= a.quantity && b.obtained < b.quantity) return 1;
        if (a.obtained < a.quantity && b.obtained >= b.quantity) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [buyList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (!showCompleted && item.obtained >= item.quantity) return false;
      if (!q) return true;
      const haystack = [item.card.name, item.card.subname, item.card.displayName, item.notes].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [items, priorityFilter, showCompleted, query]);

  const pending = items.filter((item) => item.obtained < item.quantity).length;
  const completed = items.filter((item) => item.obtained >= item.quantity).length;
  const totalNeeded = items.reduce((sum, item) => sum + Math.max(0, item.quantity - item.obtained), 0);

  const quickResults = useMemo(() => {
    if (!addOpen || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return cards.filter((card) => [card.name, card.subname, card.displayName, card.type].join(" ").toLowerCase().includes(q)).slice(0, 8);
  }, [addOpen, query]);

  const addCard = (card: Card) => {
    const existing = buyList.find((item) => item.cardId === card.id && item.obtained < item.quantity);
    if (existing) {
      adjustBuyListObtained(existing.id, 1);
    } else {
      addBuyListEntry({ cardId: card.id, quantity: 1, priority: "normal", notes: "" });
    }
    setQuery("");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Acquisition // 05"
        title="Buy List"
        description="Queue cards to buy. Track what you've picked up and cross off your shopping list."
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-yellow">
              <ShoppingCart className="h-3 w-3" />
              {pending} pending
            </span>
            <span className="badge badge-green">
              <CheckCircle2 className="h-3 w-3" />
              {completed} complete
            </span>
            <button type="button" className="btn-cyber" onClick={() => setAddOpen(true)}>
              <ListPlus className="h-4 w-4" />
              Add Cards
            </button>
          </div>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="hud-panel p-4">
          <p className="hud-label text-[8px]">Need</p>
          <p className="font-display mt-1.5 text-2xl leading-none text-cp-yellow">{totalNeeded}</p>
          <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-muted uppercase">copies to acquire</p>
        </div>
        <div className="hud-panel p-4">
          <p className="hud-label text-[8px]">Pending</p>
          <p className="font-display mt-1.5 text-2xl leading-none text-cp-orange">{pending}</p>
          <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-muted uppercase">items on list</p>
        </div>
        <div className="hud-panel p-4">
          <p className="hud-label text-[8px]">In Collection</p>
          <p className="font-display mt-1.5 text-2xl leading-none text-cp-cyan">{ownedCount}</p>
          <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-muted uppercase">unique owned</p>
        </div>
        <div className="hud-panel p-4">
          <p className="hud-label text-[8px]">Completed</p>
          <p className="font-display mt-1.5 text-2xl leading-none text-cp-green">{completed}</p>
          <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-muted uppercase">fully obtained</p>
        </div>
      </section>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search buy list..." className="hud-input h-10 pl-10 pr-9" aria-label="Search buy list" />
          {query ? <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fog" aria-label="Clear search"><X className="h-4 w-4" /></button> : null}
        </div>
        <div className="flex gap-1 border border-line bg-black/30 p-1">
          {(["all", "urgent", "high", "normal", "low"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setPriorityFilter(value)} className={cn("font-mono px-2.5 py-1.5 text-[9px] tracking-[0.1em] uppercase transition-colors", priorityFilter === value ? (value === "urgent" ? "bg-cp-red/20 text-cp-red" : value === "high" ? "bg-cp-orange/20 text-cp-orange" : value === "normal" ? "bg-cp-yellow/20 text-cp-yellow" : "bg-white/10 text-fog") : "text-muted hover:text-fog")}>
              {value === "all" ? "All" : PRIORITY_LABEL[value]}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowCompleted((v) => !v)} className={cn("btn-cyber btn-cyber-ghost h-10", showCompleted && "text-cp-green")}>{showCompleted ? "Hide Completed" : "Show Completed"}</button>
        {completed > 0 ? <button type="button" onClick={clearObtainedBuyList} className="btn-cyber btn-cyber-ghost h-10">Clear Done</button> : null}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-6 w-6" />} title="Nothing on your shopping list" description="Add cards you need for upcoming decks or to complete your set." action={<button type="button" className="btn-cyber" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add First Card</button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<AlertCircle className="h-6 w-6" />} title="No items match" description="Try changing your filters or search terms." action={<button type="button" className="btn-cyber" onClick={() => { setQuery(""); setPriorityFilter("all"); setShowCompleted(true); }}>Reset Filters</button>} />
      ) : (
        <div className="stagger divide-y divide-line border border-line bg-black/20">
          {filtered.map((item) => {
            const card = item.card;
            const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
            const need = Math.max(0, item.quantity - item.obtained);
            const complete = item.obtained >= item.quantity;
            return (
              <div key={item.id} className={cn("flex flex-col gap-3 p-3 transition-colors sm:flex-row sm:items-center", complete ? "opacity-70" : "hover:bg-white/[0.025]")}>
                <button type="button" onClick={() => setDetailCard(card)} className="relative h-16 w-12 shrink-0 overflow-hidden border border-line bg-black/40 self-start" aria-label={`Inspect ${card.displayName}`}>
                  <Image src={card.image} alt="" fill sizes="48px" className="object-cover" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setDetailCard(card)} className="text-left">
                      <span className="font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-fog">{card.name}</span>
                      {card.subname ? <span className="ml-1.5 text-[11px] text-muted">{card.subname}</span> : null}
                    </button>
                    <span className={cn("font-mono inline-flex items-center gap-1 border px-1.5 py-0.5 text-[8px] tracking-[0.12em] uppercase", PRIORITY_TONE[item.priority])}>{PRIORITY_LABEL[item.priority]}</span>
                    {complete ? <span className="font-mono inline-flex items-center gap-1 border border-cp-green/40 bg-cp-green/10 px-1.5 py-0.5 text-[8px] tracking-[0.12em] text-cp-green uppercase"><CheckCircle2 className="h-2.5 w-2.5" />Complete</span> : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9px] tracking-[0.08em] text-muted">
                    <span style={{ color }}>{card.color ?? "—"}</span>
                    <span>·</span>
                    <span>{card.type}</span>
                    <span>·</span>
                    <span style={{ color: RARITY_COLOR[card.rarity] ?? "#7f91a8" }}>{card.rarity}</span>
                    <span>·</span>
                    <span>{item.obtained}/{item.quantity} obtained{!complete ? ` (${need} need)` : ""}</span>
                  </div>
                  {item.notes ? <p className="mt-1.5 text-xs text-muted/80">{item.notes}</p> : null}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center border border-line bg-black/30">
                    <button type="button" onClick={() => adjustBuyListObtained(item.id, -1)} className="flex h-8 w-8 items-center justify-center text-muted hover:text-fog disabled:opacity-40" disabled={item.obtained <= 0} aria-label="Decrease obtained"><span className="text-lg leading-none">-</span></button>
                    <span className="font-mono flex h-8 w-10 items-center justify-center border-x border-line text-[10px] text-fog">{item.obtained}</span>
                    <button type="button" onClick={() => adjustBuyListObtained(item.id, 1)} className="flex h-8 w-8 items-center justify-center text-muted hover:text-fog disabled:opacity-40" disabled={item.obtained >= item.quantity} aria-label="Increase obtained"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => removeBuyListEntry(item.id)} aria-label="Remove from buy list"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setQuery(""); }} title="Add to Buy List" >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, type..." className="hud-input h-10 pl-10" autoFocus />
          </div>
          <div className="max-h-80 overflow-y-auto border border-line">
            {query.trim().length < 2 ? <p className="p-4 text-center text-xs text-muted">Type at least 2 characters to search.</p> : quickResults.length === 0 ? <p className="p-4 text-center text-xs text-muted">No cards found.</p> : (
              quickResults.map((card) => {
                const color = card.color ? COLOR_HEX[card.color] : "#7f91a8";
                return (
                  <button key={card.id} type="button" onClick={() => addCard(card)} className="flex w-full items-center gap-3 border-b border-line px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-white/[0.025]">
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden border border-line bg-black/40"><Image src={card.image} alt="" fill sizes="36px" className="object-cover" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[12px] font-semibold uppercase tracking-[0.04em] text-fog">{card.name}</p>
                      <p className="font-mono text-[8px] tracking-[0.08em] text-muted"><span style={{ color }}>{card.color ?? "—"}</span> · {card.type} · {card.rarity}</p>
                    </div>
                    <Plus className="h-4 w-4 text-cp-yellow" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      <CardDetailModal card={detailCard} owned={detailCard ? collection[detailCard.id] ?? 0 : 0} onClose={() => setDetailCard(null)} onAdjust={() => {}} />
    </div>
  );
}
