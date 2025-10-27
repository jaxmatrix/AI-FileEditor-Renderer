import { StateGraph, END, START } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getPrompt } from './prompt/loader';

export type GraphState = {
  input: string;
  response?: string;
};

const Env = z
  .object({
    OPENROUTER_API_KEY: z.string().min(1, 'Missing OPENROUTER_API_KEY'),
    OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1').optional(),
    OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini').optional(),
  })
  .passthrough();

export function createModel() {
  const env = Env.safeParse(process.env);
  if (!env.success) {
    throw new Error(env.error.flatten().formErrors.join('\n'));
  }
  const baseURL = env.data.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
  const modelId = env.data.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';

  const llm = new ChatOpenAI({
    apiKey: env.data.OPENROUTER_API_KEY,
    model: modelId,
    configuration: { baseURL },
  });
  return llm;
}

async function generateNode(state: GraphState): Promise<GraphState> {
  const llm = createModel();
  const system = getPrompt('system');
  const writer = getPrompt('writer');

  const messages = [
    { role: 'system', content: system },
    { role: 'system', content: writer },
    { role: 'user', content: state.input },
  ] as const;

  const res = await llm.invoke(messages as any);
  return { ...state, response: res?.content?.toString?.() ?? String(res) };
}

export function createAiGraph() {
  const graph = new StateGraph<GraphState>({ channels: { input: null, response: null } });
  graph.addNode('generate', generateNode);
  graph.addEdge(START as any, 'generate' as any);
  graph.addEdge('generate' as any, END as any);
  return graph.compile({} as any);
}

export async function runPipeline(input: string) {
  const app = createAiGraph();
  const result = await app.invoke({ input });
  return result.response ?? '';
}
