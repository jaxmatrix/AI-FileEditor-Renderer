import { StateGraph, END, START } from '@langchain/langgraph';
import { createToolCallingAgent } from '@langchain/langgraph/prebuilt';
import { createChatModel } from './chatAgent';
import { getContextTool, getSectionTool, applyAIPatchTool } from './tools/contextTools';

export type AgentState = {
  messages: BaseMessage[];
};

export async function createMainAgent() {
  const llm = createChatModel();
  const tools = [getContextTool, getSectionTool, applyAIPatchTool];

  const agent = await createToolCallingAgent({ llm, tools });

  const graph = new StateGraph<AgentState>({ channels: { messages: null } });
  graph.addNode('agent', agent as any);
  graph.addEdge(START as any, 'agent' as any);
  graph.addEdge('agent' as any, END as any);

  return graph.compile({} as any);
}
