<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { construct, FileEntry } from '../helpers/construct';
import { get, set } from '../helpers/idb';

const { packageName, packageVersion, path } = storeToRefs(useApplicationStore())
const root = ref<FileEntry>()

const nameVersion = computed(() => packageName.value && `${packageName.value}@${packageVersion.value}`)

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
    if (e.name === "AbortError") return
    statusMessage(e.message)
    throw e
  }

  try {
    const { default: extractPackage } = await extractPackageP
    const nodes = await extractPackage(buffer, file => {
      statusMessage('Extracting ' + file.name)
    })
    files.value = nodes;
    statusMessage('')
    root.value = (construct(nodes.map(e => e.name), path.value).children || [])[0]
    const selected = path.value.slice(1)
    if (!nodes.some(e => e.name === selected)) {
      path.value = '/packages/package.json'
    }
  } catch (e) {
    if (e.name === "AbortError") return
    statusMessage(e.message)
    throw e
  }
}
</script>

<template>
  <header>
    <h3 :title="nameVersion">{{ nameVersion }}</h3>
  </header>
  <ul v-if="root?.children">
    <File v-for="file in root.children" :node="file" />
  </ul>
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
}


@media (max-width: 720px) {
  ul {
    padding-bottom: 0;
  }
}
</style>
