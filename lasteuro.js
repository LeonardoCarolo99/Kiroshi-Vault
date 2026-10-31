const fs = require('fs');
const s = fs.readFileSync('src/components/decks/DeckList.tsx','utf8');
const idx = s.lastIndexOf('Euro');
if (idx >= 0) {
  console.log(s.slice(idx-200, idx+200));
} else {
  console.log('none');
}
