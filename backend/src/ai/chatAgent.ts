import { type Runtime, MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getPrompt, loadCachedPrompt } from './prompt/loader';
import { BaseMessage, createAgent } from 'langchain';
import { promptConfig } from './prompt/prompt.config';
import { applyAIPatchTool, getContextTool, getSectionTool } from './tools/contextTools';

loadCachedPrompt(promptConfig)

export type ChatState = {
  messages : BaseMessage[],
  chatId : string,
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
  const modelId = env.data.OPENROUTER_CHAT_MODEL ?? 'google/gemini-2.5-pro';

  const llm = new ChatOpenAI({
    apiKey: env.data.OPENROUTER_API_KEY,
    model: modelId,
    configuration: { baseURL },
  });

  return llm;
}

const checkpointer = new MemorySaver()

const editingAgent = createAgent({
  model : createChatModel(),
  tools : [getContextTool, getSectionTool, applyAIPatchTool],
  systemPrompt : getPrompt("system"),
  checkpointer
})

function extractAgentContent(result: any): string {
  const messages = (result as any)?.messages ?? [];
  if (Array.isArray(messages) && messages.length > 0) {
    const last = messages[messages.length - 1];
    const content = (last as any)?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((chunk: any) => {
          if (typeof chunk === 'string') return chunk;
          if (chunk && typeof chunk === 'object' && 'text' in chunk) return chunk.text ?? '';
          return '';
        })
        .join('');
    }
    if (content && typeof content === 'object' && 'text' in content) {
      return (content as any).text ?? '';
    }
  }

  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }
  return String(result ?? '');
}

// This is used with the tool to provide the access to the user_id when running the tool
export type AgentRuntime = Runtime<{
  user_id : string,
  file_id : string
}>

export type ContextType = {
  user_id : string,
  file_id : string
}

export type AgentStateType = {
  messages : BaseMessage[]
}

export async function runChat(input: string, user_id: string, file_id: string) {
  const result = await editingAgent.invoke(
    { messages: [{ role: "user", content: input }] },
    {
      configurable: { thread_id: user_id }, // Here we are using the thread_id as user_id to ensure that we are referring a single thread for each user
      context: { user_id: user_id, file_id: file_id }, // Here we are passing the user_id within the context of the agent for other actions that we might want
    }
  )

  return {
    raw: result,
    content: extractAgentContent(result),
  };
}