const fs = require('fs');
const start = Date.now();
function check(){
  if(fs.existsSync('build.out')){
    const s = fs.readFileSync('build.out','utf8');
    if(s.includes('Compiled successfully')){
      console.log('BUILD_OK');
      const lines = s.split('\n');
      for(let i=Math.max(0,lines.length-15);i<lines.length;i++) if(lines[i].trim()) console.log(lines[i]);
      process.exit(0);
    }
    if(s.includes('Failed to compile') || s.includes('Build error')){
      console.log('BUILD_FAIL');
      const lines = s.split('\n');
      for(let i=Math.max(0,lines.length-40);i<lines.length;i++) if(lines[i].trim()) console.log(lines[i]);
      process.exit(1);
    }
  }
  if(Date.now()-start > 300000){ console.log('TIMEOUT'); process.exit(2); }
  setTimeout(check, 10000);
}
check();
setTimeout(()=>process.exit(0), 310000);
