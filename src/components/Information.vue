<script setup lang="ts">
import { storeToRefs } from "pinia"
const { packageName, packageVersion } = storeToRefs(useApplicationStore())

const weeklyDownloads = computed(() => `https://img.shields.io/npm/dw/${packageName.value}`)
const bundlephobia = computed(() => `https://img.shields.io/bundlephobia/minzip/${packageName.value}/${packageVersion.value}`)
const pkg = computed(() => {
  const f = files.value.find(e => trim_root(e.name) === 'package.json')
  if (!f) return ""
  return JSON.parse(decoder.decode(f.buffer))
})
const repo = computed(() => find_github_repo())
const desc = computed(() => pkg.value.description)
const stars = computed(() => `https://img.shields.io/github/stars/${repo.value}`)

function trim_root(str: string) {
  const i = str.indexOf('/')
  if (i !== -1) str = str.slice(i + 1)
  return str
}

const decoder = new TextDecoder()
function find_github_repo() {
  const repo = pkg.value.repository
  if (typeof repo === 'string') return normalize_git_repo(repo)
  if (typeof repo === 'object' && repo.type === 'git') return normalize_git_repo(repo.url)
  return ""
}

function normalize_git_repo(repo: string) {
  if (repo.startsWith('git+')) {
    repo = repo.slice(4)
  }
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4)
  }
  if (repo.startsWith('https://github.com/')) {
    repo = repo.slice(19)
  }
  return repo
}
</script>

<template v-if="packageName && packageVersion">
  <p class="desc">{{desc}}</p>
  <a :href="'https://www.npmjs.com/package/' + packageName" target="_blank" rel="noopener noreferrer">
    <img :src="weeklyDownloads" alt="">
  </a>
  <a :href="'https://bundlephobia.com/package/' + packageName + '@' + packageVersion" target="_blank"
    rel="noopener noreferrer">
    <img :src="bundlephobia" alt="">
  </a>
  <a v-if="repo" :title="repo" :href="'https://github.com/' + repo" target="_blank" rel="noopener noreferrer">
    <img :src="stars" :alt="repo">
  </a>
</template>

<style lang="scss" scoped>
.desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  font-family: var(--sans);
}
</style>
