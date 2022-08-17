<script setup lang="ts">
import { FileEntry } from '../helpers/construct'

export interface Props {
  node: FileEntry
}

const props = withDefaults(defineProps<Props>(), {
  node: () => ({ name: '', path: '', collapsed: false })
})

const app = useApplicationStore()

const name = computed(() => props.node.name)
const path = computed(() => props.node.path)
const folder = computed(() => props.node.children)
const selected = computed(() => props.node.path === app.path)
const collapsed = computed(() => props.node.collapsed)

function select() {
  if (folder.value) {
    props.node.collapsed = !collapsed.value
  } else {
    app.path = path.value
  }
}
</script>

<template>
  <li :class="{ folder, file: !folder, collapsed }">
    <div @click="select()" :class="{ selected }">
      <i v-if="folder" class="i-mdi-chevron-right"></i>
      <i v-else class="i-mdi-file"></i>
      <label>{{ name }}</label>
    </div>
    <ul v-if="!collapsed && props.node.children">
      <File v-for="child in props.node.children" :node="child" />
    </ul>
  </li>
</template>

<style lang="scss" scoped>
li {
  position: relative;
  line-height: 22px;
}

div {
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover,
  &.selected {
    background: var(--bg-on);
  }
}

label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style>
