import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ContextManager } from '../../managers/ContextManager';

const contextManager = ContextManager.getInstance();

export const getContextTool = tool(
  async ({ fileId, userId }: { fileId: string; userId: string }) => {
    try {
      const summary = await contextManager.getContext(fileId, userId);
      return JSON.stringify(summary);
    } catch (error: any) {
      return `Error getting context: ${error.message}`;
    }
  },
  {
    name: 'getContext',
    description: 'Get a summary of a file, including all headers and the first two lines of each section.',
    schema: z.object({
      fileId: z.string().describe('The ID of the file to get the context for.'),
      userId: z.string().describe('The ID of the user who owns the file.'),
    }),
  }
);

export const getSectionTool = tool(
  async ({ fileId, userId, sectionHeader }: { fileId: string; userId: string; sectionHeader: string }) => {
    try {
      const content = await contextManager.getSection(fileId, userId, sectionHeader);
      return content ?? 'Section not found.';
    } catch (error: any) {
      return `Error getting section: ${error.message}`;
    }
  },
  {
    name: 'getSection',
    description: 'Get the full content of a specific section of a file.',
    schema: z.object({
      fileId: z.string().describe('The ID of the file to get the section from.'),
      userId: z.string().describe('The ID of the user who owns the file.'),
      sectionHeader: z.string().describe('The header of the section to get.'),
    }),
  }
);

export const applyAIPatchTool = tool(
  async ({ fileId, userId, patch }: { fileId: string; userId: string; patch: string }) => {
    try {
      await contextManager.applyAIPatch(fileId, userId, patch);
      return 'Patch applied successfully.';
    } catch (error: any) {
      return `Error applying patch: ${error.message}`;
    }
  },
  {
    name: 'applyAIPatch',
    description: 'Apply a patch to a file to update its content.',
    schema: z.object({
      fileId: z.string().describe('The ID of the file to apply the patch to.'),
      userId: z.string().describe('The ID of the user who owns the file.'),
      patch: z.string().describe('The patch to apply to the file.'),
    }),
  }
);