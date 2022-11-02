<script lang="ts" setup>
import { disposable } from "@hyrious/utils";
import { CSSProperties } from "vue";
import { watchBoundingClientRect } from "../helpers/bounding";

const props = withDefaults(
  defineProps<{
    fromEl: HTMLElement | null;
    toEl: HTMLElement | null;
  }>(),
  {
    fromEl: null,
    toEl: null,
  }
);

interface Point {
  x: number;
  y: number;
}

const from = ref<Point>({ x: 0, y: 0 });
const to = ref<Point>({ x: 0, y: 0 });

onMounted(() => {
  const { push, flush } = disposable();
  push(
    watch(
      () => props.fromEl,
      (el, _, onCleanup) => {
        el &&
          onCleanup(
            watchBoundingClientRect(el, (rect) => {
              from.value.x = rect.left;
              from.value.y = rect.top + rect.height / 2;
            })
          );
      }
    )
  );
  push(
    watch(
      () => props.toEl,
      (el, _, onCleanup) => {
        el &&
          onCleanup(
            watchBoundingClientRect(el, (rect) => {
              to.value.x = rect.left + rect.width / 2;
              to.value.y = rect.bottom;
            })
          );
      }
    )
  );
  return flush;
});

const width = computed(() => Math.max(from.value.x, to.value.x) + 36);
const height = computed(() => from.value.y - 36);

const style = computed<CSSProperties>(() => {
  const { fromEl, toEl } = props;
  if (!fromEl || !toEl) return {};

  return {
    "--top": "36px",
    "--left": "0px",
    "--width": width.value + "px",
    "--height": height.value + "px",
  };
});

const viewBox = computed<string>(() => {
  return `0 0 ${width.value} ${height.value}`;
});

const pathA = computed<string>(() => {
  const x = to.value.x + 4;
  const y = to.value.y - 32;
  return `M${x},${y} l-5,10 10,0 -5,-10`;
});

const pathD = computed<string>(() => {
  const x = to.value.x + 4;
  const y = to.value.y - 32;
  const dx = from.value.x;
  const dy = from.value.y - 36 - 5;
  return `M${x},${y} C${x},${y + 100} ${dx - 100},${dy} ${dx},${dy}`;
});
</script>

<template>
  <svg v-if="props.fromEl && props.toEl" class="arrow" :style="style" fill="none" stroke="currentColor" stroke-width="3"
    stroke-linecap="round" :viewBox="viewBox">
    <path :d="pathA" fill="currentColor" />
    <path :d="pathD" />
  </svg>
</template>

<style lang="scss" scoped>
.arrow {
  position: fixed;
  top: var(--top);
  left: var(--left);
  width: var(--width);
  height: var(--height);
  z-index: 1000;
  pointer-events: none;
}

@media (max-width: 720px) {
  .arrow {
    display: none;
  }
}
</style>
