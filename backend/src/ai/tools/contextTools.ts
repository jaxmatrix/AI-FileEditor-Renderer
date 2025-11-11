import { z } from 'zod';
import { tool, ToolRuntime } from '@langchain/core/tools';
import { ContextManager } from '../../managers/ContextManager';
import { AgentRuntime, AgentStateType, ContextType } from '../chatAgent';

const contextManager = ContextManager.getInstance();

export const getContextTool = tool(
  async ( _, config : ToolRuntime<AgentStateType, ContextType>) => {
    const { file_id, user_id } = config.context;

    console.log("getContextTool", config);

    try {
      const summary = await contextManager.getContext(file_id, user_id);
      return JSON.stringify(summary);
    } catch (error: any) {
      return `Error getting context: ${error.message}`;
    }
  },
  {
    name: 'getContext',
    description: 'Get a summary of a file, including all headers and the first two lines of each section.',
  }
);

export const getSectionTool = tool(
  async (input, config : ToolRuntime<AgentStateType, ContextType>) => {
    const { sectionHeader } = input;
    const { file_id, user_id } = config.context;
    try {
      const content = await contextManager.getSection(file_id, user_id, sectionHeader);
      return content ?? 'Section not found.';
    } catch (error: any) {
      return `Error getting section: ${error.message}`;
    }
  },
  {
    name: 'getSection',
    description: 'Get the full content of a specific section of a file.',
    schema: z.object({
      sectionHeader: z.string().describe('The header of the section to get.'),
    }),
  }
);

export const applyAIPatchTool = tool(
  async (input, config : ToolRuntime<AgentStateType, ContextType>) => {
    const { patch } = input;
    const { file_id, user_id} = config.context;
    try {
      await contextManager.applyAIPatch(file_id, user_id, patch);
      return 'Patch applied successfully.';
    } catch (error: any) {
      return `Error applying patch: ${error.message}`;
    }
  },
  {
    name: 'applyAIPatch',
    description: 'Apply a patch to a file to update its content.',
    schema: z.object({
      patch: z.string().describe('The patch to apply to the file.'),
    }),
  }
);