import HljsWorker from "./hljs.worker?worker";

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

hljs.addEventListener("message", (ev) => {
  const { id, value } = ev.data;
  if (Tasks.has(id)) {
    Tasks.get(id)!(value);
    Tasks.delete(id);
  }
});

function noop() {}

export function highlight(code: string, lang?: string) {
  if (!hljs) return new Promise<string>(noop);
  let resolve!: (value: string) => void;
  const task = new Promise<string>((r) => (resolve = r));
  Tasks.set(id, resolve);
  hljs.postMessage(<Payload>{ id, code, lang });
  id++;
  return task;
}

class ActionTask {
  cancelled = false;
  constructor(readonly node: HTMLPreElement, readonly token: number) {}
  replaceInnerHTML = (html: string) => {
    clearTimeout(this.token);
    if (!this.cancelled) {
      this.node.innerHTML = html;
    }
  };
  cancel() {
    clearTimeout(this.token);
    this.cancelled = true;
  }
}

let last: ActionTask | null = null;
export function update(pre: HTMLPreElement, code: string, lang: string) {
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
    highlight(code, lang).then(last.replaceInnerHTML);
  } else {
    pre.innerText = code;
  }
}
