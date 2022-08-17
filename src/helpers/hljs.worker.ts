/// <reference lib="webworker" />

export {};
import hljs from "@highlightjs/cdn-assets/es/highlight.js";

addEventListener("message", ({ data }: MessageEvent<{ id: number; code: string; lang?: string }>) => {
  const { id, code, lang } = data;
  const { value } = hljs.highlight(code, { language: lang || "js" });
  postMessage({ id, value });
});
