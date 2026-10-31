const fs = require('fs');
const txt = fs.readFileSync('src/components/decks/DeckList.tsx');
const lines = txt.toString().split('\n');
for (let i = 320; i < 520 && i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
