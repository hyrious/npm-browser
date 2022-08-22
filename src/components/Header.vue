<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { wordwrap } from "../stores/code"
import { emitter } from "../helpers/hljs"
const { packageName, packageVersion, line } = storeToRefs(useApplicationStore())

const showHintOnce = ref(!packageName.value)
const searchText = ref('')
const searching = ref(false)
const searchResult = ref<{ name: string, description: string }[]>([])
const versions = ref<string[]>([])
const highlighted = ref(false)

const DEBOUNCE_SEARCH = 500
let timer = 0
function debouncedSearch(str: string) {
  clearTimeout(timer)
  if ((str = str.trim())) {
    timer = setTimeout(search, DEBOUNCE_SEARCH, str)
    searching.value = true
    searchResult.value = []
  } else {
    searchResult.value = []
    searching.value = false
  }
}

const api = new URL('https://registry.npmjs.org/-/v1/search')
let abortController: AbortController | null = null
async function search(str: string) {
  api.searchParams.set("text", str)
  try {
    abortController && abortController.abort()
    abortController = new AbortController()
    const ret = await fetch(api, { signal: abortController.signal }).then(r => r.json())
    searchResult.value = ret.objects.map((e: any) => e.package)
  } catch (e) {
    if (e.name === 'AbortError') return
    statusMessage(e.message)
    throw e
  }
}

let skip = false
watch(searchText, (name) => {
  if (skip) {
    skip = false
    return
  }
  showHintOnce.value = false
  packageName.value = ''
  packageVersion.value = ''
  versions.value = []
  line.value = 0
  debouncedSearch(name)
})

function choose(pkg: { name: string }) {
  skip = true
  searching.value = false
  packageName.value = searchText.value = pkg.name
  searchResult.value = []
}

watch(packageName, name => {
  if (name) {
    versions.value = []
    debouncedLoadVersions(packageName.value)
  }
})

onMounted(() => {
  if (packageName.value) {
    skip = true
    searchText.value = packageName.value
    loadVersions(packageName.value, packageVersion.value)
  }
})

emitter.on("highlighted", value => {
  highlighted.value = value
})

const DEBOUNCE_VERSIONS = 500
let timerVersions = 0
function debouncedLoadVersions(name: string) {
  clearTimeout(timerVersions)
  timerVersions = setTimeout(loadVersions, DEBOUNCE_VERSIONS, name)
}

interface NpmInstallData {
  name: string;
  "dist-tags": { [tag: string]: string };
  versions: { [version: string]: NpmPackageInfo };
}

interface NpmPackageInfo {
  name: string;
  version: string;
  dependencies?: { [name: string]: string };
  dist: { tarball: string; fileCount?: number };
}

async function loadVersions(name: string, setVersion = '') {
  try {
    abortController && abortController.abort()
    abortController = new AbortController()
    const res = await fetch(`https://registry.npmjs.org/${name}`, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
      signal: abortController.signal
    })
    if (!res.ok) throw new Error(`Failed to fetch ${res.url}: ${await res.text()}`)
    const info = await (res.json() as Promise<NpmInstallData>).then((data) => ({
      latest: data["dist-tags"].latest,
      versions: Object.keys(data.versions),
    }))
    versions.value = info.versions.reverse()
    // TODO: use semver to better match version
    if (setVersion && info.versions.some(v => v === setVersion)) {
      packageVersion.value = setVersion
    } else {
      packageVersion.value = info.latest
    }
  } catch (e) {
    if (e.name === 'AbortError') return
    statusMessage(e.message)
    throw e
  }
}

async function share() {
  try {
    let url = location.href
    await navigator.clipboard?.writeText(url)
    alert('Shareable URL has been copied to clipboard.')
  } catch {}
}
</script>

