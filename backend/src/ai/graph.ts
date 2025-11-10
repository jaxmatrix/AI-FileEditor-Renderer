import { createMainAgent } from './mainAgent';

export async function runPipeline(input: string) {
  const app = await createMainAgent();
  const result = await app.invoke({ messages: [{ role: 'user', content: input }] });
  const messages = (result as any).messages ?? [];
  const last = messages[messages.length - 1];
  const content = last?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((c: any) => (typeof c === 'string' ? c : c.text ?? '')).join('');
  return String(content ?? '');
}
