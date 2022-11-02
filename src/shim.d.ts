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
  }
  export default function untar(buffer: ArrayBuffer): Promise<File[]> & {
    progress(callback: (file: File) => void): Promise<File[]>;
  };
}

declare module "@highlightjs/cdn-assets/es/highlight.js" {
  declare const hljs: typeof import("highlight.js").default;
  export default hljs;
}

declare module "@highlightjs/cdn-assets/es/languages/*.js" {
  declare const lang: Parameters<typeof import("highlight.js").default["registerLanguage"]>[1];
  export default lang;
}
