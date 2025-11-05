import { StateGraph, END, START } from '@langchain/langgraph';
import { createMainAgent } from './mainAgent';

export async function runPipeline(input: string) {
  const agent = await createMainAgent();
  const result = await agent.invoke({ input });
  return result.output ?? '';
}
