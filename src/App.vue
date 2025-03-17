<script setup lang="ts">
import 'uno.css';
import './style.css';
import SearchBar from './browser/SearchBar.vue';

</script>

<template>
  <header class="nav">
    <SearchBar />
  </header>
</template>

<style>
.nav {
  padding: 20px 32px 0;
}

@media (max-width: 720px) {
  .nav {
    padding: 4px;
  }
}
</style>
