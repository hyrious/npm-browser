/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "js-untar" {
  export interface File {
    name: string;
    buffer: ArrayBuffer;
    size: number; // equal to buffer.byteLength
  }
  interface ProgressivePromise<T> extends Promise<T> {
    progress(callback: (file: File) => void): this;
  }
  function untar(buffer: ArrayBuffer): ProgressivePromise<File[]>;
  export default untar;
}

declare module "@highlightjs/cdn-assets/es/highlight.js" {
  declare const hljs: typeof import("highlight.js").default;
  export default hljs;
}
