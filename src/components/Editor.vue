<script setup lang="ts">
import { tick } from "@hyrious/utils";
import prettyBytes from "pretty-bytes";
import { wordwrap } from "../stores/code";
import { emitter, update } from "../helpers/hljs";
import { is_binary } from "../helpers/is-binary";
const app = useApplicationStore();

const codeBlock = ref();
const tipEl = ref<HTMLElement>();
const tipBound = shallowRef<DOMRect>(new DOMRect());

watch(tipEl, (el, _, onCleanup) => {
  if (el) {
    let raf = 0;
    function update() {
      if (!el) return;
      raf = requestAnimationFrame(update);
      tipBound.value = el.getBoundingClientRect();
    }
    update();
    onCleanup(() => cancelAnimationFrame(raf));
  }
});

const decoder = new TextDecoder();
const failed = ref("");
const arrow = ref(false);
const name_ver_length = computed(() => app.packageName.length + app.packageVersion.length + 1);
const file = computed(() => files.value.find((e) => e.name === app.path.slice(1)));
const buffer = computed(() => file.value?.buffer);
const code = computed(() => {
  failed.value = "";
  arrow.value = false;
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
  if (ext === "cjs") ext = "js";
  return ext;
});

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
const HLJS_MAX_WIDTH = 1000;

function lines(str: string) {
  let [j, i, n] = [0, -1, 0];
  while ((i = str.indexOf("\n", i + 1)) !== -1) {
    n++;
    if (n >= HLJS_MAX_LINES) return Infinity;
    if (i - j >= HLJS_MAX_WIDTH) return Infinity;
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
      arrow.value = true;
      emitter.emit("highlighted", false);
    }
  } else if (codeBlock.value) {
    codeBlock.value.textContent = "";
  }
});

emitter.on("update", () => {
  if (code.value && codeBlock.value && !arrow.value) {
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
</script>

<template>
  <div class="editor-container">
    <header>
      <h1>{{ strip_root(app.path) }}</h1>
      <span class="size">{{ buffer && prettyBytes(buffer.byteLength, { binary: true }) }}</span>
      <span class="size">{{ gzipSize && `(gzip: ${prettyBytes(gzipSize, { binary: true })})` }}</span>
    </header>
    <pre ref="codeBlock" class="hljs" :class="{ wordwrap }"></pre>
    <span v-if="failed" ref="tipEl" class="tip">{{ failed }}</span>
    <span v-else-if="!code" class="tip">Select a file to view its source code.</span>
    <svg
      v-if="arrow"
      class="arrow"
      :style="{ '--ch': name_ver_length + 'ch', height: tipBound.top + 'px' }"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      :viewBox="'0 0 ' + [tipBound.left - 350, tipBound.top].join(' ')"
    >
      <path d="M22,4 l-5,10 10,0 -5,-10" fill="currentColor" />
      <path
        :d="
          'M22,4 C22,120 ' +
          [tipBound.left - 480, tipBound.top - 15] +
          ' ' +
          [tipBound.left - 390, tipBound.top - 15]
        "
      />
    </svg>
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

.arrow {
  position: fixed;
  top: 36px;
  left: calc(var(--ch) + 8ch + 1rem + 36px * 3);
  z-index: 1000;
}
</style>
