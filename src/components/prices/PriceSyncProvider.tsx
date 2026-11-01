"use client";

import { useEffect, useState } from "react";
import { cards, cardsById } from "@/lib/cards";

const CACHE_KEY = "kiroshi_prices_v1";

export function PriceSyncProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);

  const applyData = (data: any) => {
    const prices = data?.prices || {};
    for (const card of cards) {
      if (prices[card.id]) card.prices = prices[card.id];
    }
    for (const [id, price] of Object.entries(prices)) {
      const card = cardsById.get(id);
      if (card) card.prices = price as any;
    }
  };

  useEffect(() => {
    let cancelled = false;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        applyData(JSON.parse(cached));
        setReady(true);
      }
    } catch {
      // ignore
    }

    (async () => {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          applyData(data);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
          setRevision((r) => r + 1);
          setReady(true);
        } else if (!ready) {
          setReady(true);
        }
      } catch {
        if (!ready && !cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04060a] text-fog">
        <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
          Syncing market prices…
        </div>
      </div>
    );
  }

  return <div key={revision}>{children}</div>;
}
