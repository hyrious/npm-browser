import { untar } from './untar';

fetch('https://registry.npmmirror.com/vite/-/vite-6.2.4.tgz')
  .then(r => r.bytes())
  .then(untar)
  .then(console.log);
