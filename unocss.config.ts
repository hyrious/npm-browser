import { presetIcons, presetMini, transformerDirectives } from "unocss";
import { defineConfig } from "unocss/vite";
import fileIcons from "./scripts/file-icons.json";

export default defineConfig({
  presets: [
    presetIcons({
      scale: 1.2,
      collections: {
        file: fileIcons,
        mdi: () => import("@iconify-json/mdi/icons.json").then((i) => i.default),
        carbon: () => import("@iconify-json/carbon/icons.json").then((i) => i.default),
      },
    }),
    presetMini(),
  ],
  transformers: [transformerDirectives()],
  shortcuts: {
    "btn-icon": "ml-1 flex-shrink-0 border-0 bg-transparent w-8 h-8 rounded-full cursor-pointer",
  },
});
