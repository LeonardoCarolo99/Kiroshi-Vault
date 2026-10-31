const fs = require('fs');
const start = Date.now();
function check() {
  if (fs.existsSync('build.out')) {
    const s = fs.readFileSync('build.out','utf8');
    if (s.includes('Compiled successfully')) {
      console.log('DONE_OK');
      process.exit(0);
    }
    if (s.includes('Failed to compile')) {
      console.log('DONE_FAIL');
      const lines = s.split('\n');
      for (let i = Math.max(0, lines.length-50); i < lines.length; i++) {
        if (lines[i].trim()) console.log(lines[i]);
      }
      process.exit(1);
    }
  }
  if (Date.now() - start > 420000) {
    console.log('TIMEOUT');
    process.exit(2);
  }
  setTimeout(check, 15000);
}
check();
setTimeout(()=>process.exit(0), 425000);
