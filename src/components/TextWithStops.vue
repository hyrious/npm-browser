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

  const ranges: [start: number, end: number][] = [];
  let last_range: [start: number, end: number] | null = null;
  for (const stop of props.stops) {
    if (last_range === null) {
      last_range = [stop, stop];
    } else if (stop === last_range[1] + 1) {
      last_range[1] = stop;
    } else {
      ranges.push(last_range);
      last_range = [stop, stop];
    }
  }
  if (last_range) {
    ranges.push(last_range);
  }

  const str = props.text;
  const parts: Part[] = [];
  let last = 0;
  for (const [start, end] of ranges) {
    if (start > last) {
      parts.push({ text: str.slice(last, start) });
    }
    parts.push({ bold: true, text: str.slice(start, end + 1) });
    last = end + 1;
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
