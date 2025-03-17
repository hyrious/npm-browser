<script setup lang="ts">
import { ref } from 'vue';
import { $state } from './state';
import { $services } from '../common/service';
import { IRequestService } from '../common/requestService';
import { npmsSuggestions } from '../common/api';
import { createCancelablePromise } from '../common/base';

const placeholder = 'Search package...';

const search = ref('');
const searching = ref(!!$state.name);

function setupSelectAll(event: any) {
  const input = event.currentTarget;
  if (input && document.activeElement !== input) {
    input.setPointerCapture(event.pointerId);
    document.addEventListener('pointerup', function selectAll() {
      if (input.selectionStart === input.selectionEnd) {
        input.select();
      }
      document.removeEventListener('pointerup', selectAll);
    });
  }
}

let searchToken = 0;
function debounceSearch() {
  clearTimeout(searchToken);
  searchToken = setTimeout(doSearch, 300);
}
async function doSearch() {
  searching.value = true;
  const requestService = $services.get(IRequestService);
  npmsSuggestions.searchParams.set('q', search.value);
  const data = await requestService.request({ url: npmsSuggestions.toString() });
  console.log(data);
}
</script>

<template>
  <div class="search-bar">
    <i class="i-carbon:search" />
    <input v-model="search" :placeholder="placeholder" autofocus autocorrect="off" autocapitalize="off" spellcheck="false"
           @pointerdown="setupSelectAll" @input="debounceSearch">
  </div>
</template>

<style>
.search-bar {
  width: max-content;
  display: flex;
  align-items: center;
  padding: 5px 8px;
  position: relative;
  border-radius: 2px;

  &:hover,
  &:focus-within {
    color: var(--fg2);
    background: var(--pre);
  }

  input {
    margin-left: 5px;
    outline: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    background: transparent;
  }
}

@media (max-width: 720px) {
  .search-bar {
    width: 100%;
  }
}
</style>
