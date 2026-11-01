'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowDownRight, ArrowUpRight, Euro, ExternalLink, Search, ShoppingBag, TrendingDown, TrendingUp } from 'lucide-react';
import { cards, COLOR_HEX, RARITY_COLOR, getCardmarketUrl } from '@/lib/cards';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { PageHeader } from '@/components/ui/PageHeader';
import type { Card } from '@/lib/types';
import { useVaultStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type MoversMode = 'rising' | 'dropping';

export function MarketView() {
  const collection = useVaultStore((state) => state.collection);
  const adjustCollection = useVaultStore((state) => state.adjustCollection);
  const [query, setQuery] = useState('');
  const [moversMode, setMoversMode] = useState<MoversMode>('rising');
  const [selected, setSelected] = useState<Card | null>(null);

  const marketCards = useMemo(() => {
    const list = cards.filter((card) => {
      const price = card.prices;
      if (!price) return false;
      return price.eur != null || price.trendEur != null || price.lowEur != null || price.avgEur != null;
    });
    return list;
  }, []);

  const topExpensive = useMemo(() => {
    return [...marketCards]
      .sort((a, b) => {
        const pa = a.prices || {};
        const pb = b.prices || {};
        const ea = pa.eur ?? pa.lowEur ?? pa.avgEur ?? -Infinity;
        const eb = pb.eur ?? pb.lowEur ?? pb.avgEur ?? -Infinity;
        return eb - ea;
      })
      .slice(0, 3);
  }, [marketCards]);

  const mostPurchased = useMemo(() => {
    return [...marketCards]
      .sort((a, b) => {
        const pa = a.prices || {};
        const pb = b.prices || {};
        const ea = pa.eur ?? pa.trendEur ?? -Infinity;
        const eb = pb.eur ?? pb.trendEur ?? -Infinity;
        return eb - ea;
      })
      .slice(0, 10);
  }, [marketCards]);

  const topPurchasedTop3 = mostPurchased.slice(0, 3);
  const topPurchasedNext7 = mostPurchased.slice(3, 10);

  const priceMovers = useMemo(() => {
    const MIN_DELTA = 0.1;
    const list = marketCards.map((card) => {
      const price = card.prices || {};
      const eur = price.eur ?? 0;
      const trend = price.trendEur ?? price.avgEur ?? price.eur ?? 0;
      const delta = trend - eur;
      const pct = eur > 0 ? (delta / eur) * 100 : 0;
      return { card, eur, trend, delta, pct };
    });
    if (moversMode === 'rising') {
      return [...list]
        .filter((m) => m.delta >= MIN_DELTA)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 10);
    }
    return [...list]
      .filter((m) => m.delta <= -MIN_DELTA)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 10);
  }, [marketCards, moversMode]);

  const searchedResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return marketCards
      .filter((card) => {
        return (
          card.name.toLowerCase().includes(q) ||
          card.displayName.toLowerCase().includes(q) ||
          card.set.name.toLowerCase().includes(q) ||
          (card.slug ? card.slug.toLowerCase().includes(q) : false)
        );
      })
      .slice(0, 40);
  }, [marketCards, query]);

  const handleAdjust = (card: Card, delta: number) => adjustCollection(card.id, delta);

  const renderCardRow = (card: Card, index?: number, priceOverride?: any, keyOverride?: string) => {
    const price = priceOverride || card.prices || {};
    const color = card.color ? COLOR_HEX[card.color] : '#7f91a8';
    const rarityColor = RARITY_COLOR[card.rarity] ?? '#7f91a8';
    const trendUp = price.trendEur != null && price.eur != null && price.trendEur > price.eur;
    const trendDown = price.trendEur != null && price.eur != null && price.trendEur < price.eur;
    const sold = price.soldCount ?? price.salesCount ?? price.sold ?? null;

    return (
      <tr key={keyOverride || card.id} className="group transition-colors hover:bg-white/[0.02]">
        <td className="px-4 py-2.5">
          <button onClick={() => setSelected(card)} className="flex items-center gap-3 text-left">
            <div className="relative h-12 w-9 shrink-0 overflow-hidden border border-line bg-black/40">
              <Image src={card.image} alt="" fill sizes="36px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {index != null && <span className="text-xs text-muted w-4">{index + 1}.</span>}
                <span className="font-display text-sm font-semibold text-fog truncate">{card.name}</span>
                {card.subname && <span className="text-xs text-muted truncate">{card.subname}</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px]" style={{ color }}>{card.color ?? '—'}</span>
                <span className="text-[8px] text-muted">·</span>
                <span className="text-[8px]" style={{ color: rarityColor }}>{card.rarity}</span>
                <span className="text-[8px] text-muted">·</span>
                <span className="text-[8px] text-muted">{card.set.name}</span>
              </div>
            </div>
          </button>
        </td>
        <td className="px-4 py-2.5 text-right">
          {price.eur != null ? <span className="font-mono text-sm text-fog">€{price.eur.toFixed(2)}</span> : <span className="text-xs text-muted">—</span>}
        </td>
        <td className="px-4 py-2.5 text-right">
          {price.trendEur != null ? (
            <span className={cn('inline-flex items-center gap-1 font-mono text-sm', trendUp && 'text-cp-green', trendDown && 'text-cp-red', !trendUp && !trendDown && 'text-fog')}>
              {trendUp && <TrendingUp className="h-3 w-3" />}
              {trendDown && <TrendingDown className="h-3 w-3" />}
              €{price.trendEur.toFixed(2)}
            </span>
          ) : <span className="text-xs text-muted">—</span>}
        </td>
        <td className="px-4 py-2.5 text-right">
          {sold != null ? <span className="inline-flex items-center gap-1 font-mono text-xs text-fog"><ShoppingBag className="h-3 w-3" />{sold.toLocaleString()}</span> : <span className="text-xs text-muted">—</span>}
        </td>
        <td className="px-4 py-2.5 text-right">
          <a href={card.cardmarketUrl || getCardmarketUrl(card)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cp-cyan hover:text-cp-cyan/80 transition-colors">
            <ExternalLink className="h-3 w-3" />
            CardMarket
          </a>
        </td>
      </tr>
    );
  };

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Market // Trends"
        title="Market Trends"
        description="Track CardMarket prices, trends and top sales across Cyberpunk TCG."
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-cyan">
              <Euro className="h-3 w-3" />
              {marketCards.length} priced cards
            </span>
          </div>
        }
      />

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="hud-label text-cp-yellow">Top 3 Most Expensive</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {topExpensive.map((card, idx) => {
            const price = card.prices || {};
            const color = card.color ? COLOR_HEX[card.color] : '#7f91a8';
            const rarityColor = RARITY_COLOR[card.rarity] ?? '#7f91a8';
            return (
              <button key={card.id} onClick={() => setSelected(card)} className="hud-panel group flex items-center gap-4 p-4 text-left transition-colors hover:border-cp-yellow/40">
                <div className="relative h-16 w-11 shrink-0 overflow-hidden border border-line bg-black/40">
                  <Image src={card.image} alt="" fill sizes="44px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cp-yellow">#{idx + 1}</span>
                    <span className="font-display text-base font-semibold text-fog truncate">{card.name}</span>
                  </div>
                  {card.subname && <div className="text-xs text-muted truncate">{card.subname}</div>}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[8px]" style={{ color }}>{card.color ?? '—'}</span>
                    <span className="text-[8px] text-muted">·</span>
                    <span className="text-[8px]" style={{ color: rarityColor }}>{card.rarity}</span>
                    <span className="text-[8px] text-muted">·</span>
                    <span className="text-[8px] text-muted">{card.set.name}</span>
                  </div>
                  <div className="mt-2 font-mono text-lg text-fog">{price.eur != null ? `€${price.eur.toFixed(2)}` : price.lowEur != null ? `€${price.lowEur.toFixed(2)}` : price.avgEur != null ? `€${price.avgEur.toFixed(2)}` : '—'}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3">
          <h2 className="hud-label text-cp-cyan">Card Search</h2>
          <p className="mt-1 text-xs text-muted">Search for any card to view its market statistics in depth</p>
        </div>
        <div className="hud-panel p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by card name, set, or slug..."
              className="w-full border border-line bg-black/40 pl-11 pr-3 py-3 text-base text-fog placeholder:text-muted focus:border-cp-cyan/40 focus:outline-none focus:ring-1 focus:ring-cp-cyan/20"
            />
          </div>
          {query.trim() && (
            <div className="mt-4 overflow-x-auto border border-line bg-black/20">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-black/40">
                    <th className="px-4 py-2.5 text-left hud-label text-[9px]">Card</th>
                    <th className="px-4 py-2.5 text-right hud-label text-[9px]">Price</th>
                    <th className="px-4 py-2.5 text-right hud-label text-[9px]">Trend</th>
                    <th className="px-4 py-2.5 text-right hud-label text-[9px]">Sold</th>
                    <th className="px-4 py-2.5 text-right hud-label text-[9px]">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {searchedResults.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted">No cards match your search</td></tr>
                  ) : (
                    searchedResults.map((card) => renderCardRow(card))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3">
          <h2 className="hud-label text-cp-yellow">Top Priced Cards</h2>
          <p className="mt-1 text-xs text-muted">Ranked by CardMarket price (sales volume unavailable)</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 mb-3">
          {topPurchasedTop3.map((card, idx) => {
            const price = card.prices || {};
            const sold = price.soldCount ?? price.salesCount ?? price.sold ?? null;
            const color = card.color ? COLOR_HEX[card.color] : '#7f91a8';
            const rarityColor = RARITY_COLOR[card.rarity] ?? '#7f91a8';
            return (
              <button key={card.id} onClick={() => setSelected(card)} className="hud-panel group flex items-center gap-4 p-4 text-left transition-colors hover:border-cp-yellow/40">
                <div className="relative h-16 w-11 shrink-0 overflow-hidden border border-line bg-black/40">
                  <Image src={card.image} alt="" fill sizes="44px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cp-yellow">#{idx + 1}</span>
                    <span className="font-display text-base font-semibold text-fog truncate">{card.name}</span>
                  </div>
                  {card.subname && <div className="text-xs text-muted truncate">{card.subname}</div>}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[8px]" style={{ color }}>{card.color ?? '—'}</span>
                    <span className="text-[8px] text-muted">·</span>
                    <span className="text-[8px]" style={{ color: rarityColor }}>{card.rarity}</span>
                    <span className="text-[8px] text-muted">·</span>
                    <span className="text-[8px] text-muted">{card.set.name}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="font-mono text-sm text-fog">{price.eur != null ? `€${price.eur.toFixed(2)}` : '—'}</div>
                    {sold != null && <div className="inline-flex items-center gap-1 text-xs text-cp-cyan"><ShoppingBag className="h-3 w-3" />{sold.toLocaleString()} sold</div>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="overflow-x-auto border border-line bg-black/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-black/40">
                <th className="px-4 py-2.5 text-left hud-label text-[9px]">Card</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Price</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Trend</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Sold</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {topPurchasedNext7.map((card, idx) => renderCardRow(card, idx + 3))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="hud-label text-cp-yellow">Price Movers</h2>
            <p className="mt-1 text-xs text-muted">Biggest price changes based on trend vs current price</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMoversMode('rising')} className={cn('px-3 py-1.5 text-xs border transition-colors', moversMode === 'rising' ? 'border-cp-green/60 text-cp-green bg-cp-green/5' : 'border-line text-muted hover:text-fog')}>
              <span className="inline-flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />Rising</span>
            </button>
            <button onClick={() => setMoversMode('dropping')} className={cn('px-3 py-1.5 text-xs border transition-colors', moversMode === 'dropping' ? 'border-cp-red/60 text-cp-red bg-cp-red/5' : 'border-line text-muted hover:text-fog')}>
              <span className="inline-flex items-center gap-1"><ArrowDownRight className="h-3 w-3" />Dropping</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto border border-line bg-black/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-black/40">
                <th className="px-4 py-2.5 text-left hud-label text-[9px]">Card</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Current</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Trend</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Change</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">% Change</th>
                <th className="px-4 py-2.5 text-right hud-label text-[9px]">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {priceMovers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted">No price movers in this direction</td></tr>
              ) : (
                priceMovers.map((m, idx) => {
                  const card = m.card;
                  const isUp = m.delta > 0;
                  const color = card.color ? COLOR_HEX[card.color] : '#7f91a8';
                  const rarityColor = RARITY_COLOR[card.rarity] ?? '#7f91a8';
                  return (
                    <tr key={card.id} className="group transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <button onClick={() => setSelected(card)} className="flex items-center gap-3 text-left">
                          <div className="relative h-12 w-9 shrink-0 overflow-hidden border border-line bg-black/40">
                            <Image src={card.image} alt="" fill sizes="36px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted w-4">{idx + 1}.</span>
                              <span className="font-display text-sm font-semibold text-fog truncate">{card.name}</span>
                              {card.subname && <span className="text-xs text-muted truncate">{card.subname}</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[8px]" style={{ color }}>{card.color ?? '—'}</span>
                              <span className="text-[8px] text-muted">·</span>
                              <span className="text-[8px]" style={{ color: rarityColor }}>{card.rarity}</span>
                              <span className="text-[8px] text-muted">·</span>
                              <span className="text-[8px] text-muted">{card.set.name}</span>
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right"><span className="font-mono text-sm text-fog">€{m.eur.toFixed(2)}</span></td>
                      <td className="px-4 py-2.5 text-right"><span className="font-mono text-sm text-fog">€{m.trend.toFixed(2)}</span></td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn('inline-flex items-center gap-1 font-mono text-sm', isUp ? 'text-cp-green' : 'text-cp-red')}>
                          {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {isUp ? '+' : ''}€{m.delta.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn('font-mono text-sm', isUp ? 'text-cp-green' : 'text-cp-red')}>
                          {isUp ? '+' : ''}{m.pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <a href={card.cardmarketUrl || getCardmarketUrl(card)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cp-cyan hover:text-cp-cyan/80 transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          CardMarket
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CardDetailModal card={selected} owned={selected ? (collection[selected.id] ?? 0) : 0} onClose={() => setSelected(null)} onAdjust={handleAdjust} />
    </div>
  );
}
