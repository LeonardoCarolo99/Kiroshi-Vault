const { execSync } = require('child_process');
try {
  execSync('npx --no-install tsc --noEmit', { cwd: 'C:\\Github\\CyberpunkTCG', stdio: 'inherit' });
  console.log('DONE_OK');
} catch (e) {
  console.log('DONE_ERR');
}
