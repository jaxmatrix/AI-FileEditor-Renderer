const { exec } = require('child_process');

function run(command, name) {
  console.log(`[${name}] Starting...`);
  const process = exec(command);

  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`[${name}] ERROR: ${data}`);
  });

  process.on('close', (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });

  return process;
}

console.log('Starting development servers...');
run('npm run dev --workspace=backend', 'BACKEND');
run('npm run dev --workspace=frontend', 'FRONTEND');
console.log('Backend expected on http://localhost:3001');
console.log('Frontend expected on http://localhost:3000');
