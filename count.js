const fs = require('fs');
const s = fs.readFileSync('src/components/decks/DeckBuilder.tsx','utf8');
const m = s.match(/getCard/g);
console.log(m ? m.length : 0);
