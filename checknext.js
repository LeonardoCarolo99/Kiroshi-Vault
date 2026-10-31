const fs = require('fs');
if (fs.existsSync('nextbuild.out')) {
  const s = fs.readFileSync('nextbuild.out','utf8');
  if (s.includes('Compiled successfully')) {
    console.log('OK');
    const lines = s.split('\n');
    for (let i = Math.max(0, lines.length-20); i < lines.length; i++) {
      if (lines[i].trim()) console.log(lines[i]);
    }
    process.exit(0);
  }
  if (s.includes('Failed to compile')) {
    console.log('FAIL');
    const lines = s.split('\n');
    for (let i = Math.max(0, lines.length-40); i < lines.length; i++) {
      if (lines[i].trim()) console.log(lines[i]);
    }
    process.exit(1);
  }
}
console.log('RUN');
process.exit(0);
