<script setup lang="ts">
  const AsyncEditor = defineAsyncComponent(() => import('./Editor.vue'))
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

<style lang="scss" scoped></style>
