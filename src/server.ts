import { renderToString } from 'vue/server-renderer';
import { createApp } from './main';

export async function render(): Promise<{ body: string }> {
  const app = createApp();
  const body = await renderToString(app);
  return { body };
}
