<script setup lang="ts">
import ToggleDark from "./ToggleDark.vue"

import { events, installing } from "~/helpers/events";

const dock = ref(false)
const input_value = ref("")
const pressing_return = usePressing("Enter")
const { searching, results, search } = useSearchNPM()
const show_autocomplete = computed(() => searching.value || results.value.length > 0)

function submit_if_return(ev: KeyboardEvent) {
  if (ev.key === 'Enter') {
    submit()
  }
}

function submit(force?: string) {
  let value = force || input_value.value
  if (force) {
    input_value.value = force
  }
  const trimmed_value = value.trim()
  if (trimmed_value) {
    dock.value = true
    searching.value = false
    results.value = []
    installing(trimmed_value)
  } else {
    events.emit("message", "no-input")
  }
}

watch(input_value, text => {
  search(text.trim())
})
</script>

<template>
  <h1 v-show="!dock" class="logo whitespace-nowrap" @dblclick="dock = true">
    <span class="select-none">NPM Browser</span>
  </h1>
  <header class="relative px-3 flex flex-nowrap h-45px items-center b-b shadow"
    :class="{dock, completing: show_autocomplete}">
    <label for="q" class="whitespace-nowrap select-none font-mono pr-0.75ch" @dblclick="dock = false">npm i</label>
    <input v-model="input_value" id="q" autocomplete="off" placeholder="vue"
      class="px-0.25ch bg-transparent border-0 outline-none font-mono" @keyup="submit_if_return($event)">
    <a v-show="dock" title="hyrious/npm-browser" class="btn-icon" href="https://github.com/hyrious/npm-browser"
      target="_blank" rel="noreferrer">
      <i class="i-mdi-github"></i>
    </a>
    <ToggleDark />
    <button v-if="!dock" :title="$t('press-return-to-continue')" class="btn-return btn-icon b"
      :class="{active: pressing_return}" @click="submit()">
      <i class="i-mdi-keyboard-return"></i>
    </button>
    <ul v-if="show_autocomplete" class="autocomplete absolute top-full left-0 w-full m-0 b px-0">
      <li v-for="item in results" :key="item.name" class="autocomplete-item p-2" @click="submit(item.name)">
        <h3>{{item.name}}</h3>
        <p>{{item.description}}</p>
      </li>
      <li v-if="searching" class="autocomplete-item p-2">
        <p class="searching">
          <i class="i-mdi-loading"></i>
          <span>{{$t('searching')}}</span>
        </p>
      </li>
    </ul>
  </header>
</template>

<style lang="scss">
.logo {
  position: fixed;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  font-weight: 400;
}

header {
  border-bottom-color: var(--border);
}

header:not(.dock) {
  position: fixed;
  top: 45%;
  left: 50%;
  width: max-content;
  max-width: 100%;
  transform: translate(-50%, -50%);
  box-shadow: var(--shadow);
  border-radius: 22px;
  border-bottom-color: transparent;
  padding-left: 1rem;
}

.dark header:not(.dock) {
  background-color: var(--bg-on);
}

header:not(.dock).completing {
  border: 1px solid var(--border);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: var(--fg);
  background-color: var(--bg);
}

#q {
  color: var(--fg-on);
  line-height: 40px;
  width: 100%;
}

.btn-return {
  border-color: var(--fg);
  border-style: dashed;

  &:hover,
  &.active {
    color: var(--fg-on);
    background-color: var(--bg);
    border-color: var(--fg-on);
    border-style: solid;
  }
}

.autocomplete {
  list-style-type: none;
  background-color: var(--bg);
  color: var(--fg);
  border-radius: 0 0 22px 22px;
  border-color: var(--border);
  z-index: 1;
  width: 100%;
  max-height: 40vh;
  overflow-x: hidden;
  overflow-y: auto;
  white-space: nowrap;
}

.autocomplete-item {
  width: 100%;
  line-height: 1.4;
  cursor: pointer;

  &:hover {
    background-color: var(--bg-on);
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    color: var(--fg-on);
  }

  p {
    margin: 0;
    width: 100%;
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;

    &.searching {
      display: flex;
      gap: 1ch;
      font-size: 0.875rem;
    }
  }
}

.i-mdi-loading {
  animation: spin 0.5s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .logo {
    top: 30%;
    font-size: 1.5rem;
  }

  header:not(.dock) {
    border-radius: 0;
  }
}
</style>
