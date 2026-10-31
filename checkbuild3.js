const fs = require('fs');
setTimeout(()=>{
  if(fs.existsSync('build.out')){
    const s = fs.readFileSync('build.out','utf8');
    if(s.includes('Compiled successfully')) console.log('SUCCESS');
    else if(s.includes('Failed to compile')) console.log('FAILED');
    else console.log('STILL');
    // Also print last lines
    const lines = s.split('\n');
    console.log(lines.slice(-10).join('\n'));
  }
  process.exit(0);
}, 90000);
