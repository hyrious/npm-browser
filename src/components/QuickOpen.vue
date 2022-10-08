<script lang="ts" setup>
import { match_trace } from "@hyrious/fuzzy-match";
import { clamp, disposable, _ } from "@hyrious/utils";
import { listen, querySelector } from "@wopjs/dom";
import { events } from "../helpers/events";
import { files } from "../stores/code";
import TextWithStops from "./TextWithStops.vue";

const app = useApplicationStore();
const pattern = ref("");
const keyboardIndex = ref(-1);
const open = ref(false);

onMounted(() => {
  const { push, flush } = disposable();
  function ctrl_p(ev: KeyboardEvent) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "p") {
      ev.stopImmediatePropagation();
      ev.preventDefault();
      open.value = !open.value;
      if (open.value) {
        keyboardIndex.value = -1;
        pattern.value = "";
        nextTick(() => {
          querySelector<HTMLInputElement>("#ctrl_p")?.focus();
        });
      }
    } else if (ev.key === "Escape" && open.value) {
      open.value = false;
    }
  }
  push(listen(document.body, "keydown", ctrl_p, { capture: true }));
  push(
    watch([pattern, keyboardIndex], ([p, i]) => {
      if (p && i === -1) {
        keyboardIndex.value = 0;
      } else if (!p && i !== -1) {
        keyboardIndex.value = -1;
      }
    })
  );
  function alt_r(ev: KeyboardEvent) {
    if (ev.altKey && (ev.key === "r" || ev.key === "®")) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
      events.emit("jump", app.path);
    }
  }
  push(listen(document.body, "keydown", alt_r, { capture: true }));
  return flush;
});

interface FilteredFile {
  score?: number;
  name: string;
  name_stops?: number[];
  path: string;
  path_stops?: number[];
}

function basename(path: string) {
  return path.split("/").pop()!;
}

function strip_root(path: string) {
  const prefix = root_folder.value;
  let subpath = path;
  if (subpath.startsWith(prefix)) {
    subpath = subpath.slice(prefix.length + 1);
  }
  return subpath;
}

const MAX_ITEMS = 100;

const filtered = computed<FilteredFile[]>(() => {
  if (!pattern.value) {
    return files.value.slice(0, MAX_ITEMS).map((f) => ({
      name: basename(f.name),
      path: strip_root(f.name),
    }));
  }

  const pat = pattern.value;
  const result: FilteredFile[] = [];
  for (const f of files.value) {
    const name = basename(f.name);
    const path = strip_root(f.name);

    const m1 = match_trace(pat, name);
    const m2 = match_trace(pat, path);
    let score = -Infinity;
    if (m1) {
      score = m1.score;
    }
    if (m2) {
      score = Math.max(score, m2.score);
    }

    if (m1 || m2) {
      result.push({
        score,
        name,
        name_stops: m1?.stops,
        path,
        path_stops: m2?.stops,
      });
    }
  }
  result.sort((a, b) => {
    if (a.score === _ && b.score === _) {
      return a.path.localeCompare(b.path);
    }
    if (a.score === _) {
      return 200;
    }
    if (b.score === _) {
      return -200;
    }
    const diff = b.score - a.score;
    return diff === 0 ? a.path.localeCompare(b.path) : diff;
  });

  return result.slice(0, MAX_ITEMS);
});

function listen_keyboard(ev: KeyboardEvent) {
  let arrow = false;

  const i = keyboardIndex.value;
  const size = filtered.value.length;
  if (ev.key === "ArrowUp") {
    arrow = true;
    keyboardIndex.value = i === -1 ? size - 1 : (i + size - 1) % size;
  } else if (ev.key === "ArrowDown") {
    arrow = true;
    keyboardIndex.value = i === -1 ? 0 : (i + 1) % size;
  }
  if (arrow) {
    ev.preventDefault();
    return nextTick(() => {
      const el = querySelector(".quick-open .active");
      el && el.scrollIntoView({ block: "nearest" });
    });
  }

  if (ev.key === "Enter") {
    select();
  }
}

function select(i?: number) {
  const f = filtered.value[i ?? clamp(keyboardIndex.value, 0, filtered.value.length - 1)];
  if (f) {
    app.path = "/" + root_folder.value + "/" + f.path;
    events.emit("jump", app.path);
  }
  open.value = false;
}
</script>

<template>
  <section v-if="open" class="quick-open">
    <header>
      <input
        id="ctrl_p"
        v-model="pattern"
        autocomplete="off"
        spellcheck="false"
        @keydown="listen_keyboard($event)"
      />
    </header>
    <ul>
      <li
        v-for="(file, i) in filtered"
        :key="file.path"
        :class="{ active: keyboardIndex === i }"
        :data-score="file.score"
        @click="select(i)"
      >
        <h4>
          <TextWithStops :text="file.name" :stops="file.name_stops" />
        </h4>
        <p>
          <TextWithStops :text="file.path" :stops="file.path_stops" />
        </p>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.quick-open {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  margin: 0 auto;
  max-width: 400px;
  max-height: 400px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  background: var(--bg-panel);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
}

header {
  padding: 4px;
}

input {
  display: block;
  width: 100%;
  padding: 4px;
  outline: none;
  border: revert;
  background: revert;
  font-size: 14px;
  color: var(--fg-on);
}

ul {
  flex: 1;
  margin: 0;
  padding: 0 4px 4px;
  list-style-type: none;
  overflow-y: auto;
}

li {
  padding: 4px 6px;
  border-radius: 2px;
  cursor: pointer;
  user-select: none;
}

li.active,
li:hover {
  background: var(--bg-panel-on);
}

h4 {
  color: var(--fg);
  font-weight: normal;
  font-size: 14px;
}

p {
  font-size: 13px;
  opacity: 0.8;
}

h4,
p {
  margin: 0;
  line-height: 1.4;
}

li.active,
li:hover {
  h4 {
    color: var(--fg-on);
  }

  p {
    opacity: 1;
  }
}
</style>
