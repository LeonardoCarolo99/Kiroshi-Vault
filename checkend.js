const fs = require('fs');
if (fs.existsSync('build.out')) {
  const s = fs.readFileSync('build.out','utf8');
  const lines = s.split('\n');
  for (let i = Math.max(0, lines.length-25); i < lines.length; i++) {
    console.log(lines[i]);
  }
}
