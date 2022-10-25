import HljsWorker from "./hljs.worker?worker";
import { observable } from "@hyrious/utils";

const hljs = new HljsWorker();

interface Payload {
  id: number;
  code: string;
  lang?: string;
}

interface Result {
  id: number;
  value: string;
}

const Tasks = new Map<number, (value: string) => void>();

let id = 1;

hljs.addEventListener("message", (ev: MessageEvent<Result>) => {
  const { id, value } = ev.data;
  if (Tasks.has(id)) {
    Tasks.get(id)!(value);
    Tasks.delete(id);
  }
});

function noop() {}

export function highlight(code: string, lang: string, lineno?: boolean) {
  if (!hljs) return new Promise<string>(noop);
  let resolve!: (value: string) => void;
  const task = new Promise<string>((r) => (resolve = r));
  Tasks.set(id, resolve);
  hljs.postMessage(<Payload>{ id, code, lang });
  id++;
  return lineno ? task.then(applyLineNumbers) : task;
}

const COMMENT_RE = /<span class="hljs-comment">(.|\n)*?<\/span>/g;

// https://gist.github.com/hackjutsu/0a6338d66f4fd7d338fd0c04f3454394
function applyLineNumbers(html: string) {
  html = html.replace(COMMENT_RE, (data) => data.replace(/\r?\n/g, () => `\n<span class="hljs-comment">`));
  html = html
    .split(/\r?\n/)
    .map(
      (line, index) =>
        `<tr data-line="${index + 1}">` +
        `<td class="hljs-line-number" data-lineno="${index + 1}"></td><td>${line}</td>` +
        `</tr>`
    )
    .join("");
  return `<table class="hljs-code-table">${html}</table>`;
}

class ActionTask {
  cancelled = false;
  constructor(readonly node: HTMLPreElement, readonly token: number) {}
  replaceInnerHTML = (html: string) => {
    clearTimeout(this.token);
    if (!this.cancelled) {
      this.node.innerHTML = html;
      emitter.emit("highlighted", true);
    }
  };
  cancel() {
    clearTimeout(this.token);
    this.cancelled = true;
  }
}

let last: ActionTask | null = null;
export function update(pre: HTMLPreElement, code: string, lang: string, lineno?: boolean) {
  emitter.emit("highlighted", false);
  if (last) {
    last.cancel();
    last = null;
  }
  if (code) {
    last = new ActionTask(
      pre,
      setTimeout(() => {
        pre.innerText = code;
      }, 50)
    );
    highlight(code, lang, lineno).then(last.replaceInnerHTML);
  } else {
    pre.innerText = code;
  }
}

export const emitter = observable({ update: void 0, highlighted: true });
