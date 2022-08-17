import { parse } from "./query";

console.log([
  parse("vue"),
  parse("vue@3"),
  parse("@vue/reactivity"),
  parse("@vue/reactivity@3"),
  parse("vue/path.js"),
  parse("vue/path.js:1"),
  parse("vue@3/path.js:1"),
  parse("@vue/reactivity@3/path.js"),
  parse("@vue/reactivity@3/path.js:1"),
]);
