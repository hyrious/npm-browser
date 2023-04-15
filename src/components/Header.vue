<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { listen } from "@wopjs/dom";
import { $ as querySelector } from "@hyrious/utils";
import { files, wordwrap } from "../stores/code";
import { is_binary } from "../helpers/is-binary";
import { fetch_with_mirror_retry } from "../helpers/fetch-mirror";
import { events } from "../helpers/events";
import Information from "./Information.vue";
const { packageName, packageVersion, path, line } = storeToRefs(useApplicationStore());

const showHintOnce = ref(!packageName.value);
const searchInput = ref();
const searchText = ref("");
const searching = ref(false);
const searchResult = ref<{ name: string; description: string }[]>([]);
const versions = ref<string[]>([]);
const showDiff = ref(false);
const showFullTextSearch = ref(false);
const fullTextSearchText = ref("");
const searchingFullText = ref(false);
type Line = { path: string; line: number; text: string };
const fullTextSearchResult = ref<Line[] | null>(null);
type Block = { path: string; lines: Line[] };
const fullTextSearchResultPretty = computed(() => {
  let current: Block | null = null;
  const result: Block[] = [];
  if (!fullTextSearchResult.value) return result;
  for (const row of fullTextSearchResult.value) {
    if (!current || current.path !== row.path) {
      current = { path: row.path, lines: [row] };
      result.push(current);
    } else {
      current.lines.push(row);
    }
  }
  return result;
});
const fullTextSearchLineNumberWidth = ref(0);
const searchResultIndex = ref(-1);
const information = ref(false);

const DEBOUNCE_SEARCH = 500;
let timer = 0;
function debouncedSearch(str: string) {
  clearTimeout(timer);
  if ((str = str.trim())) {
    timer = setTimeout(search, DEBOUNCE_SEARCH, str);
    searching.value = true;
    searchResult.value = [];
  } else {
    searchResult.value = [];
    searching.value = false;
  }
}

const api = new URL("https://registry.npmjs.org/-/v1/search");
let abortController: AbortController | null = null;
async function search(str: string) {
  api.searchParams.set("text", str);
  try {
    abortController && abortController.abort();
    abortController = new AbortController();
    const ret = await fetch_with_mirror_retry(api, { signal: abortController.signal }).then((r) => r.json());
    searchResult.value = ret.objects.map((e: any) => e.package);
  } catch (e) {
    if (e.name === "AbortError") return;
    statusMessage(e.message);
    throw e;
  }
}

let skip = false;
watch(searchText, (name) => {
  if (skip) {
    skip = false;
    return;
  }
  showHintOnce.value = false;
  packageName.value = "";
  packageVersion.value = "";
  versions.value = [];
  line.value = 0;
  searchResultIndex.value = -1;
  debouncedSearch(name);
});

function choose(pkg: { name: string }) {
  skip = true;
  searching.value = false;
  packageName.value = searchText.value = pkg.name;
  searchResult.value = [];
}

watch(packageName, (name) => {
  if (name) {
    versions.value = [];
    debouncedLoadVersions(packageName.value);
  }
});

