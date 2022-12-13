<script setup lang="ts">
import { statusText } from "../stores/status";
</script>

<template>
  <footer v-if="statusText">{{ statusText }}</footer>
</template>

<style lang="scss" scoped>
footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--bg);
  border-top: 1px solid var(--border);
  padding: 0.5rem 1rem;
  font-size: 14px;
}
</style>