<template>
  <header>
    <label for="q">npm i</label>
    <input v-model="searchText" type="text" id="q" placeholder="vue" autocomplete="off" autofocus spellcheck="false"
      :style="{ width: searchText.length + '.25ch' }" />
    <transition name="fade">
      <span v-if="showHintOnce">
        <i class="i-mdi-arrow-left"></i>
        <em class="hint">Enter package name here</em>
      </span>
    </transition>
    <label v-show="versions.length" for="v">@</label>
    <select v-model="packageVersion" v-show="versions.length" id="v">
      <option v-for="v in versions" :value="v">{{ v }}</option>
    </select>
    <span v-show="packageName && !versions.length">
      <i class="i-mdi-loading"></i>
      <span>loading&hellip;</span>
    </span>
    <span class="splitter"></span>
    <div class="controls">
      <button :class="{ active: wordwrap }" @click="wordwrap = !wordwrap">word-wrap</button>
      <button :class="{ active: highlighted }" @click="emitter.emit('update')">highlight-it</button>
    </div>
    <a class="btn" href="https://github.com/hyrious/npm-browser" target="_blank" title="hyrious/npm-browser">
      <i class="i-mdi-github"></i>
    </a>
    <button title="share" @click="share()">
      <i class="i-mdi-share-variant"></i>
    </button>
  </header>
  <aside v-show="searching">
    <ul v-if="searchResult.length > 0">
      <li v-for="pkg in searchResult" :key="pkg.name" @click="choose(pkg)" :title="pkg.description">
        <h3>{{ pkg.name }}</h3>
        <p>{{ pkg.description }}</p>
      </li>
    </ul>
    <p v-else title="searching...">
      <i class="i-mdi-loading"></i>
      <span>Searching&hellip;</span>
    </p>
  </aside>
</template>

<style lang="scss" scoped>
label {
  color: var(--pre-dim);
}

header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  width: 100%;
  height: 45px;
  padding: 0.5rem 1rem;
  font-family: var(--mono);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow);

  >span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding-left: 4px;
    font-size: 14px;
    color: var(--fg);
  }

  .btn,
  button {
    appearance: none;
    padding: 0;
    border: 0;
    text-decoration: none;
    color: var(--fg);
    display: inline-flex;
    align-items: center;
    padding: 4px 4px 4px 12px;
    cursor: pointer;

    &:hover {
      color: var(--fg-on);
    }
  }
}

.splitter {
  flex: 1;
}

.hint {
  font-family: var(--sans);
  color: var(--fg-on);
}

.controls {
  padding-right: 4px;
  display: inline-flex;
  gap: 8px;

  button {
    padding: 4px 8px;
    border-radius: 4px;
    border-width: 0;
    background-color: var(--bg-on);
    font-family: var(--sans);
    font-size: 14px;
    cursor: pointer;

    &:hover {
      color: var(--fg-on);
    }

    &.active {
      background-color: var(--highlight);
      color: var(--fg-on);
    }
  }
}

label[for="q"] {
  padding-right: 1ch;
}

input {
  padding-left: 0;
  padding-right: 0;
  border: 0;
  outline: 0;
  min-width: 3.25ch;
  color: var(--fg-on);
}

select {
  border: 0;
  outline: 0;
  padding-left: 0.25ch;
  background: transparent;
  color: var(--fg-on);
  cursor: pointer;
}

i {
  display: inline-block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.i-mdi-loading {
  animation: rotate 0.5s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

aside {
  position: absolute;
  top: 44px;
  left: 65px;
  max-width: 400px;
  max-height: 400px;
  overflow: auto;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  background: var(--bg);
  z-index: 9999;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: grid;
      padding: 4px 8px;
      cursor: pointer;

      &:hover {
        background: var(--bg-on);
      }

      h3,
      p {
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      h3 {
        font-size: 16px;
        font-weight: normal;
        color: var(--fg-on);
      }

      p {
        font-size: 14px;
        color: var(--fg);
      }
    }
  }

  >p {
    margin: 0;
    padding: 4px 8px;
    color: var(--fg);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
}

@media (max-width: 720px) {
  header {

    .btn,
    button,
    .hint {
      display: none;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
