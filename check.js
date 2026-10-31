const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('src/data/cards.raw.json'));
console.log(Object.keys(raw[0]));
console.log(raw[0].printings ? 'has printings' : 'no');
console.log(raw[0].printings?.length);
