<script setup lang="ts">
import Loading from './Loading.vue';

const AsyncEditor = defineAsyncComponent({
  loader: () => import('./Editor.vue'),
  loadingComponent: Loading,
})
</script>

<template>
  <Header></Header>
  <SplitPane>
    <template #left>
      <Explorer />
    </template>
    <template #right>
      <AsyncEditor />
      <QuickOpen />
    </template>
  </SplitPane>
  <Footer></Footer>
</template>
