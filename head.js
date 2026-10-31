const fs = require('fs');
const s = fs.readFileSync('src/components/settings/SettingsView.tsx','utf8');
const arr = s.split('\n');
for (let i=0; i<40; i++) {
  if (arr[i] !== undefined) console.log((i+1)+': '+arr[i]);
}
