import { parseQuery } from './q';

console.log([
  parseQuery('vue'),
  parseQuery('vue@3'),
  parseQuery('@vue/reactivity'),
  parseQuery('@vue/reactivity@3'),
  parseQuery('vue/path.js'),
  parseQuery('vue/path.js:1'),
  parseQuery('vue@3/path.js:1'),
  parseQuery('@vue/reactivity@3/path.js'),
  parseQuery('@vue/reactivity@3/path.js:1'),
  parseQuery('@vue/reactivity@3/path.js:1-1'),
]);
