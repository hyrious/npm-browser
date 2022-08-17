<!-- derived from https://github.com/vuejs/repl/blob/main/src/SplitPane.vue -->
<script setup lang="ts">
const container = ref()

const state = reactive({
  dragging: false,
  split: 25
})

const boundSplit = computed(() => {
  const { split } = state;
  return split < 20 ? 20 : split > 80 ? 80 : split;
})

let startPosition = 0
let startSplit = 0

function dragStart(e: PointerEvent) {
  state.dragging = true
  startPosition = e.pageX
  startSplit = boundSplit.value
}

function dragMove(e: PointerEvent) {
  if (state.dragging) {
    const position = e.pageX
    const totalSize = container.value.offsetWidth
    const dp = position - startPosition
    state.split = startSplit + ~~((dp / totalSize) * 100)
  }
}

function dragEnd() {
  state.dragging = false
}
</script>

<template>
  <div ref="container" class="split-pane" :class="{ dragging: state.dragging }" @pointermove="dragMove"
    @pointerup="dragEnd" @pointerleave="dragEnd">
    <div class="left" :style="{ width: boundSplit + '%' }">
      <slot name="left"></slot>
      <div class="dragger" @pointerdown.prevent="dragStart"></div>
    </div>
    <div class="right" :style="{ width: 100 - boundSplit + '%' }">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.split-pane {
  flex: 1;
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;

  &.dragging {
    cursor: ew-resize;
  }
}

.dragging .left,
.dragging .right {
  pointer-events: none;
}

.left,
.right {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}

.left {
  border-right: 1px solid var(--border);
}

.dragger {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  right: -5px;
  width: 10px;
  cursor: ew-resize;
}

@media (max-width: 720px) {

  .split-pane {
    flex-direction: column;
    height: auto;
  }

  .left,
  .right {
    width: 100% !important;
    height: 100% !important;
  }

  .left {
    border-right: none;
  }

  .dragger {
    display: none;
  }
}
</style>
