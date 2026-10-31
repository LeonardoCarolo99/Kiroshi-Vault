const fs = require('fs');
const s = fs.readFileSync('build.out','utf8');
if (s.includes('Compiled successfully')) {
  console.log('DONE_OK');
} else if (s.includes('Failed to compile')) {
  console.log('DONE_FAIL');
} else {
  console.log('IN_PROGRESS');
}
const tail = s.split('\n').slice(-20).join('\n');
console.log(tail);
