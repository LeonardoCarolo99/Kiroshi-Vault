import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const PRODUCT_URL = "https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_23.json";
const PRICE_URL = "https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_23.json";

function norm(s: string) {
  return (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cardKey(card: any) {
  return norm(card.subname ? `${card.name} - ${card.subname}` : card.name);
}

export const revalidate = 3600;

export async function GET() {
  try {
    const cardsPath = path.join(process.cwd(), "src", "data", "cards.json");
    const cardsRaw = JSON.parse(await fs.readFile(cardsPath, "utf8"));

    const [prodRes, priceRes] = await Promise.all([
      fetch(PRODUCT_URL, { next: { revalidate: 3600 } }),
      fetch(PRICE_URL, { next: { revalidate: 3600 } }),
    ]);
    if (!prodRes.ok || !priceRes.ok) {
      return NextResponse.json({ error: "fetch failed" }, { status: 502 });
    }
    const prodJson = await prodRes.json();
    const priceJson = await priceRes.json();

    const products = prodJson.products || [];
    const priceGuides: any[] = priceJson.priceGuides || [];
    const priceById = new Map(priceGuides.map((p: any) => [p.idProduct, p]));

    const prices: Record<string, any> = {};
    for (const card of cardsRaw) {
      const keyNorm = cardKey(card);
      const candidates = products.filter((p: any) => norm(p.name) === keyNorm);
      // choose candidate with the lowest real market price (base printing), avoiding outlier/high variants
      let chosen: any = null;
      let bestVal = Infinity;
      for (const p of candidates) {
        const pg = priceById.get(p.idProduct);
        if (!pg) continue;
        // require a real market price (avg or trend), not just a lone listing
        if (pg.avg == null && pg.trend == null) continue;
        const val = pg.avg ?? (pg.trend || null) ?? pg.low;
        if (val == null) continue;
        if (val < bestVal) { bestVal = val; chosen = pg; }
      }
      // fallback: any candidate with a price
      if (!chosen) {
        for (const p of candidates) {
          const pg = priceById.get(p.idProduct);
          if (!pg) continue;
          if (pg.avg != null || pg.low != null || pg.trend != null) { chosen = pg; break; }
        }
      }
      if (!chosen && candidates.length) chosen = priceById.get(candidates[0].idProduct);
      if (chosen) {
        prices[card.id] = {
          eur: chosen.avg ?? (chosen.trend || null) ?? chosen.low ?? null,
          trendEur: chosen.trend || null,
          lowEur: chosen.low ?? null,
          avgEur: chosen.avg ?? null,
          avg1Eur: chosen["avg1"] ?? null,
          avg7Eur: chosen["avg7"] ?? null,
          avg30Eur: chosen["avg30"] ?? null,
          updatedAt: priceJson.createdAt,
        };
      }
    }

    return NextResponse.json({ updatedAt: priceJson.createdAt, prices });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
