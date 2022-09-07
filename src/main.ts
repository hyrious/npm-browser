import "uno.css";
import "./style.scss";

import { querySelector } from "@wopjs/dom";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import App from "./components/App.vue";

const app = createApp(App);

app.use(createPinia()).use(
  createI18n({
    legacy: false,
    locale: navigator.language.startsWith("zh") ? "zh-CN" : "en",
    fallbackLocale: "en",
    messages: Object.fromEntries(
      Object.entries(import.meta.glob<{ default: any }>("./locales/*.yml", { eager: true })).map(
        ([key, value]) => [key.slice("./locales/".length, -".yml".length), value.default]
      )
    ),
  })
);

app.mount(querySelector<HTMLDivElement>("#app")!);

Object.assign(window, {
  app,
});
