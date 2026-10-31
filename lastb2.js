const fs = require('fs');
const s = fs.readFileSync('buildout2.txt','utf8');
const lines = s.split('\n');
for (let i = Math.max(0, lines.length-60); i < lines.length; i++) {
  if (lines[i]) console.log(lines[i]);
}
