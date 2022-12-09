<script setup lang="ts">
interface Query {
  // [[from]]: old file
  a?: string
  // [[to]]: new file
  b?: string
  // simplify: number of unchanged lines to keep, others are collapsed, min=1
  s?: string
  // format: l=line-by-line (default), s=side-by-side
  f?: string
}
const search: Query = Object.fromEntries(new URLSearchParams(location.search))


</script>

<template>
  <SplitPane :defaultSplit="50">
    <template #left>
      <p>lorem</p>
    </template>
    <template #right>
      <p>ipsum</p>
    </template>
  </SplitPane>
</template>

<style lang="scss">

</style>
