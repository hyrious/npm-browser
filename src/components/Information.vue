<script setup lang="ts">
import { storeToRefs } from "pinia";
import { desc, repo } from "../stores/repo"
const { packageName, packageVersion } = storeToRefs(useApplicationStore());

const weeklyDownloads = computed(() => `https://img.shields.io/npm/dw/${packageName.value}`);
const bundlephobia = computed(
  () => `https://img.shields.io/bundlephobia/minzip/${packageName.value}/${packageVersion.value}`
);
const stars = computed(() => `https://img.shields.io/github/stars/${repo.value}`);

</script>

<template v-if="packageName && packageVersion">
  <p v-if="desc" class="desc">{{ desc }}</p>
  <a :href="'https://www.npmjs.com/package/' + packageName" target="_blank" rel="noopener noreferrer">
    <img :src="weeklyDownloads" alt="" />
  </a>
  <a
    :href="'https://bundlephobia.com/package/' + packageName + '@' + packageVersion"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img :src="bundlephobia" alt="" />
  </a>
  <a v-if="repo" :title="repo" :href="'https://github.com/' + repo" target="_blank" rel="noopener noreferrer">
    <img :src="stars" :alt="repo" />
  </a>
</template>

<style lang="scss" scoped>
.desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  font-family: var(--sans);
  flex-basis: 100%;
}
</style>
