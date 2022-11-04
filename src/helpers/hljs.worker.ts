/// <reference lib="webworker" />

export {};
import { htmlEscape } from "escape-goat"
import hljs from "@highlightjs/cdn-assets/es/highlight.js";
import powershell from "@highlightjs/cdn-assets/es/languages/powershell.min.js";

hljs.registerLanguage("powershell", powershell);

// https://github.com/AlexxNB/highlightjs-svelte/blob/master/src/svelte.js
hljs.registerLanguage("svelte", (hljs) => ({
  subLanguage: "xml",
  contains: [
    hljs.COMMENT("<!--", "-->", {
      relevance: 10,
    }),
    {
      begin: /^(\s*)(<script((\s*lang=".*")|(\s*context="module"))?>)/gm,
      end: /^(\s*)(<\/script>)/gm,
      subLanguage: "javascript",
      excludeBegin: true,
      excludeEnd: true,
      contains: [
        {
          begin: /^(\s*)(\$:)/gm,
          end: /(\s*)/gm,
          className: "keyword",
        },
      ],
    },
    {
      begin: /^(\s*)(<style.*>)/gm,
      end: /^(\s*)(<\/style>)/gm,
      subLanguage: "css",
      excludeBegin: true,
      excludeEnd: true,
    },
    {
      begin: /\{/gm,
      end: /\}/gm,
      subLanguage: "javascript",
      contains: [
        {
          begin: /[\{]/,
          end: /[\}]/,
          skip: true,
        },
        {
          begin: /([#:\/@])(if|else|each|const|await|then|catch|debug|html)/gm,
          className: "keyword",
          relevance: 10,
        },
      ],
    },
  ],
}));

// https://github.com/highlightjs/highlightjs-vue/blob/master/vue.js
hljs.registerLanguage("vue", (hljs) => ({
  subLanguage: "xml",
  contains: [
    hljs.COMMENT("<!--", "-->", {
      relevance: 10,
    }),
    {
      begin: /^(\s*)(<script>)/gm,
      end: /^(\s*)(<\/script>)/gm,
      subLanguage: "javascript",
      excludeBegin: true,
      excludeEnd: true,
    },
    {
      begin: /^(?:\s*)(?:<script\s+lang=(["'])ts\1>)/gm,
      end: /^(\s*)(<\/script>)/gm,
      subLanguage: "typescript",
      excludeBegin: true,
      excludeEnd: true,
    },
    {
      begin: /^(\s*)(<style(\s+scoped)?>)/gm,
      end: /^(\s*)(<\/style>)/gm,
      subLanguage: "css",
      excludeBegin: true,
      excludeEnd: true,
    },
    {
      begin: /^(?:\s*)(?:<style(?:\s+scoped)?\s+lang=(["'])(?:s[ca]ss)\1(?:\s+scoped)?>)/gm,
      end: /^(\s*)(<\/style>)/gm,
      subLanguage: "scss",
      excludeBegin: true,
      excludeEnd: true,
    },
    {
      begin: /^(?:\s*)(?:<style(?:\s+scoped)?\s+lang=(["'])stylus\1(?:\s+scoped)?>)/gm,
      end: /^(\s*)(<\/style>)/gm,
      subLanguage: "stylus",
      excludeBegin: true,
      excludeEnd: true,
    },
  ],
}));

addEventListener("message", ({ data }: MessageEvent<{ id: number; code: string; lang?: string }>) => {
  const { id, code, lang } = data;
  try {
    const { value } = hljs.highlight(code, { language: lang || "js", ignoreIllegals: true });
    postMessage({ id, value });
  } catch (error) {
    console.error(error);
    postMessage({ id, value: htmlEscape(code) });
  }
});
