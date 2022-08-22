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

const showRight = ref(false)

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
  <div ref="container" class="split-pane" :class="{ dragging: state.dragging, 'show-right': showRight }"
    @pointermove="dragMove" @pointerup="dragEnd" @pointerleave="dragEnd">
    <div class="left" :style="{ width: boundSplit + '%' }">
      <slot name="left"></slot>
      <div class="dragger" @pointerdown.prevent="dragStart"></div>
    </div>
    <div class="right" :style="{ width: 100 - boundSplit + '%' }">
      <slot name="right"></slot>
    </div>
    <button class="toggler" @click="showRight = !showRight">
      <i class="i-mdi-chevron-left" :class="{ active: showRight }"></i>
      {{ showRight ? 'Explorer' : 'Code' }}
      <i class="i-mdi-chevron-right" :class="{ active: !showRight }"></i>
    </button>
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

.toggler {
  display: none;
}

@media (max-width: 720px) {

  .split-pane {
    display: block;
  }

  .left,
  .right {
    width: 100% !important;
    height: 100% !important;
    padding-bottom: 45px;
    position: absolute;
    top: 0;
    left: 0;
  }

  .left {
    display: block;
  }

  .right {
    display: none;
  }

  .show-right .left {
    display: none;
  }

  .show-right .right {
    display: block;
  }

  .left {
    border-right: none;
  }

  .dragger {
    display: none;
  }

  .toggler {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 45px;
    z-index: 200;
    border: 1px solid var(--border);

    i {
      display: inline-block;
      width: 24px;
      height: 24px;
      color: var(--fg);
      visibility: hidden;

      &.active {
        visibility: visible;
      }
    }
  }
}
</style>