onMounted(() => {
  if (packageName.value) {
    skip = true;
    searchText.value = packageName.value;
    loadVersions(packageName.value, packageVersion.value);
  } else if (searchInput.value) {
    (searchInput.value as HTMLInputElement).focus();
  }

  const AtoZ = "abcdefghijklmnopqrstuvwxyz";
  function focusSearchInput(ev: KeyboardEvent) {
    // @ts-ignore
    if (ev.target === this) {
      const { key, shiftKey, ctrlKey, altKey, metaKey } = ev;
      if (
        (key === "@" && shiftKey && !ctrlKey && !altKey && !metaKey) ||
        (AtoZ.includes(key) && !shiftKey && !ctrlKey && !altKey && !metaKey)
      ) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        const input = searchInput.value as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.value = key;
        }
      }
    }
  }
  const stop_listen_keydown = listen(document.body, "keydown", focusSearchInput, { capture: true });

  function paste(ev: ClipboardEvent) {
    if ((ev.target as HTMLElement).tagName !== "INPUT") {
      const data = ev.clipboardData?.getData("Text");
      if (data && data.length <= 214) {
        ev.stopPropagation();
        ev.preventDefault();
        searchText.value = data;
        (searchInput.value as HTMLInputElement | null)?.focus();
      }
    }
  }
  const stop_listen_paste = listen(document.body, "paste", paste);

  const stop_listen_search = events.on("search", (text) => {
    skip = true;
    searchText.value = text;
    showHintOnce.value = false;
  });

  const stop_listen_cmd_k = listen(document.body, "keydown", (ev) => {
    if (ev.metaKey && ev.key === "k") {
      fullTextSearch();
    }
  });

  const stop_listen_jsdelivr = events.on("jsdelivr", ({ ev, path }) => {
    jsdelivr(ev, path);
  });

  return () => {
    stop_listen_keydown();
    stop_listen_paste();
    stop_listen_search();
    stop_listen_cmd_k();
    stop_listen_jsdelivr();
  };
});

const DEBOUNCE_VERSIONS = 500;
let timerVersions = 0;
function debouncedLoadVersions(name: string) {
  clearTimeout(timerVersions);
  timerVersions = setTimeout(loadVersions, DEBOUNCE_VERSIONS, name);
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

async function loadVersions(name: string, setVersion = "") {
  let no_thanks = false;
  try {
    abortController && abortController.abort();
    abortController = new AbortController();
    // eager load versions
    fetch(`https://data.jsdelivr.com/v1/package/npm/${name}`).then(r => r.json()).then(data => {
      if (no_thanks) return;
      versions.value = data.versions;
    })
    const res = await fetch_with_mirror_retry(`https://registry.npmjs.org/${name}`, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
      signal: abortController.signal,
    });
    if (!res.ok) throw new Error(`Failed to fetch ${res.url}: ${await res.text()}`);
    no_thanks = true;
    const info = await (res.json() as Promise<NpmInstallData>).then((data) => ({
      latest: data["dist-tags"].latest,
      versions: Object.keys(data.versions),
    }));
    versions.value = info.versions.reverse();
    if (setVersion && info.versions.some((v) => v === setVersion)) {
      packageVersion.value = setVersion;
    } else {
      packageVersion.value = info.latest;
    }
  } catch (e) {
    no_thanks = true;
    if (e.name === "AbortError") return;
    statusMessage(e.message);
    throw e;
  }
}

async function share() {
  try {
    let url = location.href;
    await navigator.clipboard?.writeText(url);
    alert("Shareable URL has been copied to clipboard.");
  } catch {}
}

async function npmInstall() {
  try {
    let text = `npm i ${packageName.value}@${packageVersion.value}`;
    await navigator.clipboard?.writeText(text);
    alert("Install command has been copied to clipboard.");
  } catch (e) {
    alert(e.message);
  }
}

function strip_root(path: string) {
  const prefix = root_folder.value;
  let subpath = path;
  if (subpath.startsWith("/" + prefix)) {
    subpath = subpath.slice(prefix.length + 1);
  }
  return subpath;
}

const subpath = computed(() => strip_root(path.value));

function diff(ev: MouseEvent) {
  const el = ev.target as HTMLElement;
  if (el && el.dataset.value) {
    const name = packageName.value;
    const from = el.dataset.value;
    const to = packageVersion.value;
    showDiff.value = false;
    const url = (path.value ? diffOne : diffAll)([
      `${name}@${from}`, 
      `${name}@${to}`,
    ]);
    window.open(url, "_blank");
  }
}

function diffAll([a, b]: string[]) {
  return `https://hyrious.me/npm-diff/?a=${a}&b=${b}`;
}

function diffOne([a, b]: string[]) {
  const url = new URL("https://hyrious.me/tool/diff-npm.html");
  url.searchParams.set("a", `${a}${subpath.value}`);
  url.searchParams.set("b", `${b}${subpath.value}`);
  url.searchParams.set("s", "1");
  url.searchParams.set("f", "l");
  return url.toString();
}

