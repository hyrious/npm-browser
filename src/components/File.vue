<script setup lang="ts">
import prettyBytes from "pretty-bytes";
import { FileEntry } from "../helpers/construct";
import { events } from "../helpers/events";
import FileIcon from "./FileIcon.vue";

export interface Props {
  node: FileEntry;
}

const props = withDefaults(defineProps<Props>(), {
  node: () => ({ name: "", path: "", collapsed: false }),
});

const app = useApplicationStore();

const name = computed(() => props.node.name);
const path = computed(() => props.node.path);
const folder = computed(() => props.node.children);
const selected = computed(() => props.node.path === app.path);
const collapsed = computed(() => props.node.collapsed);

const size = computed(() => !folder.value && filesMap.value.get(path.value.slice(1))?.buffer.byteLength)

function select(ev: MouseEvent) {
  if (ev.metaKey || ev.ctrlKey) {
    const p = path.value + (folder.value ? "/" : "");
    events.emit("jsdelivr", { ev, path: p });
    return;
  }
  if (folder.value) {
    props.node.collapsed = !collapsed.value;
  } else if (app.path !== path.value) {
    app.path = path.value;
    app.line = lineCache.get(app.packageName + app.path) || 0;
  } else {
    app.path = "";
  }
}
</script>

<template>
  <li :class="{ folder, file: !folder, collapsed }">
    <div @click="select($event)" :class="{ selected }">
      <i v-if="folder" :class="collapsed ? 'i-mdi-chevron-right' : 'i-mdi-chevron-down'"></i>
      <FileIcon v-if="!folder" :name="name" :folder="folder" />
      <label>{{ name }}</label>
      <small v-if="size">{{ prettyBytes(size, { binary: true }) }}</small>
    </div>
    <ul v-if="!collapsed && props.node.children">
      <File v-for="child in props.node.children" :node="child" />
    </ul>
  </li>
</template>

<style lang="scss" scoped>
li {
  position: relative;
  line-height: 25px;
}

div {
  display: flex;
  align-items: center;
  margin: 0 -4px;
  padding: 0 4px;
  gap: 4px;

  &:hover,
  &.selected {
    background: var(--bg-on);
  }

  @media (max-width: 720px) {
    &:hover {
      background: transparent;
    }

    &.selected {
      background: var(--bg-on);
    }
  }
}

label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

small {
  color: var(--pre-dim);
  font-variant-numeric: tabular-nums;
}

.selected>label,
.selected>small {
  color: var(--fg-on);
}

i {
  display: inline-block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

ul {
  list-style-type: none;
  margin: 0;
  padding: 0 0 0 16px;
}

@media (max-width: 720px) {
  li {
    line-height: 32px;
  }
}
</style>
