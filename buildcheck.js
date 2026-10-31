setTimeout(()=>{}, 60000);
const fs = require('fs');
setTimeout(()=>{
  if(fs.existsSync('build.out')){
    const s = fs.readFileSync('build.out','utf8');
    const m = s.match(/error/gi);
    console.log(m?m.length:0);
    if(s.includes('Failed to compile') || s.includes('Build error')){
      console.log('FAILED');
    } else if(s.includes('Compiled successfully') || s.includes('✓')){
      console.log('OK');
    } else {
      console.log('UNKNOWN');
    }
  }
}, 65000);
