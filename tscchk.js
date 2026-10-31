const fs = require('fs');
const s = fs.readFileSync('tsc.out','utf8');
if (s.includes('error TS')) {
  console.log('ERR');
  const lines = s.split('\n');
  for (let i = 0; i < Math.min(80, lines.length); i++) {
    if (lines[i].includes('error TS')) console.log(lines[i]);
  }
} else {
  console.log('OK');
}
