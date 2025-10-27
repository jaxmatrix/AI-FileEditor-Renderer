export type PromptKey = 'system' | 'writer';

export type PromptConfig = Record<PromptKey, string>;

export const promptConfig: PromptConfig = {
  system: 'system.md',
  writer: 'writer.md',
};
