import type { File } from "js-untar";

export const files = ref<File[]>([]);

export const wordwrap = ref(false);

// for debugging
Object.assign(window, { files });
