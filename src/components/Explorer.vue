<script setup lang="ts">
import { storeToRefs } from 'pinia';
import prettyBytes from "pretty-bytes"
import { construct, FileEntry } from '../helpers/construct';
import { get, set } from '../helpers/idb';

const { packageName, packageVersion, path } = storeToRefs(useApplicationStore())
const root = ref<FileEntry | null>(null)

const fetching = ref(false)
const nameVersion = computed(() => packageName.value && packageVersion.value && `${packageName.value}@${packageVersion.value}`)
const size = ref(0)
const sizePretty = computed(() => nameVersion.value && prettyBytes(size.value))
const packedSize = ref(0)
const packedSizePretty = computed(() => nameVersion.value && prettyBytes(packedSize.value))

let timer = 0
let abortController: AbortController | null = null
function debouncedFetchPackage(name: string, version: string) {
  clearTimeout(timer)
  abortController && abortController.abort()
  if (name && version) {
    setTimeout(fetchPackage, 200, name, version);
  }
}

watchEffect(() => {
  debouncedFetchPackage(packageName.value, packageVersion.value)
})

const extractPackageP = import('../helpers/untar');
async function fetchPackage(name: string, version: string) {
  fetching.value = true
  root.value = null
  let buffer: ArrayBuffer

  try {
    const cached = await get(name, version)
    if (cached) {
      buffer = cached.buffer
    } else {
      abortController = new AbortController()
      buffer = await fetch(`https://registry.npmjs.org/${name}/-/${name.split('/').pop()}-${version}.tgz`, {
        signal: abortController.signal
      }).then(r => r.arrayBuffer())
      await set(name, version, new Uint8Array(buffer))
    }
  } catch (e) {
    fetching.value = false
    if (e.name === "AbortError") return
    statusMessage(e.message)
    throw e
  }

  packedSize.value = buffer.byteLength

  try {
    let totalSize = 0
    const { default: extractPackage } = await extractPackageP
    const nodes = await extractPackage(buffer, file => {
      statusMessage('Extracting ' + file.name)
      totalSize += file.buffer.byteLength
    })
    size.value = totalSize
    files.value = nodes;
    statusMessage('')
    root.value = (construct(nodes.map(e => e.name), path.value).children || [])[0]
    const selected = path.value.slice(1)
    if (!nodes.some(e => e.name === selected)) {
      path.value = ''
    }
  } catch (e) {
    fetching.value = false
    if (e.name === "AbortError") return
    statusMessage(e.message)
    throw e
  }

  fetching.value = false
}
</script>

<template>
  <header>
    <h3 :title="nameVersion">
      <span>{{ nameVersion }}</span>
      <span v-if="size > 0" class="size" :title="'Packed: ' + packedSizePretty">{{ sizePretty }}</span>
    </h3>
  </header>
  <ul v-if="root?.children">
    <File v-for="file in root.children" :node="file" />
  </ul>
  <div v-else-if="fetching" class="loading">
    <i class="i-mdi-loading"></i>
    <span>loading&hellip;</span>
  </div>
</template>

<style lang="scss" scoped>
header {
  h3 {
    margin: 0;
    padding: 6px 16px 4px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

ul {
  flex: 1;
  margin: 0;
  padding: 0 16px 40px;
  list-style-type: none;
  overflow-y: auto;
  height: 100%;
}

.size {
  padding-left: 8px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 1ch;
  font-size: 14px;
  padding: 8px 16px;

  i {
    display: inline-block;
    width: 16px;
    height: 16px;
  }
}
</style>
