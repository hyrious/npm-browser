<script setup lang="ts">
import { statusText } from '../stores/status';
</script>

<template>
  <footer v-show="statusText">{{ statusText }}</footer>
</template>

<style lang="scss" scoped>
footer {
  position: sticky;
  top: 100vh;
  border-top: 1px solid var(--border);
}
</style>
