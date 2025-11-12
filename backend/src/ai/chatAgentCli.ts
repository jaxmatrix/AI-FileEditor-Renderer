import 'dotenv/config';
import mongoose from 'mongoose';
import readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import { runChat } from './chatAgent';
import { Context } from '../models/Context';
import { ContextManager } from '../managers/ContextManager';

const DEFAULT_USER_ID = 'test_user_id';
const DEFAULT_FILE_ID = 'test_user_file_1';

const SEED_DOCUMENT = `# Test Document

This file is used to validate the CLI-driven agent workflow.

## Getting Started

- Ask the agent for a summary of this document.
- Request modifications to verify patch application.

## Checklist

- [ ] Replace this list with updated steps during tests.
`;

type CliOptions = {
  userId: string;
  fileId: string;
};

function parseOptions(): { options: CliOptions; helpRequested: boolean } {
  const args = process.argv.slice(2);
  let userId = DEFAULT_USER_ID;
  let fileId = DEFAULT_FILE_ID;
  let helpRequested = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      helpRequested = true;
      break;
    }
    if ((arg === '--user' || arg === '-u') && i + 1 < args.length) {
      userId = args[i + 1];
      i += 1;
      continue;
    }
    if ((arg === '--file' || arg === '-f') && i + 1 < args.length) {
      fileId = args[i + 1];
      i += 1;
      continue;
    }
    console.warn(`[agent-cli] Ignoring unknown argument "${arg}". Use --help to see valid options.`);
  }

  return { options: { userId, fileId }, helpRequested };
}

function printHelp(): void {
  console.log(`Usage: npx ts-node src/ai/chatAgentCli.ts [options]

Options:
  -u, --user <id>   Override the user identifier (default: ${DEFAULT_USER_ID})
  -f, --file <id>   Override the file identifier (default: ${DEFAULT_FILE_ID})
  -h, --help        Show this help message

Commands:
  exit | quit       Terminate the session
`);
}

async function ensureMongoConnection(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }

  const username = process.env.MONGO_USERNAME || 'root';
  const password = process.env.MONGO_PASSWORD || 'example';
  const host = process.env.MONGO_HOST || '127.0.0.1';
  const port = process.env.MONGO_PORT || '27017';
  const authSource = process.env.MONGO_AUTH_SOURCE || 'admin';

  const uri = process.env.MONGO_URI ?? `mongodb://${username}:${password}@${host}:${port}/`;

  try {
    await mongoose.connect(uri, {
      authSource,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[agent-cli] Connected to MongoDB at ${host}:${port}`);
  } catch (error: any) {
    const reason = error?.message ?? error;
    console.error(`[agent-cli] Failed to connect to MongoDB: ${reason}`);
    throw error;
  }
}

async function ensureSeedContext(options: CliOptions): Promise<void> {
  const { userId, fileId } = options;
  const contextManager = ContextManager.getInstance();

  const existing = await Context.findOne({ userId, fileId });
  if (existing) {
    return;
  }

  await contextManager.createContext(fileId, userId, SEED_DOCUMENT);
  console.log(`[agent-cli] Created seed context for user="${userId}" file="${fileId}"`);
}

function formatAssistantOutput(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines.length === 0) {
    return 'agent> ';
  }
  return lines
    .map((line, index) => (index === 0 ? `agent> ${line}` : `       ${line}`))
    .join('\n');
}

async function interactiveChat(options: CliOptions): Promise<void> {
  const rl = readline.createInterface({
    input,
    output,
    historySize: 100,
    terminal: true,
    crlfDelay: Infinity,
  });

  rl.setPrompt('you> ');
  console.log(`[agent-cli] Interactive session started. Type "exit" or "quit" to terminate.`);
  rl.prompt();

  let sigintWarningShown = false;

  const handleSigint = () => {
    if (sigintWarningShown) {
      console.log('\n[agent-cli] Forcing shutdown.');
      rl.close();
      return;
    }
    sigintWarningShown = true;
    console.log('\n[agent-cli] Press Ctrl+C again to force quit or type "exit".');
    rl.prompt();
  };

  rl.on('SIGINT', handleSigint);

  const debugAgent = process.env.DEBUG_AGENT === 'true';

  for await (const line of rl) {
    const message = line.trim();
    sigintWarningShown = false;

    if (!message) {
      rl.prompt();
      continue;
    }

    if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
      break;
    }

    try {
      const response = await runChat(message, options.userId, options.fileId);
      if (debugAgent) {
        console.dir(response.raw, { depth: 4 });
      }
      const content = response.content ?? '';
      if (content.trim().length === 0) {
        console.log('agent> [empty response]');
      } else {
        console.log(formatAssistantOutput(content));
      }
    } catch (error: any) {
      const reason = error?.message ?? error;
      console.error(`[agent-cli] Error invoking agent: ${reason}`);
      if (debugAgent) {
        console.error(error);
      }
    }

    rl.prompt();
  }

  rl.removeListener('SIGINT', handleSigint);
  rl.close();

  console.log('[agent-cli] Session ended.');
}

export async function main(): Promise<void> {
  const { options, helpRequested } = parseOptions();

  if (helpRequested) {
    printHelp();
    return;
  }

  await ensureMongoConnection();
  await ensureSeedContext(options);

  console.log(`[agent-cli] Using user="${options.userId}" file="${options.fileId}"`);
  try {
    await interactiveChat(options);
  } finally {
    await mongoose.disconnect().catch(() => undefined);
    console.log('[agent-cli] MongoDB connection closed.');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[agent-cli] Fatal error encountered:', error);
    mongoose.disconnect()
      .catch(() => undefined)
      .finally(() => process.exit(1));
  });
}