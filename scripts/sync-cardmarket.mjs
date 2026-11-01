import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const CARDS_PATH = path.join(DATA_DIR, "cards.json");

function getCardmarketUrl(card) {
  const base = "https://www.cardmarket.com/en/Cyberpunk/Products/Singles";
  const setName = (card.set?.name || "")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "-");
  const setPath = encodeURIComponent(setName);

  if (card.slug) {
    return `${base}/${setPath}/${card.slug}`;
  }

  const cardName = card.subname ? `${card.name} ${card.subname}` : card.name;
  let cardPath = cardName
    .replace(/'/g, "-")
    .replace(/:/g, "-")
    .replace(/,/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  cardPath = encodeURIComponent(cardPath);
  return `${base}/${setPath}/${cardPath}`;
}

async function run() {
  const raw = JSON.parse(await readFile(CARDS_PATH, "utf8"));
  let updated = 0;

  for (let i = 0; i < raw.length; i++) {
    const card = raw[i];
    if (!card.cardmarketUrl) {
      card.cardmarketUrl = getCardmarketUrl(card);
      updated++;
    }
  }

  await writeFile(CARDS_PATH, JSON.stringify(raw, null, 2) + "\n");
  console.log(`Updated ${updated} cards with cardmarketUrl`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
