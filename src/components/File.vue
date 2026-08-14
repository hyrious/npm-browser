<script setup lang="ts">
import prettyBytes from "pretty-bytes";
import type { FileEntry } from "../helpers/construct";
import { events } from "../helpers/events";
import FileIcon from "./FileIcon.vue";

export interface Props {
  node: FileEntry;
  depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  node: () => ({ name: "", path: "", collapsed: false }),
  depth: 0,
});

const app = useApplicationStore();

const name = computed(() => props.node.name);
const path = computed(() => props.node.path);
const folder = computed(() => props.node.children);
const selected = computed(() => props.node.path === app.path);
const collapsed = computed(() => props.node.collapsed);

function sum(children: FileEntry[] | undefined): number {
  if (!children) return 0;
  return children.reduce((acc, child) => {
    if (child.children) {
      return acc + sum(child.children);
    } else {
      return acc + (filesMap.value.get(child.path.slice(1))?.buffer.byteLength || 0);
    }
  }, 0);
}

const size = computed(() => {
  if (folder.value) {
    return sum(props.node.children);
  } else {
    return filesMap.value.get(path.value.slice(1))?.buffer.byteLength;
  }
})

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
    [app.line, app.lineTo] = lineCache.get(app.packageName + app.path) || [0, -1];
  } else {
    app.path = "";
  }
}
</script>

<template>
  <li :class="{ folder, file: !folder, collapsed }" :style="{ paddingLeft: `${12 + props.depth * 8}px` }">
    <div :title="name" @click="select($event)" :class="{ selected }">
      <i v-if="folder" :class="collapsed ? 'i-mdi-chevron-right' : 'i-mdi-chevron-down'"></i>
      <FileIcon v-if="!folder" :name="name" :folder="folder" />
      <label>{{ name }}</label>
      <small v-if="typeof size === 'number'">{{ prettyBytes(size, { binary: true }) }}</small>
    </div>
  </li>
</template>

<style lang="scss" scoped>
li {
  position: absolute;
  left: 0;
  right: 0;
  height: 25px;
  padding-right: 8px;
  line-height: 25px;
  box-sizing: border-box;
  will-change: transform;
}

div {
  display: flex;
  align-items: center;
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

@media (max-width: 720px) {
  li {
    height: 32px;
    line-height: 32px;
  }
}
</style>
