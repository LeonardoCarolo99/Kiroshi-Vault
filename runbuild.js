const { spawn } = require('child_process');
const p = spawn('npm', ['run', 'build'], { cwd: 'C:\\Github\\CyberpunkTCG', shell: true, stdio: 'inherit' });
p.on('close', (code) => {
  console.log('EXIT:' + code);
});
