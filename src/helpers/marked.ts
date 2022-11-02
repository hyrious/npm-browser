let deps: Promise<typeof import("./marked.deps")> | undefined;

let mod: typeof import("./marked.deps") | undefined;

// simplified from https://github.com/hyrious/marked-cli/blob/main/src/index.js
export function renderMarkdown(source: string, to: HTMLElement, baseUrl: string) {
  if (mod) {
    mod.update(source, to, baseUrl);
  } else {
    deps ||= import("./marked.deps");
    to.textContent = "rendering...";
    deps.then((mod_) => (mod = mod_).update(source, to, baseUrl));
  }
}
