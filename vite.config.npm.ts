import { mergeConfig } from 'vite';
import SSR from './scripts/vite-plugin-ssr';
import config from './vite.config';

export default mergeConfig(config, {
  define: {
    'import.meta.env.NPM': 'true',
  },
  plugins: [SSR()],
});
