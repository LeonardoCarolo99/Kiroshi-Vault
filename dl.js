const fs = require('fs');
const lines = fs.readFileSync('src/components/decks/DeckList.tsx').toString().split('\n');
for (let i = 280; i < lines.length; i++) {
  console.log(lines[i]);
}
