<script setup lang="ts">
import { wordwrap } from "../stores/code"
import { emitter, update } from "../helpers/hljs"
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
      update(pre.value, code.value, lang.value)
    } else {
      pre.value.textContent = code.value
      emitter.emit("highlighted", false)
    }
  }
})

emitter.on('update', () => {
  if (code.value && pre.value) {
    update(pre.value, code.value, lang.value)
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
