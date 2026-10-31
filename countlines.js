const fs = require('fs');
const lines = fs.readFileSync('src/components/decks/DeckList.tsx').toString().split('\n');
console.log(lines.length);
