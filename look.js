const fs = require('fs');
const s = fs.readFileSync('src/components/settings/SettingsView.tsx','utf8');
const lines = s.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Copy')) {
    console.log((i+1)+': '+lines[i]);
    if (i+1 < lines.length) console.log((i+2)+': '+lines[i+1]);
    if (i+2 < lines.length) console.log((i+3)+': '+lines[i+2]);
    console.log('---');
  }
}
