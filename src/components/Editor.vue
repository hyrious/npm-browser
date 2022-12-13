<script setup lang="ts">
import prettyBytes from "pretty-bytes";
import { disposable } from "@hyrious/utils";
import { listen } from "@wopjs/dom";
import { minimalSetup, EditorView } from "codemirror"
import { lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view'
import { Extension, EditorState, StateEffect, EditorSelection } from "@codemirror/state"
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { githubLight } from '@ddietr/codemirror-themes/github-light'
import { githubDark } from '@ddietr/codemirror-themes/github-dark'
import { javascript } from "@codemirror/lang-javascript"
import { css } from "@codemirror/lang-css"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { is_binary } from "../helpers/is-binary";
import { renderMarkdown } from "../helpers/marked";
import { centerCursor, enable_center_cursor } from "../helpers/center-cursor";
import { linkPlugin, path_resolve } from "../helpers/navigate";
import { events } from "../helpers/events";
import { gzipSize as gzipSizeFn } from "../helpers/gzip-size"

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

const gzipSize = ref(0);

function strip_root(path: string) {
  const prefix = root_folder.value;
  let subpath = path;
  if (subpath.startsWith("/" + prefix)) {
    subpath = subpath.slice(prefix.length + 1);
  }
  return subpath;
}

const markdownEl = ref<HTMLElement>();

// reference: https://github.com/logue/vue-codemirror6
const editor = ref<HTMLElement>()
const view = shallowRef(new EditorView())

const prefersDark = matchMedia('(prefers-color-scheme: dark)')
const dark = ref(prefersDark.matches)

const extensions = computed(() =>
  [
    minimalSetup,
    linkPlugin,
    keymap.of(searchKeymap),
    highlightSelectionMatches(),
    lineNumbers({
      domEventHandlers: {
        click(view, line, event) {
          const i = view.state.doc.lineAt(line.from).number
          if (app.line !== i) {
            app.line = i
            nextTick(jumpToLine)
          } else {
            app.line = 0
          }
          return false
        }
      }
    }),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    EditorView.updateListener.of((update) => {
      if (update.selectionSet) {
        app.line = update.state.doc.lineAt(update.state.selection.main.head).number
      }
    }),
    centerCursor,
    EditorView.theme({
      '&': {
        color: 'var(--fg)',
        backgroundColor: 'var(--bg)',
      },
      '&.cm-editor': { height: '100%' },
      '.cm-scroller': { overflow: 'auto' },
      '&.cm-editor.cm-focused': {
        outline: 'none',
      },
      '.cm-activeLine': { backgroundColor: 'var(--bg-on-transparent)', outline: '1px solid var(--bg-on)' },
      '.cm-activeLineGutter': { color: 'var(--fg-on)', backgroundColor: 'var(--bg-on-transparent)', outline: '1px solid var(--bg-on)' },
      '.cm-lineNumbers .cm-gutterElement': { paddingLeft: '12px', paddingRight: '8px' },
      '.cm-lineNumbers .cm-gutterElement:hover': { color: 'var(--fg-on)' },
      '.cm-gutters': {
        backgroundColor: 'var(--bg)',
        color: 'var(--fg)',
      },
      '.cm-link': { color: 'var(--fg-on)', cursor: 'pointer' },
      '.cm-link:hover': { textDecoration: 'underline' }
    }),
    dark.value ? githubDark : githubLight,
    wordwrap.value && EditorView.lineWrapping,
    EditorState.readOnly.of(true),
    lang.value === "js" || lang.value === "ts" || lang.value === "jsx" || lang.value === "tsx" ? javascript() :
      lang.value === 'css' ? css() :
        lang.value === 'json' ? json() :
          lang.value === 'md' ? markdown() : undefined,
  ].filter(Boolean) as Extension[]
)

function jumpToLine() {
  if (app.line === 0) return;
  try {
    view.value.dispatch({
      selection: EditorSelection.cursor(view.value.state.doc.line(app.line).from),
      scrollIntoView: true,
    })
  } catch {}
}

function jumpToLineWithCenterCursor() {
  enable_center_cursor(50);
  jumpToLine();
}

onMounted(() => {
  const { push, flush } = disposable()

  push(listen(prefersDark, 'change', ev => { dark.value = ev.matches }))

  push(watch(buffer, (buffer) => {
    if (buffer) gzipSizeFn(buffer).then(size => { gzipSize.value = size });
    else gzipSize.value = 0;
  }))

  push(watch([code, markdownEl, isMarkdown], ([code, markdownEl, isMarkdown]) => {
    if (code && markdownEl && isMarkdown) {
      const baseUrl = repo.value ? `https://github.com/${repo.value}/blob/HEAD` : ''
      renderMarkdown(code, markdownEl, baseUrl);
    }
  }))

  push(watch(extensions, exts => view.value.dispatch({
    effects: StateEffect.reconfigure.of(exts)
  })))

  view.value = new EditorView({
    doc: code.value,
    parent: editor.value,
    extensions: extensions.value,
  })
  nextTick(jumpToLine)
  push(() => view.value.destroy())

  push(watch(code, code => {
    if (view.value.composing) return
    if (view.value) { view.value.destroy() }
    view.value = new EditorView({
      doc: code,
      parent: editor.value,
      extensions: extensions.value,
    })
    nextTick(jumpToLineWithCenterCursor);
  }))

  push(watchEffect(() => {
    const key = app.packageName + app.path
    app.line ? lineCache.set(key, app.line) : lineCache.delete(key)
  }))

  push(events.on('try-jump', specifier => {
    // relative path
    if (specifier.startsWith('.')) {
      const path = path_resolve(app.path, specifier)
      for (const file of files.value) {
        let resolved: string | undefined
        const base = path.slice(1)
        for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", ".json", "/index.ts", "/index.tsx", "/index.js", "/index.js"]) {
          if (file.name === base + ext) {
            resolved = path + ext
            break
          }
        }
        if (resolved) {
          app.path = resolved
          app.line = lineCache.get(app.packageName + resolved) || 0
          events.emit('jump', resolved)
          break
        }
      }
    }
    // maybe package name
    else {
      location.search = `?q=${specifier}`;
    }
  }))

  return flush
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
      <span v-if="buffer" class="size">{{ prettyBytes(buffer.byteLength, { binary: true }) }}</span>
      <span v-if="gzipSize" class="size">{{ `(gzip: ${prettyBytes(gzipSize, { binary: true })})` }}</span>
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
