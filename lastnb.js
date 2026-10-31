const fs = require('fs');
if (fs.existsSync('nextbuild.out')) {
  const s = fs.readFileSync('nextbuild.out','utf8');
  const lines = s.split('\n');
  for (let i = Math.max(0, lines.length-80); i < lines.length; i++) {
    if (lines[i]) console.log(lines[i]);
  }
}
