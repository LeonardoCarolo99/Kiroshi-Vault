const fs = require('fs');
const s = fs.readFileSync('src/lib/cards.ts','utf8');
const idx = s.indexOf('getCard');
if (idx >= 0) {
  console.log(s.substring(Math.max(0,idx-60), idx+200));
} else {
  console.log('not found');
}
