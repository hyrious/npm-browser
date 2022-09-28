<script setup lang="ts">
import { storeToRefs } from "pinia";
import prettyBytes from "pretty-bytes";
import { listen, querySelector } from "@wopjs/dom";
import { disposable, wait } from "@hyrious/utils";
import { construct, FileEntry } from "../helpers/construct";
import { get, set, cached, remove, removeAll } from "../helpers/idb";
import { events } from "../helpers/events";
import { normalize_git_repo } from "../helpers/utils";
import { fetch_with_mirror_retry } from "../helpers/fetch-mirror";

const { packageName, packageVersion, path } = storeToRefs(useApplicationStore());
const root = ref<FileEntry | null>(null);
const history = ref<string[]>([]);
const fetching = ref(false);
const nameVersion = computed(
  () => packageName.value && packageVersion.value && `${packageName.value}@${packageVersion.value}`
);
const size = ref(0);
const sizePretty = computed(() => nameVersion.value && prettyBytes(size.value));
const packedSize = ref(0);
const packedSizePretty = computed(() => nameVersion.value && prettyBytes(packedSize.value));

function refresh_history() {
  cached().then((keys) => {
    history.value = keys as string[];
  });
}

onMounted(refresh_history);

let timer = 0;
let abortController: AbortController | null = null;
function debouncedFetchPackage(name: string, version: string) {
  clearTimeout(timer);
  abortController && abortController.abort();
  if (name && version) {
    setTimeout(fetchPackage, 200, name, version);
  }
}

watchEffect(() => {
  debouncedFetchPackage(packageName.value, packageVersion.value);
});

const extractPackageP = import("../helpers/untar");
async function fetchPackage(name: string, version: string) {
  fetching.value = true;
  root.value = null;
  let buffer: ArrayBuffer;

  try {
    const cached = await get(name, version);
    if (cached) {
      buffer = cached.buffer;
    } else {
      abortController = new AbortController();
      buffer = await fetch_with_mirror_retry(
        `https://registry.npmjs.org/${name}/-/${name.split("/").pop()}-${version}.tgz`,
        { signal: abortController.signal }
      ).then((r) => r.arrayBuffer());
      await set(name, version, new Uint8Array(buffer));
    }
  } catch (e) {
    fetching.value = false;
    if (e.name === "AbortError") return;
    statusMessage(e.message);
    throw e;
  }

  packedSize.value = buffer.byteLength;

  try {
    let totalSize = 0;
    const { default: extractPackage } = await extractPackageP;
    const nodes = await extractPackage(buffer, (file) => {
      statusMessage("Extracting " + file.name);
      totalSize += file.buffer.byteLength;
    });
    size.value = totalSize;
    files.value = nodes;
    statusMessage("");
    root.value = (construct(
      nodes.map((e) => e.name),
      path.value
    ).children || [])[0];
    const selected = path.value.slice(1);
    if (!nodes.some((e) => e.name === selected)) {
      path.value = "";
    }
  } catch (e) {
    fetching.value = false;
    if (e.name === "AbortError") return;
    statusMessage(e.message);
    throw e;
  }

  fetching.value = false;
  focus_in_sidebar();
}

async function focus_in_sidebar() {
  // wait until sidebar refresh
  await wait(100);
  const el = querySelector(".selected");
  el && el.scrollIntoView({ block: "center" });
}

onMounted(() => {
  const { push, flush } = disposable();
  push(
    listen(document.body, "keydown", (e) => {
      if (e.target === document.body && e.key === ".") {
        const pkg = files.value.find((e) => e.name === root_folder.value + "/package.json");
        const buffer = pkg?.buffer;
        const json = buffer && JSON.parse(new TextDecoder().decode(buffer));
        json && open_homepage(json);
      }
      if (e.target === document.body && e.key === ",") {
        const pkg = files.value.find((e) => e.name === root_folder.value + "/package.json");
        const buffer = pkg?.buffer;
        const json = buffer && JSON.parse(new TextDecoder().decode(buffer));
        json && open_github(json);
      }
    })
  );
  push(
    events.on("jump", (location) => {
      const parts = location.split("/").slice(2);
      let node: FileEntry | null | undefined = root.value;
      parts.forEach((name) => {
        if (!node) return;
        node = node.children?.find((e) => e.name === name);
        if (node) node.collapsed = false;
      });
      focus_in_sidebar();
    })
  );
  return flush;
});

function open_github(json: any) {
  let repo = json.repository;
  let normalized = "";
  if (typeof repo === "string") normalized = normalize_git_repo(repo);
  if (typeof repo === "object" && repo.type === "git") normalized = normalize_git_repo(repo.url);
  if (normalized) {
    const url = "https://github.com/" + normalized;
    open(url, "_blank");
  }
}

