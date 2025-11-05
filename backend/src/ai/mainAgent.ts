import { ChatOpenAI } from '@langchain/openai';
const { AgentExecutor, createOpenAIToolsAgent } = require('langchain/agents');
const { TavilySearchResults } = require('@langchain/community/tools/tavily_search');
const { pull } = require('langchain/hub');
import { getContextTool, getSectionTool, applyAIPatchTool } from './tools/contextTools';

export async function createMainAgent() {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
    configuration: { baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1' },
  });

  const tools = [new TavilySearchResults({ maxResults: 1 }), getContextTool, getSectionTool, applyAIPatchTool];

  const prompt = await pull('hwchase17/openai-functions-agent');

  const agent = await createOpenAIToolsAgent({ llm, tools, prompt });

  const agentExecutor = new AgentExecutor({ agent, tools });

  return agentExecutor;
}