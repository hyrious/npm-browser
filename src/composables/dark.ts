import { listen } from "@wopjs/dom";

// @ts-ignore
const prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)");

/**
 * ```js
 * const dark = useDark()
 * dark.value = !dark.value // toggle dark mode
 * ```
 */
export function useDark() {
  const dark = ref(prefersDark.matches);
  listen(prefersDark, "change", (ev) => (dark.value = ev.matches));
  const classList = document.documentElement.classList;
  watch(dark, classList.toggle.bind(classList, "dark"), { immediate: true });
  return dark;
}
