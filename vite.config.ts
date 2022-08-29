import path from "path";

import Vue from "@vitejs/plugin-vue";
import Unocss from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import VueI18n from "@intlify/vite-plugin-vue-i18n";

import { defineConfig } from "vite";

export default defineConfig({
  base: "",

  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "src")}/`,
    },
  },

  plugins: [
    Vue(),

    Unocss(),

    AutoImport({
      imports: ["vue"],
      dirs: ["src/composables"],
      dts: "src/auto-imports.d.ts",
      vueTemplate: true,
    }),

    Components({
      dts: "src/components.d.ts",
    }),

    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [path.resolve(__dirname, "src/locales/**")],
    }),
  ],

  build: {
    sourcemap: true,
  },

  esbuild: {
    legalComments: "none",
  },
});
