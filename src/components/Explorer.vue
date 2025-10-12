<script setup lang="ts">
import { storeToRefs } from "pinia";
import prettyBytes from "pretty-bytes";
import { listen, querySelector } from "@wopjs/dom";
import { disposable, wait } from "@hyrious/utils";
import { construct, type FileEntry } from "../helpers/construct";
import { get, set, cached, remove, removeAll } from "../helpers/idb";
import { events } from "../helpers/events";
import { get_git_repo } from "../helpers/utils";
import { fetchRegistry } from "../helpers/fetch-mirror";
import { extractPackage, type File } from "../helpers/untar";

const { packageName, packageVersion, path } = storeToRefs(useApplicationStore());
const root = ref<FileEntry | null>(null);
const history = ref<string[]>([]);
const fetching = ref(false);

let lastNameVersion = ""
const nameVersion = computed(() => packageName.value && packageVersion.value && `${packageName.value}@${packageVersion.value}` || lastNameVersion);

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

async function fetchPackage(name: string, version: string) {
  fetching.value = true;
  root.value = null;
  let buffer: ArrayBuffer;
  let url = `https://registry.npmjs.org/${name}/-/${name.split("/").pop()}-${version}.tgz`

  try {
    const cached = await get(name, version);
    if (cached) {
      buffer = cached.buffer;
    } else {
      abortController = new AbortController();
      const response = await fetchRegistry(url, { signal: abortController.signal });
      buffer = await response.arrayBuffer()
      customRegistry || await set(name, version, new Uint8Array(buffer));
    }
  } catch (e) {
    fetching.value = false;
    if (e.name === "AbortError") return;
    statusMessage(url + ': ' + e.message);
    throw e;
  }

  packedSize.value = buffer.byteLength;

  try {
    let totalSize = 0;
    let nodes = await extractPackage(buffer, (file) => {
      statusMessage("Extracting " + file.name);
      totalSize += file.buffer.byteLength;
    });
    size.value = totalSize;
    if (customRegistry === 'jsr') {
      nodes = clean_jsr_files(nodes)
    }
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
    setTimeout(() => events.emit('ready'));
  } catch (e) {
    fetching.value = false;
    if (e.name === "AbortError") return;
    statusMessage(e.message);
    throw e;
  }

  fetching.value = false;
  focus_in_sidebar();
}

function clean_jsr_files(files: File[]): File[] {
  const fileNames = new Set(files.map(f => f.name));
  return files.filter(f => {
    if (f.name.endsWith('.js')) {
      return !fileNames.has(f.name.slice(0, -3) + '.ts');
    }
    if (f.name.endsWith('.js.map')) {
      return !fileNames.has(f.name.slice(0, -7) + '.ts');
    }
    if (f.name.startsWith('package/_dist/')) {
      return false;
    }
    return true;
  });
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
      if ((e.target as HTMLElement).tagName !== "INPUT" && e.key === ".") {
        const pkg = files.value.find((e) => e.name === root_folder.value + "/package.json");
        const buffer = pkg?.buffer;
        const json = buffer && JSON.parse(new TextDecoder().decode(buffer));
        json && open_homepage(json);
      }
      if ((e.target as HTMLElement).tagName !== "INPUT" && e.key === ",") {
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
  const repo = get_git_repo(json)
  if (repo)
    open(repo, "_blank");
  else
    open('https://www.npmjs.com/package/' + packageName.value, "_blank");
}

function open_homepage(json: any) {
  if (json.homepage)
    return open(json.homepage, "_blank");

  open_github(json)
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
  <header v-if="nameVersion && size > 0">
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
    <Transition>
      <TransitionGroup name="list" tag="ul" class="cached" v-if="history.length > 0">
        <li v-for="item in history" :key="item" class="history-item">
          <button class="package" :title="item" @click="choose(item)">{{ item }}</button>
          <button title="delete" class="history-delete-btn" @click="remove(item), refresh_history()">
            <i class="i-mdi-close"></i>
          </button>
        </li>
      </TransitionGroup>
      <p class="no-history" v-else>Empty.</p>
    </Transition>
  </template>
</template>

<style lang="scss" scoped>
h3 {
  margin: 0;
  padding: 6px 8px 4px 0;
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
  padding: 0 0 40px 0;
  list-style-type: none;
  overflow-y: auto;
  height: 100%;

  >li {
    padding-right: 8px;
  }
}

.size {
  flex: 1;
  padding-left: 16px;
}

.history-title {
  padding-left: 16px;
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
  padding-right: 0;

  button {
    border: 0;
    padding: 4px 8px;
    text-align: left;
    flex: 1;
    cursor: default;

    &.package {
      padding-left: 16px;
    }
  }

  button:hover {
    color: var(--fg-on);
    background-color: var(--bg-on);
  }

  &:hover .history-delete-btn {
    opacity: 1;
    background-color: var(--bg-on);
  }
}

.history-delete-all {
  border: 0;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  font-weight: normal;
  cursor: pointer;

  >span {
    padding-right: 0.25rem;
  }

  &:hover {
    color: var(--fg-on);
  }
}

.history-delete-btn {
  position: absolute;
  inset: 0 4px 0 auto;
  margin: auto;
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
  position: absolute;
  top: 28px;
  transform-origin: center center;
  margin: 0;
  padding: 0 16px;
  line-height: 1.5;
}

.v-enter-active,
.v-leave-active {
  transition: all 0.2s ease;
}

.v-enter-from {
  left: -100%;
}

.v-enter-to {
  left: 0%;
}

.v-leave-from {
  transform: scale(1);
}

.v-leave-to {
  transform: scale(0.8);
  opacity: 0;
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
