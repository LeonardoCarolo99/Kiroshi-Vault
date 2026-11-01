import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");

async function run() {
  const cardsPath = path.join(DATA_DIR, "cards.json");
  const raw = JSON.parse(await readFile(cardsPath, "utf8"));
  await writeFile(cardsPath, JSON.stringify(raw, null, 2));
  console.log( + '' + Processed  cards + '' + );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});