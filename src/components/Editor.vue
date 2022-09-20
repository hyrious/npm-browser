<script setup lang="ts">
import { wordwrap } from "../stores/code";
import { emitter, update } from "../helpers/hljs";
import { tick } from "@hyrious/utils";
import { is_binary } from "../helpers/is-binary";
const app = useApplicationStore();

const pre = ref();

const decoder = new TextDecoder();
const failed = ref("");
const code = computed(() => {
  const file = files.value.find((e) => e.name === app.path.slice(1));
  failed.value = "";
  if (file) {
    if (is_binary(file.buffer)) {
      failed.value = "Cannot open binary file.";
    } else {
      return decoder.decode(file.buffer);
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
  if (code.value && pre.value) {
    if (lines(code.value) < HLJS_MAX_LINES) {
      update(pre.value, code.value, lang.value, true);
    } else {
      pre.value.textContent = code.value;
      emitter.emit("highlighted", false);
    }
  } else if (pre.value) {
    pre.value.textContent = "";
  }
});

emitter.on("update", (lineno) => {
  if (code.value && pre.value) {
    update(pre.value, code.value, lang.value, lineno);
  }
});

emitter.on("highlighted", (highlighted) => {
  if (highlighted && pre.value) {
    activateLineNumbers(pre.value);
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
        tr.scrollIntoView({ block: "center" });
      });
    }
    td.onclick = function setLineNumber() {
      const line = parseInt(td.dataset.lineno!);
      app.line = app.line === line ? 0 : line;
    };
  });
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
    <pre ref="pre" class="hljs" :class="{ wordwrap }"></pre>
    <span v-if="failed" class="tip">{{ failed }}</span>
    <span v-else-if="!code" class="tip">Select a file to view its source code.</span>
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
  position: relative;
}

pre {
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  height: 100%;
  font-size: 13px;
}

.wordwrap {
  white-space: pre-wrap;
}

.tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--pre-dim);
}
</style>
