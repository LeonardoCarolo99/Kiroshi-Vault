import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const API = "https://api.netdeck.gg/api";
const TENANT = "8f2b0c91-4d6e-4e7a-9c35-7b1d2f6a8e40";
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const IMAGE_DIR = path.join(ROOT, "public", "cards");
const CACHE_FILE = path.join(DATA_DIR, "cards.raw.json");

const headers = { "X-Tenant-ID": TENANT };

async function fetchPage(offset, limit = 60) {
  const url = `${API}/cards/cyberpunk?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchAllCards() {
  const first = await fetchPage(0, 100);
  const items = [...first.items];
  for (let offset = first.items.length; offset < first.total; offset += 100) {
    const page = await fetchPage(offset, 100);
    items.push(...page.items);
    console.log(`Fetched ${items.length}/${page.total}`);
  }
  return items;
}

function englishPrinting(card) {
  return (
    card.printings?.find((p) => p.id === card.selected_printing_id) ||
    card.printings?.find((p) => p.language === "en") ||
    card.printings?.[0]
  );
}

function normalize(card) {
  const printing = englishPrinting(card);
  const imageSource = printing?.image_url || printing?.source_image_url || card.image_url || card.source_image_url;
  const slug = card.slug;
  
  const printings = (card.printings || [])
    .filter((p) => p.language === "en" || !p.language)
    .map((p) => ({
      id: p.id,
      collectorNumber: p.collector_number || "",
      image: p.image_url || p.source_image_url || imageSource,
      imageUrl: p.image_url || p.source_image_url,
      set: p.set || card.set || printing?.set || { code: "unknown", name: "Unknown" },
      rarity: p.rarity || card.rarity || "Unknown",
      artist: p.artist || card.artist || "",
      finish: p.finish || null,
      language: p.language || "en",
    }));
  
  return {
    id: card.id,
    slug,
    name: card.name,
    subname: card.subname || "",
    displayName: card.display_name || card.name,
    canonicalName: card.canonical_name || card.name,
    rulesText:
      card.official_rules_text_en ||
      printing?.official_rules_text ||
      printing?.printed_rules_text ||
      card.rules_text ||
      "",
    flavorText: card.flavor_text || "",
    color: card.color || null,
    type: card.card_type || "Unknown",
    classifications: card.classifications || [],
    keywords: [
      ...new Set([
        ...(card.keywords || []),
        ...[...String(card.rules_text || "").matchAll(/\{([^}]+)\}/g)].map((m) => m[1]),
        ...(card.is_eddiable ? ["Sell"] : []),
      ]),
    ].sort(),
    cost: typeof card.cost === "number" ? card.cost : null,
    power: typeof card.power === "number" ? card.power : null,
    ram: typeof card.ram === "number" ? card.ram : null,
    eddies: Boolean(card.is_eddiable),
    rarity: card.rarity || "Unknown",
    set: card.set || printing?.set || { code: "unknown", name: "Unknown" },
    artist: card.artist || printing?.artist || "",
    printNumber: card.print_number || printing?.collector_number || "",
    legalities: card.legalities || {},
    legality: card.legality || "unknown",
    image: `/cards/${slug}.webp`,
    imageSource,
    printingCount: card.printings?.length || 1,
    printings: printings.length > 0 ? printings : undefined,
    prices: card.prices || card.market_prices || undefined,
  };
}

async function downloadImage(card) {
  if (!card.imageSource) return false;
  const target = path.join(IMAGE_DIR, `${card.slug}.webp`);
  if (!process.argv.includes("--force")) {
    try {
      await access(target);
      return true;
    } catch {
      // Image is missing, fetch it below.
    }
  }
  try {
    const res = await fetch(card.imageSource);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await sharp(buffer)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toFile(target);
    return true;
  } catch (error) {
    console.warn(`Image failed for ${card.slug}: ${error.message}`);
    return false;
  }
}

async function run() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(IMAGE_DIR, { recursive: true });

  let raw;
  try {
    raw = JSON.parse(await readFile(CACHE_FILE, "utf8"));
    console.log(`Using cached raw data (${raw.length} cards). Delete ${CACHE_FILE} to refresh.`);
  } catch {
    raw = await fetchAllCards();
    await writeFile(CACHE_FILE, JSON.stringify(raw, null, 2));
    console.log(`Saved raw data for ${raw.length} cards.`);
  }

  const cards = raw.map(normalize).sort((a, b) => a.displayName.localeCompare(b.displayName));
  const withImages = cards.filter((card) => card.imageSource);

  let done = 0;
  const concurrency = 6;
  async function worker() {
    while (done < withImages.length) {
      const index = done++;
      const card = withImages[index];
      await downloadImage(card);
      if ((index + 1) % 25 === 0 || index + 1 === withImages.length) {
        console.log(`Images ${index + 1}/${withImages.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const output = cards.map(({ imageSource, ...card }) => {
    void imageSource;
    return card;
  });
  await writeFile(path.join(DATA_DIR, "cards.json"), JSON.stringify(output, null, 2));

  const sets = [...new Map(cards.map((c) => [c.set.code, c.set])).values()];
  const meta = {
    generatedAt: new Date().toISOString(),
    count: cards.length,
    sets: sets.sort((a, b) => a.name.localeCompare(b.name)),
    colors: [...new Set(cards.map((c) => c.color).filter(Boolean))].sort(),
    types: [...new Set(cards.map((c) => c.type))].sort(),
    rarities: [...new Set(cards.map((c) => c.rarity))].sort(),
    classifications: [...new Set(cards.flatMap((c) => c.classifications))].sort(),
    keywords: [...new Set(cards.flatMap((c) => c.keywords))].sort(),
  };
  await writeFile(path.join(DATA_DIR, "card-meta.json"), JSON.stringify(meta, null, 2));
  console.log(`Wrote ${cards.length} cards and metadata.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