const TEXT_EXTS = [
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".svg",
  ".txt",
];
async function fullTextSearch(search?: string) {
  if (search === undefined) {
    const show = (showFullTextSearch.value = !showFullTextSearch.value);
    return (
      show &&
      nextTick(() => {
        const searchInput = document.querySelector("#s");
        searchInput && (searchInput as HTMLElement).focus();
      })
    );
  }

  if (search === "") {
    fullTextSearchResult.value = null;
    return;
  }

  searchingFullText.value = true;
  const result: Line[] = [];
  const decoder = new TextDecoder();
  let maxWidth = 2;
  // ref: https://github.com/frejs/fre/blob/master/src/schedule.ts
  const threshold = 5;
  let deadline = 0;
  for (const file of files.value) {
    // skip minified files
    if (file.name.includes(".min.")) continue;
    // skip binary files
    if (!TEXT_EXTS.some((ext) => file.name.endsWith(ext))) continue;
    if (is_binary(file.buffer)) continue;

    const path = file.name.replace(/^\w+\//, "");
    const text = decoder.decode(file.buffer);
    text.split(/\r?\n/).forEach((line, i) => {
      if (line.includes(fullTextSearchText.value)) {
        maxWidth = Math.max(maxWidth, `${i + 1}`.length);
        result.push({ path, line: i + 1, text: line });
      }
    });

    let now = performance.now();
    if (now >= deadline) {
      deadline = now + threshold;
      fullTextSearchResult.value = result.slice();
      fullTextSearchLineNumberWidth.value = maxWidth;
      await new Promise((r) => requestAnimationFrame(r));
    }
  }
  fullTextSearchLineNumberWidth.value = maxWidth;
  fullTextSearchResult.value = result;

  searchingFullText.value = false;
}

async function jump(location: { path: string; line: number }) {
  path.value = "/" + root_folder.value + "/" + location.path;
  line.value = location.line;
  await nextTick();
  const activeLine = document.querySelector("[data-line].active");
  if (activeLine) {
    activeLine.scrollIntoView({ block: "start" });
  }
  events.emit("jump", path.value);
}

function toggleBlock(ev: MouseEvent) {
  const el = ev.target as HTMLButtonElement;
  if (el.classList.contains("search-result-heading")) {
    el.classList.toggle("collapsed");
  }
}

function press_return_to_kick_start_and_handle_arrows(ev: KeyboardEvent) {
  if (ev.key === "Enter" && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) {
    ev.preventDefault();
    ev.stopPropagation();
    const index = searchResultIndex.value;
    if (index === -1) {
      const name = searchText.value.trim();
      name && choose({ name });
    } else {
      choose(searchResult.value[index]);
    }
  } else {
    handle_arrows(ev);
  }
}

function handle_arrows(ev: KeyboardEvent) {
  if (ev.key === "ArrowUp") {
    ev.preventDefault();
    select_candidate(-1);
  } else if (ev.key === "ArrowDown") {
    ev.preventDefault();
    select_candidate(+1);
  }
}

function select_candidate(step: number) {
  const size = searchResult.value.length;
  const value = searchResultIndex.value;
  const next = value === -1 ? (step > 0 ? 0 : size - 1) : (value + step + size) % size;
  searchResultIndex.value = next;
  nextTick(focus_search_result_by_index);
}

function focus_search_result_by_index() {
  querySelector(".searching>ul>li.active")?.scrollIntoView({ block: "nearest" });
}

function jsdelivr(ev: MouseEvent | KeyboardEvent, path?: string) {
  const suffix = path ? strip_root(path) : subpath.value;
  let url: string;
  if (ev.altKey) {
    url = `https://unpkg.com/${packageName.value}@${packageVersion.value}${suffix}`;
  } else {
    url = `https://cdn.jsdelivr.net/npm/${packageName.value}@${packageVersion.value}${suffix}`;
  }
  open(url, "_blank");
}

function uninstall() {
  location.href = location.origin + location.pathname;
}

function toggle_wordwrap() {
  wordwrap.value = !wordwrap.value;
}
</script>

<template>
  <header>
    <button class="site-title" title="double click to uninstall" @dblclick="uninstall()">npm&nbsp;i</button>
    <button class="site-title-sm" title="double click to uninstall" @dblclick="uninstall">ni</button>
    <input v-model="searchText" id="q" ref="searchInput" title="package name" placeholder="vue" autocomplete="off"
      spellcheck="false" :class="{ inputting: searchText }" :style="{ width: searchText.length + '.5ch' }"
      @keyup="press_return_to_kick_start_and_handle_arrows($event)" />
    <transition name="fade">
      <span v-if="showHintOnce">
        <i class="i-mdi-arrow-left-thin"></i>
        <em class="hint">Enter package name here</em>
      </span>
    </transition>
    <label v-show="versions.length" for="v">@</label>
    <select v-model="packageVersion" v-show="versions.length" id="v" title="package version"
      :style="{ width: packageVersion.length + '.5ch' }">
      <option v-for="v in versions" :value="v">{{ v }}</option>
    </select>
    <span v-show="packageName && !versions.length">
      <i class="i-mdi-loading"></i>
      <span>loading&hellip;</span>
    </span>
    <button v-show="packageName && packageVersion" title="copy command line" @click="npmInstall()">
      <i class="i-mdi-content-copy"></i>
    </button>
    <button v-show="packageName && packageVersion" :class="{ active: showDiff }" title="diff with other version"
      @click="showDiff = !showDiff">
      <i class="i-mdi-file-compare"></i>
    </button>
    <aside v-if="showDiff" class="diff-versions" :style="{ transform: `translateX(${packageName.length + 1}ch)` }"
      @click="diff($event)">
      <button v-for="v in versions" :data-value="v">
        <span :data-value="v">{{ packageVersion }}</span>
        <i class="i-mdi-arrow-left" :data-value="v"></i>
        <span :data-value="v">{{ v }}</span>
      </button>
    </aside>
    <button v-show="files.length" title="search from the whole package (ctrl/cmd+k)"
      :class="{ active: showFullTextSearch }" @click="fullTextSearch()">
      <i class="i-mdi-search"></i>
    </button>
    <aside v-if="showFullTextSearch" class="full-text-search">
      <div class="row">
        <label for="s">Search:</label>
        <input v-model="fullTextSearchText" :disabled="searchingFullText" id="s" title="code" autocomplete="off"
          spellcheck="false" @change="fullTextSearch(fullTextSearchText)" />
        <button :disabled="searchingFullText" @click="fullTextSearch(fullTextSearchText)">
          <i v-show="searchingFullText" class="i-mdi-loading"></i>
          <span v-show="!searchingFullText">GO</span>
        </button>
      </div>
      <output>
        <div class="search-result-block" v-for="block in fullTextSearchResultPretty">
          <h4>
            <i class="i-mdi-file"></i>
            <button class="search-result-heading" @click="toggleBlock($event)">{{ block.path }}</button>
          </h4>
          <button class="search-result-line" v-for="line in block.lines" :title="line.text" @click="jump(line)">
            {{ String(line.line).padStart(fullTextSearchLineNumberWidth) }}: {{ line.text }}
          </button>
        </div>
        <p v-show="fullTextSearchResult && fullTextSearchResult.length === 0">404 Not found :/</p>
      </output>
    </aside>
    <button id="cdn-link" v-show="packageName && packageVersion && path"
      title="open this file in jsdelivr (press alt/option for unpkg)" @click="jsdelivr($event)">
      <i class="i-mdi-link-variant"></i>
    </button>
    <button class="information" :class="{ active: information }" v-show="packageName && packageVersion"
      @click="information = !information" title="info">
      <i class="i-mdi-information-outline"></i>
    </button>
    <div class="information-panel" v-show="information">
      <Information />
    </div>
    <span class="splitter"></span>
    <div class="controls">
      <button :class="{ active: wordwrap }" @click="toggle_wordwrap">word-wrap</button>
    </div>
    <a class="btn" href="https://github.com/hyrious/npm-browser" target="_blank" title="hyrious/npm-browser">
      <i class="i-mdi-github"></i>
    </a>
    <button class="btn-share" title="share" @click="share()">
      <i class="i-mdi-share-variant"></i>
    </button>
  </header>
  <aside class="searching" v-show="searching">
    <ul v-if="searchResult.length > 0">
      <li v-for="(pkg, i) in searchResult" :key="pkg.name" @click="choose(pkg)" :title="pkg.description"
        :class="{ active: searchResultIndex === i }">
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

.site-title,
.site-title-sm {
  padding: 0;
  padding-right: 0.75ch;
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
  z-index: 200;

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
    border: 0;
    text-decoration: none;
    color: var(--fg);
    display: inline-flex;
    align-items: center;
    padding: 4px 4px 4px 12px;
    cursor: pointer;

    &:hover,
    &.active {
      color: var(--fg-on);
    }

    &:disabled {
      cursor: wait;
    }
  }
}

