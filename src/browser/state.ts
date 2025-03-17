import { reactive, watchEffect } from 'vue';
import { parseQuery } from '../common/q';
import { isClient } from './is';

const loc = typeof location !== 'undefined' ? location : { href: 'http://localhost', hash: '' };
const searchParams = new URL(loc.href).searchParams;

export interface ApplicationState {
  name: string;
  spec: string;
  path: string;
  startLine: number;
  endLine: number;
}

export const $state = reactive<ApplicationState>({ name: '', spec: '', path: '', startLine: 0, endLine: 0 });

const query = parseQuery(searchParams.get('q') || loc.hash.slice(1));
if (query) { Object.assign($state, query); }

if (isClient) {
  watchEffect(() => {
    const { name, spec, path, startLine, endLine } = $state;

    let q = name;
    if (q) {
      if (spec) { q += `@${spec}`; }
      if (path) {
        q += path;
        if (startLine) {
          q += `:${startLine}`;
          if (endLine > 0 && endLine !== startLine) { q += `-${endLine}`; }
        }
      }
      if (searchParams.get('q') !== q) {
        searchParams.set('q', q);
        // decode here to preserve '@', '/' symbols, hopefully it should not cause any issues
        const url = '?' + decodeURIComponent(searchParams.toString());
        history.replaceState({ name, spec, path, startLine, endLine }, '', url);
      }
    }

    if (name && spec && path) {
      document.title = `${path.replace(/^\//, '')}} · ${name}@${spec}`;
    } else if (name) {
      document.title = spec ? `${name}@${spec}` : name;
    } else {
      document.title = 'NPM Browser';
    }
  });
}
