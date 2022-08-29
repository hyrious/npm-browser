import { presetIcons, presetMini, transformerDirectives } from "unocss";
import { defineConfig } from "unocss/vite";
import fileIcons from "./scripts/file-icons.json";

export default defineConfig({
  presets: [
    presetIcons({
      scale: 1.2,
      collections: {
        file: fileIcons,
      },
    }),
    presetMini(),
  ],
  transformers: [transformerDirectives()],
});
