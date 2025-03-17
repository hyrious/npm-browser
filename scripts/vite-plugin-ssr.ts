import { createServer, Plugin, ViteDevServer } from 'vite';

const SSR = (): Plugin => {
  let vite: ViteDevServer | undefined;

  return ({
    name: 'vite-plugin-ssr',
    async transformIndexHtml(html) {
      vite ||= await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        base: '',
        logLevel: 'error',
      });
      const mod = await vite.ssrLoadModule('/src/server.ts', { fixStacktrace: true }) as typeof import('../src/server');
      const rendered = await mod.render();
      return html.replace('<div id="app"></div>', `<div id="app">${rendered.body}</div>`);
    },
    writeBundle() {
      setTimeout(() => vite?.close(), 100);
    },
  });
};

export default SSR;
