const fs = require('fs');
setTimeout(()=>{
  if (fs.existsSync('nextbuild.out')) {
    const s = fs.readFileSync('nextbuild.out','utf8');
    if (s.includes('Compiled successfully')) {
      console.log('OK');
      const lines = s.split('\n');
      for (let i = Math.max(0,lines.length-15); i < lines.length; i++) if (lines[i].trim()) console.log(lines[i]);
    } else if (s.includes('Failed to compile')) {
      console.log('FAIL');
      const lines = s.split('\n');
      for (let i = Math.max(0,lines.length-60); i < lines.length; i++) if (lines[i].trim()) console.log(lines[i]);
    } else {
      console.log('RUN');
    }
  }
  process.exit(0);
}, 180000);
