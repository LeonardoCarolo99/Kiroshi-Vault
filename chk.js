const fs = require('fs');
const s = fs.readFileSync('buildout2.txt','utf8');
if (s.includes('Compiled successfully')) {
  console.log('OK');
} else if (s.includes('Failed to compile')) {
  console.log('FAIL');
  const lines = s.split('\n');
  for (let i = Math.max(0, lines.length-80); i < lines.length; i++) {
    if (lines[i].includes('Error') || lines[i].includes('error')) console.log(lines[i]);
  }
} else {
  console.log('RUN');
}
