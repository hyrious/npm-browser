<script setup lang="ts">
import type { Vulnerability } from '../helpers/audit';
const { vulnerabilities } = defineProps<{ vulnerabilities: Vulnerability[] }>()
</script>

<template v-if="vulnerabilities.length > 0">
  <p class="vulner" v-for="v in vulnerabilities">
    <span :class="['tag', v.severity]">{{ v.severity }}</span>
    <a class="title" :href="v.url" target="_blank" rel="noopener noreferrer">{{ v.title }}</a>
    <span class="versions">{{ v.vulnerable_versions }}</span>
  </p>
</template>

<style scoped>
.vulner {
  margin: 0;
  font-size: 13px;
  font-family: var(--sans);
}

.tag {
  padding: 0 4px;
  border-radius: 5px;
  background-color: var(--bg-panel-on);
  margin-right: 5px;

  &.info {
    color: #339af0;
  }

  &.low {
    color: #fcc419;
  }

  &.moderate {
    color: #ff922b;
  }

  &.high {
    color: #ff6b6b;
  }

  &.critical {
    color: #cc5de8;
  }
}

.title {
  color: var(--fg-on);
}

.versions {
  font-size: 12px;
  font-family: var(--mono);
  margin-left: 5px;
}
</style>
