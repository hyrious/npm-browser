import type { File } from "js-untar";

export const files = ref<File[]>([]);

export const root_folder = computed(() => {
  if (files.value.length > 0) {
    const name = files.value[0].name;
    const index = name.indexOf("/");
    return index > 0 ? name.slice(0, index) : "package";
  } else {
    return "package";
  }
});

export const wordwrap = ref(false);

export const lineCache = new Map<string, number>();

// for debugging
Object.assign(window, { files });
