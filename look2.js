const fs = require('fs');
const s = fs.readFileSync('src/components/decks/DeckBuilder.tsx','utf8');
const i = s.indexOf('COLOR_HEX');
if (i >= 0) {
  console.log(s.substring(i-40, i+120));
}
