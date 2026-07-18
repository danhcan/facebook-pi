const { spawn } = require('child_process');
const path = require('path');

const child = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'src/index.ts'], {
  cwd: 'D:\\AI\\vietnamese-demo',
  detached: true,
  stdio: 'ignore'
});
child.unref();
console.log('Server PID:', child.pid);
