const fs = require('fs');
if (fs.existsSync('rb.out')) {
  const s = fs.readFileSync('rb.out','utf8');
  const lines = s.split('\n');
  for (let i = Math.max(0, lines.length-30); i < lines.length; i++) {
    console.log(lines[i]);
  }
} else {
  console.log('no');
}
setTimeout(()=>process.exit(0), 5000);
