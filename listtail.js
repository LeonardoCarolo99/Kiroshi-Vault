const fs = require('fs');
const lines = fs.readFileSync('src/components/decks/DeckList.tsx').toString().split('\n');
for (let i = 400; i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