.splitter {
  flex: 1;
}

.hint {
  font-family: var(--sans);
  color: var(--fg-on);

  +span {
    font-family: var(--sans);
    color: var(--fg);
    padding-left: 4px;

    kbd {
      font-style: normal;
      background: var(--bg-on);
      margin-left: 2px;
      padding: 0 2px;
      border-radius: 2px;
      border-bottom: 2px solid var(--border);
    }
  }
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
  padding-right: 0.75ch;
}

input {
  border: 0;
  outline: 0;
  line-height: 1.5;
  min-width: 3.5ch;
  padding: 0 0.25ch;
  color: var(--fg-on);
  text-decoration: underline dashed;
  text-underline-position: under;

  &:focus-visible {
    background-color: var(--bg-on);
    text-decoration: none;
  }

  &.inputting {
    text-decoration: none;
  }
}

select {
  border: 0;
  outline: 0;
  padding: 0 0.25ch;
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

      &:hover,
      &.active {
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

.diff-versions {
  display: flex;
  flex-flow: column nowrap;

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;

    &:hover {
      background-color: var(--bg-on);
    }
  }

  i {
    width: 16px;
    height: 16px;
  }

  >span,
  >i {
    pointer-events: none;
  }
}

.full-text-search {
  .row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px;

    label {
      font-size: 14px;
    }

    input {
      padding: 2px 4px;
      border: revert;
      background: revert;
      font-size: 14px;
    }

    button {
      appearance: revert;
      padding: revert;
      border: revert;
      background: revert;
      font-family: var(--sans);
      color: var(--fg-on);
      font-size: 14px;
    }
  }

  output {
    display: block;
    font-size: 14px;

    h4 {
      position: sticky;
      top: -1px;
      margin: 0;
      padding: 0 8px 1px;
      line-height: 24px;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      font-weight: normal;
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--fg-on);
      font-family: var(--sans);

      i {
        width: 16px;
        height: 16px;
      }

      button {
        display: block;
        width: 100%;
        padding: 0;

        &:hover {
          background: var(--bg);
        }
      }

      &:has(.collapsed) {
        border-bottom: 0;
      }
    }

    button {
      display: block;
      width: 100%;
      padding: 0 4px;
      white-space: pre;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--fg);
      text-align: left;
      line-height: 1.5;

      &:hover {
        color: var(--fg-on);
        background: var(--bg-on);
      }
    }

    h4:has(.collapsed)~button {
      display: none;
    }

    p {
      margin: 0;
      padding: 4px 8px 8px;
    }
  }
}

.information-panel {
  position: absolute;
  top: 44px;
  left: 65px;
  max-width: 400px;
  max-height: 400px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  background: var(--bg);
  z-index: 9999;
  padding: 8px;
  user-select: none;
  pointer-events: 0;
  display: flex;
  flex-flow: row wrap;
  gap: 8px;
}

.site-title-sm {
  display: none;
}

@media (max-width: 720px) {
  header {

    .btn,
    button,
    .hint {
      display: none;
    }

    .site-title-sm,
    .btn-share {
      display: inline-flex;
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
