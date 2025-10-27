import fs from 'node:fs';
import path from 'node:path';
import { promptConfig, type PromptKey, type PromptConfig } from './prompt.config';

const CACHE = new Map<PromptKey, string>();

export function resolvePromptPath(file: string) {
  return path.resolve(__dirname, 'promptFiles', file);
}

export function loadCachedPrompt(config: PromptConfig = promptConfig) {
  CACHE.clear();
  for (const [key, file] of Object.entries(config) as [PromptKey, string][]) {
    const full = resolvePromptPath(file);
    const content = fs.readFileSync(full, 'utf8');
    CACHE.set(key, content);
  }
}

export function getPrompt(key: PromptKey): string {
  const value = CACHE.get(key);
  if (!value) {
    throw new Error(`Prompt not loaded for key: ${key}`);
  }
  return value;
}
