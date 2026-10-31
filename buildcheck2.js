const fs = require('fs');
if (fs.existsSync('build.out')) {
  const s = fs.readFileSync('build.out','utf8');
  if (s.includes('Compiled successfully')) {
    console.log('SUCCESS');
  } else if (s.includes('Failed to compile')) {
    console.log('FAILED');
  } else {
    console.log('RUNNING');
  }
}
setTimeout(()=>{process.exit(0);}, 20000);
