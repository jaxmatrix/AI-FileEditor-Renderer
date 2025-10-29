import { StateGraph, END, START } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

export type ChatState = {
  input: string;
  response?: string;
};

const Env = z
  .object({
    OPENROUTER_API_KEY: z.string().min(1, 'Missing OPENROUTER_API_KEY'),
    OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1').optional(),
    OPENROUTER_CHAT_MODEL: z.string().default('google/gemini-2.0-flash-exp:free').optional(),
  })
  .passthrough();

export function createChatModel() {
  const env = Env.safeParse(process.env);
  if (!env.success) {
    throw new Error(env.error.flatten().formErrors.join('\n'));
  }
  const baseURL = env.data.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
  const modelId = env.data.OPENROUTER_CHAT_MODEL ?? 'google/gemini-2.0-flash-exp:free';

  const llm = new ChatOpenAI({
    apiKey: env.data.OPENROUTER_API_KEY,
    model: modelId,
    configuration: { baseURL },
  });
  return llm;
}

async function chatNode(state: ChatState): Promise<ChatState> {
  const llm = createChatModel();

  const systemPrompt = `You are a helpful AI assistant. Always respond in a concise manner, using only 5-10 lines maximum. Be direct, helpful, and to the point. Never exceed this limit.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input },
  ] as const;

  const res = await llm.invoke(messages as any);
  return { ...state, response: res?.content?.toString?.() ?? String(res) };
}

export function createChatGraph() {
  const graph = new StateGraph<ChatState>({ channels: { input: null, response: null } });
  graph.addNode('chat', chatNode);
  graph.addEdge(START as any, 'chat' as any);
  graph.addEdge('chat' as any, END as any);
  return graph.compile({} as any);
}

export async function runChat(input: string) {
  const app = createChatGraph();
  const result = await app.invoke({ input });
  return result.response ?? '';
}