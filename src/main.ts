import './bus';

import { createApp, createSSRApp } from 'vue';
import App from './App.vue';

function main() {
  return import.meta.env.SSR ? createSSRApp(App) : createApp(App);
}

export { main as createApp };
