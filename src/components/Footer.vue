<script setup lang="ts">
import { statusText } from "../stores/status";
</script>

<template>
  <footer v-if="statusText">{{ statusText }}</footer>
</template>

<style lang="scss" scoped>
footer {
  position: sticky;
  top: 100vh;
  border-top: 1px solid var(--border);
  padding: 0.5rem 1rem;
  font-size: 14px;
}
</style>
