const fs = require('fs');
const s = fs.readFileSync('src/lib/types.ts','utf8');
console.log(s.includes('VaultSnapshot'));
console.log(s.includes('export interface Deck'));
console.log(s.includes('export type Deck'));
