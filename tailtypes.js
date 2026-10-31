const fs = require('fs');
const s = fs.readFileSync('src/lib/types.ts','utf8');
const arr = s.split('\n');
for (let i = Math.max(0,arr.length-70); i < arr.length; i++) {
  console.log((i+1)+': '+arr[i]);
}
