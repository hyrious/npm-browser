import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import Vue from '@vitejs/plugin-vue'
import path from 'path'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '',

  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },

  plugins: [
    Vue(),

    Unocss(),

    AutoImport({
      imports: ['vue', 'vue-i18n', 'vue/macros'],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/stores'],
      vueTemplate: true,
    }),

    Components({
      dts: 'src/components.d.ts',
    }),

    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [path.resolve(__dirname, 'locales/**')],
    }),
  ],

  build: {
    sourcemap: true,
  },

  ssr: {
    noExternal: [/vue-i18n/],
  },
})
