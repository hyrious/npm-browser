import { defineConfig, presetAttributify, presetIcons, presetWind3 as presetUno } from 'unocss';

export default defineConfig({
  presets: [
    presetUno({ dark: 'media' }),
    presetIcons(),
    presetAttributify(),
  ],
});
