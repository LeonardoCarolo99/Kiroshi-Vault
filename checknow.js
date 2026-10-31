const fs = require('fs');
const s = fs.readFileSync('build.out','utf8');
if (s.includes('Compiled successfully')) {
  process.stdout.write('OK\n');
} else if (s.includes('Failed to compile')) {
  process.stdout.write('FAIL\n');
} else {
  process.stdout.write('RUN\n');
}
