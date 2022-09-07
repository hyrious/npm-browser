import { defineStore, acceptHMRUpdate } from "pinia";
import { useDark } from "./dark";
export * from "./pressing";

export const useAppStore = defineStore("app", () => {
  const dark = useDark();

  return {
    dark,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}