function open_homepage(json: any) {
  if (typeof json.homepage === "string") {
    open(json.homepage, "_blank");
  } else if (typeof json.repository === "object") {
    let { url } = json.repository;
    if (typeof url === "string") {
      if (url.startsWith("git+")) {
        url = url.slice(4);
      }
      if (url.endsWith(".git")) {
        url = url.slice(0, -4);
      }
      if (url.startsWith("http")) {
        open(url, "_blank");
      }
    }
  } else if (typeof json.repository === "string") {
    try {
      new URL(json.repository);
      open(json.repository, "_blank");
    } catch {
      const url = "https://github.com/" + json.repository;
      open(url, "_blank");
    }
  } else if (packageName.value.includes("/")) {
    const url = "https://github.com/" + packageName.value.slice(1);
    open(url, "_blank");
  }
}

function choose(nameVersion: string) {
  const parts = nameVersion.split("@");
  let name: string, version: string;
  if (nameVersion[0] === "@") {
    name = "@" + parts[1];
    version = parts[2];
  } else {
    name = parts[0];
    version = parts[1];
  }
  location.search = `?q=${name}@${version}`;
}

function confirm_delete_all() {
  if (confirm("Are you sure you want to delete all cached packages?")) {
    removeAll();
    refresh_history();
  }
}

function fold_all() {
  function traverse(node: FileEntry | null | undefined) {
    if (!node) return;
    node.collapsed = true;
    node.children?.forEach(traverse);
  }
  traverse(root.value);
}
</script>

<template>
  <header v-if="nameVersion && !fetching && size > 0">
    <h3 :title="nameVersion + ' ' + sizePretty">
      <span class="size">{{ sizePretty }} (gzip: {{ packedSizePretty }})</span>
      <button class="fold-all" title="fold all" @click="fold_all()">
        <i class="i-mdi-collapse-all"></i>
      </button>
    </h3>
  </header>
  <ul v-if="root?.children">
    <File v-for="file in root.children" :node="file" />
  </ul>
  <div v-else-if="fetching" class="loading">
    <i class="i-mdi-loading"></i>
    <span>loading&hellip;</span>
  </div>
  <template v-else-if="!nameVersion">
    <h3 class="history-title">
      <span>History</span>
      <button v-if="history.length > 0" @click="confirm_delete_all()" class="history-delete-all">
        <span>Delete All</span>
        <i class="i-mdi-trash-can-outline"></i>
      </button>
    </h3>
    <TransitionGroup name="list" tag="ul" class="cached" v-if="history.length > 0">
      <li v-for="item in history" :key="item" class="history-item">
        <button title="open" @click="choose(item)">{{ item }}</button>
        <button title="delete" class="history-delete-btn" @click="remove(item), refresh_history()">
          <i class="i-mdi-close"></i>
        </button>
      </li>
    </TransitionGroup>
    <p class="no-history" v-else>
      Install your first package<br />
      from the top bar<i class="i-mdi-arrow-up-thin"></i>
    </p>
  </template>
</template>

<style lang="scss" scoped>
h3 {
  margin: 0;
  padding: 6px 16px 4px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  display: flex;
  align-items: center;
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
  flex: 1;
}

.fold-all {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  position: relative;
  cursor: pointer;

  &:hover {
    color: var(--fg-on);
  }

  i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
  }
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

.cached {
  display: flex;
  flex-flow: column nowrap;
}

.history-item {
  position: relative;
  display: flex;
  align-items: center;
  white-space: nowrap;
  margin: 0 -8px;

  button {
    border: 0;
    padding: 4px 8px;
    text-align: left;
    flex: 1;
    cursor: pointer;
  }

  button:hover {
    color: var(--fg-on);
    background-color: var(--bg-on);
  }

  &:hover .history-delete-btn {
    opacity: 1;
  }
}

.history-delete-all {
  border: 0;
  position: absolute;
  top: 0;
  right: 16px;
  bottom: 0;
  font-weight: normal;
  cursor: pointer;

  > span {
    padding-right: 0.25rem;
  }

  &:hover {
    color: var(--fg-on);
    background-color: var(--bg-on);
  }
}

.history-delete-btn {
  position: absolute;
  top: 0;
  right: 4px;
  bottom: 0;
  margin: auto;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  opacity: 0;

  i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

i {
  display: inline-block;
  width: 20px;
  height: 20px;
  vertical-align: text-bottom;
}

.no-history {
  margin: 0;
  padding: 0 16px;
  line-height: 1.5;
}

.list-move,
.list-enter-active {
  transition: all 0.2s ease;
}

.list-leave-active {
  transition: opacity 0.2s, transform 1s;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-to {
  opacity: 0;
}

.list-leave-active {
  position: absolute;
}
</style>
