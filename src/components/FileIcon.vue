<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string }>(), {
  name: "",
});

const ext = computed(() => {
  const index = props.name.lastIndexOf(".");
  return index > -1 ? props.name.slice(index + 1).toLowerCase() : "";
});
</script>

<template>
  <i v-if="ext === 'vue'" class="i-file-vue"></i>
  <i v-else-if="ext === 'svelte'" class="i-file-svelte"></i>
  <i v-else-if="ext.endsWith('ts') || ext === 'tsx'" class="i-file-typescript"></i>
  <i v-else-if="ext.endsWith('js')" class="i-file-js"></i>
  <i v-else-if="ext === 'jsx'" class="i-file-jsx"></i>
  <i v-else-if="ext === 'css'" class="i-file-css"></i>
  <i v-else-if="ext === 'scss'" class="i-file-scss"></i>
  <i v-else-if="ext === 'html'" class="i-file-html"></i>
  <i v-else-if="ext === 'json' || ext === 'map'" class="i-file-json"></i>
  <i v-else-if="ext === 'md' || ext === 'markdown'" class="i-file-markdown"></i>
  <i v-else-if="ext === 'yml' || ext === 'yaml'" class="i-file-yaml"></i>
  <i v-else-if="ext === 'xml'" class="i-file-xml"></i>
  <i v-else-if="ext === 'txt'" class="i-file-text"></i>
  <i v-else class="i-file-text"></i>
</template>
