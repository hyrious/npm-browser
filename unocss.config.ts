import { presetIcons } from "unocss";
import { defineConfig } from "unocss/vite";

export default defineConfig({
  presets: [
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
});
