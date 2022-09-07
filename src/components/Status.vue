<script setup lang="ts">
import { disposable } from '@hyrious/utils';
import { events } from '~/helpers/events';

let id = 0
const messages = ref<{ id: number, text: string }[]>([])
const statuses = ref<{ [key: string]: string }>({})
const status_keys = computed(() => Object.keys(statuses.value))

function add(text: string) {
  messages.value.push({ id: id++, text })
}

function remove() {
  messages.value.shift()
}

onMounted(() => {
  const { push, flush } = disposable()
  push(events.on("message", msg => {
    add(msg)
    setTimeout(remove, 3000)
  }))
  push(events.on("status-on", ([key, name]) => {
    statuses.value[key] = name
  }))
  push(events.on("status-off", (key) => {
    delete statuses.value[key]
  }))
  return flush
})
</script>

<template>
  <TransitionGroup name="list" tag="ul" class="status fixed p-0 m-0">
    <li class="status-item b p-2" v-for="msg in messages" :key="msg.id">
      {{$t(msg.text)}}
    </li>
    <li class="status-item b p-2" v-for="key in status_keys" :key="key">
      {{$t(key, {name: statuses[key]})}}
    </li>
  </TransitionGroup>
</template>

<style lang="scss">
.status {
  left: 1rem;
  bottom: 1rem;
  list-style-type: none;
  font-size: 0.9rem;
}

.status-item {
  width: fit-content;
  white-space: nowrap;
  border-color: var(--border);
  box-shadow: var(--shadow);
  margin-top: 0.5rem;
  background-color: var(--bg);
}

.list-move,
.list-enter-active {
  transition: all 0.2s ease;
}

.list-leave-active {
  transition: opacity 0.2s, transform 1s;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-to {
  opacity: 0;
}

.list-leave-active {
  position: absolute;
}
</style>
