<script setup lang="ts">
import { tick } from "@hyrious/utils";
import prettyBytes from "pretty-bytes";
import { wordwrap } from "../stores/code";
import { emitter, update } from "../helpers/hljs";
import { is_binary } from "../helpers/is-binary";
import { renderMarkdown } from "../helpers/marked";
import { repo } from "../stores/repo";
const app = useApplicationStore();

const codeBlock = ref();
const tipEl = ref();
const markdownEl = ref();

const decoder = new TextDecoder();
const failed = ref("");
const file = computed(() => files.value.find((e) => e.name === app.path.slice(1)));
const isMarkdown = computed(() => file.value?.name.endsWith(".md"));
const buffer = computed(() => file.value?.buffer);
const code = computed(() => {
  failed.value = "";
  if (buffer.value) {
    if (is_binary(buffer.value)) {
      failed.value = "Cannot open binary file.";
    } else {
      return decoder.decode(buffer.value);
    }
  }
});
const lang = computed(() => {
  const path = app.path;
  const i = path.lastIndexOf(".");
  if (i < 0) return "text";
  let ext = path.slice(i + 1);
  if (ext === "map") ext = "json";
  if (ext === "cjs" || ext === "mjs") ext = "js";
  if (ext === "cts" || ext === "mts") ext = "ts";
  return ext;
});
const showMarkdown = ref(true);

const gzipSizeFn = ref<(data: ArrayBuffer) => number>();
import("../helpers/gzip-size").then((mod) => {
  gzipSizeFn.value = mod.default;
});

const gzipSize = computed(() => {
  if (buffer.value && gzipSizeFn.value) {
    return gzipSizeFn.value(buffer.value);
  }
});

const HLJS_MAX_LINES = 8000;
const HLJS_MAX_WIDTH = 2000;

function lines(str: string) {
  let [j, i, n] = [0, -1, 0];
  while ((i = str.indexOf("\n", i + 1)) !== -1) {
    n++;
    if (n >= HLJS_MAX_LINES) {
      console.warn(`lines overflow, max is ${HLJS_MAX_LINES}`);
      return Infinity;
    }
    if (i - j >= HLJS_MAX_WIDTH) {
      console.warn(`width overflow, max is ${HLJS_MAX_WIDTH}, got`, i - j);
      return Infinity;
    }
    j = i;
  }
  return n;
}

watchEffect(() => {
  if (code.value && codeBlock.value) {
    if (lines(code.value) < HLJS_MAX_LINES) {
      update(codeBlock.value, code.value, lang.value, true);
    } else {
      codeBlock.value.textContent = "";
      failed.value = "File too large to render,\nClick 🔗 to view it on CDN.";
      emitter.emit("highlighted", false);
    }
  } else if (codeBlock.value) {
    codeBlock.value.textContent = "";
  }
});

emitter.on("update", () => {
  if (code.value && codeBlock.value && !failed.value) {
    update(codeBlock.value, code.value, lang.value, true);
  }
});

emitter.on("highlighted", (highlighted) => {
  if (highlighted && codeBlock.value) {
    activateLineNumbers(codeBlock.value);
  }
});

const activeLine = ref<HTMLElement | null>(null);

function activateLineNumbers(el: HTMLPreElement) {
  el.querySelectorAll("[data-lineno]").forEach((td_, index) => {
    const td = td_ as HTMLElement;
    const line = index + 1;
    if (line === app.line) {
      const tr = td.parentElement as HTMLElement;
      activeLine.value = tr;
      tr.classList.add("active");
      tick().then(() => {
        tr.scrollIntoView({ block: "start" });
      });
    }
    td.onclick = function setLineNumber() {
      const line = parseInt(td.dataset.lineno!);
      app.line = app.line === line ? 0 : line;
    };
  });
}

function strip_root(path: string) {
  const prefix = root_folder.value;
  let subpath = path;
  if (subpath.startsWith("/" + prefix)) {
    subpath = subpath.slice(prefix.length + 1);
  }
  return subpath;
}

watchEffect(() => {
  if (activeLine.value) {
    activeLine.value.classList.remove("active");
  }
  activeLine.value = document.querySelector(`[data-line="${app.line}"]`);
  if (activeLine.value) {
    activeLine.value.classList.add("active");
  }
});

const cdnBtn = ref<HTMLElement | null>(null);
onMounted(() => {
  cdnBtn.value = document.querySelector("#cdn-link");
});

watchEffect(() => {
  if (code.value && markdownEl.value && isMarkdown.value) {
    const baseUrl = repo.value ? `https://github.com/${repo.value}/blob/HEAD` : ''
    renderMarkdown(code.value, markdownEl.value, baseUrl);
  }
})
</script>

<template>
  <div class="editor-container">
    <header>
      <h1>
        <span>{{ strip_root(app.path) }}</span>
        <button v-show="isMarkdown" class="markdown-btn" :class="{ active: showMarkdown }" title="render it"
          @click="showMarkdown = !showMarkdown">
          <i class="i-mdi-language-markdown"></i>
        </button>
      </h1>
      <span class="size">{{ buffer && prettyBytes(buffer.byteLength, { binary: true }) }}</span>
      <span class="size">{{ gzipSize && `(gzip: ${prettyBytes(gzipSize, { binary: true })})` }}</span>
    </header>
    <pre ref="codeBlock" class="hljs" :class="{ wordwrap }"></pre>
    <span v-if="failed" ref="tipEl" class="tip">{{ failed }}</span>
    <span v-else-if="!code" class="tip">Select a file to view its source code.</span>
    <Arrow :fromEl="tipEl" :toEl="cdnBtn" />
    <article v-if="isMarkdown && showMarkdown" ref="markdownEl" class="markdown-body">
    </article>
  </div>
</template>

<style lang="scss" scoped>
header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

h1 {
  flex: 1;
  margin: 0;
  padding: 6px 8px 4px;
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.size {
  padding: 6px 8px 4px 0px;
  font-size: 14px;
}

.editor-container {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  height: 100%;
  position: relative;
}

.markdown-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  position: relative;
  left: 4px;
  cursor: pointer;

  i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
  }

  &:hover,
  &.active {
    color: var(--fg-on);
  }
}

.markdown-body {
  position: absolute;
  top: 30px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg);
  overflow: auto;
  padding: 2em 2ch;
}

pre {
  flex: 1;
  margin: 0;
  padding: 4px 0 8px;
  overflow-y: auto;
  height: 100%;
  font-size: 13px;
  font-family: monospace;
}

.wordwrap {
  white-space: pre-wrap;
  word-break: break-all;
}

.tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--pre-dim);
  white-space: pre-wrap;
  line-height: 1.5;
  text-align: center;
}
</style>
