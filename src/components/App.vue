<script setup lang="ts">
</script>

<template>
  <Header></Header>
  <SplitPane>
    <template #left>
      <Explorer />
    </template>
    <template #right>
      <Editor />
    </template>
  </SplitPane>
  <Footer></Footer>
</template>

<style lang="scss" scoped>
</style>
