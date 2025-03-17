import Vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  define: {
    'import.meta.env.NPM': 'false',
  },
  plugins: [
    Vue(),
    UnoCSS(),
  ],
  build: {
    modulePreload: false,
    sourcemap: true,
  },
});
