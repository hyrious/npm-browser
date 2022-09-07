<script setup lang="ts">
import { storeToRefs } from "pinia"
import { useAppStore } from "~/composables"

const { dark } = storeToRefs(useAppStore())
</script>

<template>
  <button :title="dark ? $t('theme-dark') : $t('theme-light')" class="btn-icon" @click="dark = !dark">
    <i v-if="dark" class="i-carbon-moon"></i>
    <i v-else class="i-carbon-sun"></i>
  </button>
</template>
