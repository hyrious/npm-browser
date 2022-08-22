<script setup lang="ts">
import { wordwrap } from "../stores/code"
import { emitter, update } from "../helpers/hljs"
import { tick } from "@hyrious/utils";
const app = useApplicationStore()

const pre = ref()

const decoder = new TextDecoder()
const code = computed(() => {
  const file = files.value.find(e => e.name === app.path.slice(1))
  return file && decoder.decode(file.buffer)
})
const lang = computed(() => {
  const path = app.path
  const i = path.lastIndexOf('.')
  if (i < 0) return 'text'
  let ext = path.slice(i + 1)
  if (ext === 'map') ext = 'json'
  if (ext === 'cjs') ext = 'js'
  return ext
})

const HLJS_MAX_LENGTH = 20480

watchEffect(() => {
  if (code.value && pre.value) {
    if (code.value.length < HLJS_MAX_LENGTH) {
      update(pre.value, code.value, lang.value, true)
    } else {
      pre.value.textContent = code.value
      emitter.emit("highlighted", false)
    }
  }
})

emitter.on('update', (lineno) => {
  if (code.value && pre.value) {
    update(pre.value, code.value, lang.value, lineno)
  }
})

emitter.on("highlighted", highlighted => {
  if (highlighted && pre.value) {
    activateLineNumbers(pre.value)
  }
})

const activeLine = ref<HTMLElement | null>(null)

function activateLineNumbers(el: HTMLPreElement) {
  el.querySelectorAll('[data-lineno]').forEach((td_, index) => {
    const td = td_ as HTMLElement
    const line = index + 1
    if (line === app.line) {
      const tr = td.parentElement as HTMLElement
      activeLine.value = tr
      tr.classList.add("active")
      tick().then(() => {
        tr.scrollIntoView({ block: "center" })
      })
    }
    td.onclick = function setLineNumber() {
      const line = parseInt(td.dataset.lineno!)
      app.line = app.line === line ? 0 : line
    }
  })
}

watchEffect(() => {
  if (activeLine.value) {
    activeLine.value.classList.remove("active")
  }
  activeLine.value = document.querySelector(`[data-line="${app.line}"]`)
  if (activeLine.value) {
    activeLine.value.classList.add("active")
  }
})
</script>

<template>
  <div class="editor-container">
    <pre ref="pre" class="hljs" :class="{ wordwrap }"></pre>
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
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
</style>
