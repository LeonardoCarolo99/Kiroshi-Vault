const fs = require('fs');
if (fs.existsSync('nextbuild.out')) {
  const s = fs.readFileSync('nextbuild.out','utf8');
  const lines = s.split('\n');
  for (let i = Math.max(0, lines.length-60); i < lines.length; i++) {
    console.log(lines[i]);
  }
}
