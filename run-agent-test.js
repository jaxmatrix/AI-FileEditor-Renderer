const { spawn } = require('child_process');
const path = require('path');
const { runMongo } = require('./run-mongo');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(prefix, message) {
  console.log(`[${prefix}] ${message}`);
}

async function buildCliCommand(extraArgs) {
  const override = process.env.AGENT_CLI_CMD?.trim();
  if (!override || override === 'npm') {
    return {
      command: 'npm',
      args: ['run', 'agent:cli', '--workspace=backend', '--', ...extraArgs],
    };
  }

  if (override === 'npx') {
    return {
      command: 'npx',
      args: [
        'ts-node',
        '--transpile-only',
        path.join('backend', 'src', 'ai', 'chatAgentCli.ts'),
        ...extraArgs,
      ],
    };
  }

  return {
    command: override,
    args: extraArgs,
  };
}

async function main() {
  log('AGENT-TEST', 'Ensuring MongoDB is running...');
  runMongo();

  const delayMs = Number(process.env.MONGO_BOOT_DELAY_MS ?? 5000);
  if (delayMs > 0) {
    log('AGENT-TEST', `Waiting ${delayMs}ms for MongoDB to become ready...`);
    await wait(delayMs);
  }

  const cliArgs = process.argv.slice(2);
  const { command, args } = await buildCliCommand(cliArgs);

  log('AGENT-TEST', `Launching CLI agent via "${command} ${args.join(' ')}"`);
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  });

  const handleShutdown = (signal) => {
    log('AGENT-TEST', `Received ${signal}. Forwarding to CLI process...`);
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  child.on('close', (code, signal) => {
    if (signal) {
      log('AGENT-TEST', `CLI terminated due to signal ${signal}`);
    } else {
      log('AGENT-TEST', `CLI exited with code ${code}`);
    }
    process.exit(code ?? (signal ? 1 : 0));
  });

  child.on('error', (error) => {
    console.error('[AGENT-TEST] Failed to launch CLI:', error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('[AGENT-TEST] Fatal error encountered:', error);
  process.exit(1);
});