import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, createAgent } from "langchain"
import { createChatModel } from './chatAgent';
import { getContextTool, getSectionTool, applyAIPatchTool } from './tools/contextTools';

export type AgentState = {
  messages: BaseMessage[];
};

export async function createMainAgent() {
  const llm = createChatModel();
  const tools = [getContextTool, getSectionTool, applyAIPatchTool];

  const agent = await createAgent({ model : llm, tools });

  return agent
}
