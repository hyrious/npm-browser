<script setup lang="ts">
import prettyBytes from "pretty-bytes";
import { disposable } from "@hyrious/utils";
import { listen } from "@wopjs/dom";
import { basicSetup, EditorView } from "codemirror"
import { Extension, EditorState, StateEffect, EditorSelection } from "@codemirror/state"
import { githubDark } from '@ddietr/codemirror-themes/github-dark'
import { javascript } from "@codemirror/lang-javascript"
import { css } from "@codemirror/lang-css"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { is_binary } from "../helpers/is-binary";
import { renderMarkdown } from "../helpers/marked";

const decoder = new TextDecoder()

const app = useApplicationStore()
const file = computed(() => files.value.find(e => e.name === app.path.slice(1)))
const isMarkdown = computed(() => file.value?.name.endsWith('.md'))
const showMarkdown = ref(true);
const buffer = computed(() => file.value?.buffer)
const failed = ref<"" | "binary">("")
const code = computed(() => {
  if (buffer.value) {
    if (is_binary(buffer.value)) {
      failed.value = "binary"
    } else {
      return decoder.decode(buffer.value)
    }
  } else {
    return ""
  }
})
const lang = computed(() => {
  const path = app.path
  const i = path.lastIndexOf('.')
  if (i < 0) return 'text'
  let ext = path.slice(i + 1)
  if (ext === "map") ext = "json";
  if (ext === "cjs" || ext === "mjs") ext = "js";
  if (ext === "cts" || ext === "mts") ext = "ts";
  return ext;
})

const gzipSizeFn = ref<(data: ArrayBuffer) => number>();
import("../helpers/gzip-size").then((mod) => {
  gzipSizeFn.value = mod.default;
});
const gzipSize = computed(() => {
  if (buffer.value && gzipSizeFn.value) {
    return gzipSizeFn.value(buffer.value);
  }
});

function strip_root(path: string) {
  const prefix = root_folder.value;
  let subpath = path;
  if (subpath.startsWith("/" + prefix)) {
    subpath = subpath.slice(prefix.length + 1);
  }
  return subpath;
}

const markdownEl = ref<HTMLElement>();

watch([code, markdownEl, isMarkdown], ([code, markdownEl, isMarkdown]) => {
  if (code && markdownEl && isMarkdown) {
    const baseUrl = repo.value ? `https://github.com/${repo.value}/blob/HEAD` : ''
    renderMarkdown(code, markdownEl, baseUrl);
  }
})

// reference: https://github.com/logue/vue-codemirror6
const editor = ref<HTMLElement>()
const view = shallowRef(new EditorView())

const prefersDark = matchMedia('(prefers-color-scheme: dark)')
const dark = ref(prefersDark.matches)
onMounted(() => {
  const { push, flush } = disposable()
  push(listen(prefersDark, 'change', ev => { dark.value = ev.matches }))
  return flush
})

const extensions = computed(() =>
  [
    basicSetup,
    EditorView.updateListener.of((update) => {
      if (update.selectionSet) {
        app.line = update.state.doc.lineAt(update.state.selection.main.head).number
      }
    }),
    dark.value && EditorView.theme({
      '&': {
        color: 'var(--fg)',
        backgroundColor: 'var(--bg)',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-activeLine': { backgroundColor: 'var(--bg-on)' },
      '.cm-gutters': {
        backgroundColor: 'var(--bg)',
        color: 'var(--fg)',
        border: 'none'
      },
      '.cm-activeLineGutter': { backgroundColor: 'var(--bg)' },
    }),
    dark.value && githubDark,
    wordwrap.value && EditorView.lineWrapping,
    EditorState.readOnly.of(true),
    lang.value === "js" || lang.value === "ts" || lang.value === "jsx" || lang.value === "tsx" ? javascript() :
      lang.value === 'css' ? css() :
        lang.value === 'json' ? json() :
          lang.value === 'md' ? markdown() : undefined,
  ].filter(Boolean) as Extension[]
)
watch(extensions, exts =>
  view.value.dispatch({
    effects: StateEffect.reconfigure.of(exts)
  })
)

function jumpToLine() {
  try {
    view.value.dispatch({
      selection: EditorSelection.cursor(view.value.state.doc.line(app.line).from),
      scrollIntoView: true,
    })
  } catch {}
}

watch(code, code => {
  if (view.value.composing) return
  view.value.dispatch({
    changes: { from: 0, to: view.value.state.doc.length, insert: code },
  })
  nextTick(jumpToLine)
})

onMounted(() => {
  view.value = new EditorView({
    doc: code.value,
    parent: editor.value,
    extensions: extensions.value,
  })
  nextTick(jumpToLine)
  return () => view.value.destroy()
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
    <div v-show="code" class="editor" ref="editor"></div>
    <span v-if="failed === 'binary'" class="tip">Cannot open binary file.</span>
    <span v-else-if="!code" class="tip">Select a file to view its source code.</span>
    <article v-if="isMarkdown && showMarkdown" ref="markdownEl" class="markdown-body"></article>
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

.editor-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
}

.editor {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
</style>
