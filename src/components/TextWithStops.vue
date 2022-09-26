<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    text: string;
    stops?: number[];
  }>(),
  { text: "" }
);

interface Part {
  bold?: true;
  text: string;
}

const parts = computed<Part[]>(() => {
  if (!props.stops || props.stops.length === 0) {
    return [props];
  }

  const str = props.text;
  const parts: Part[] = [];
  let last = 0;
  for (const stop of props.stops) {
    if (stop > last) {
      parts.push({ text: str.slice(last, stop) });
    }
    parts.push({ bold: true, text: str[stop] });
    last = stop + 1;
  }
  if (last < str.length) {
    parts.push({ text: str.slice(last) });
  }

  return parts;
});
</script>

<template>
  <span v-if="!props.stops || props.stops.length === 0">{{ props.text }}</span>
  <template v-else>
    <span v-for="part in parts" :class="{ bold: part.bold }">
      {{ part.text }}
    </span>
  </template>
</template>

<style lang="scss" scoped>
.bold {
  font-weight: bold;
  color: var(--fg-on);
}
</style>
