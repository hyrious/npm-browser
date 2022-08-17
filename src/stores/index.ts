import { acceptHMRUpdate, defineStore } from "pinia";
import { parse } from "../helpers/query";

export const useApplicationStore = defineStore("app", () => {
  const packageName = ref("");
  const packageVersion = ref("");
  const path = ref("");
  const line = ref(0);

  const search = new URLSearchParams(location.search);
  const query = parse(search.get("q") || location.hash.slice(1));
  if (query) {
    packageName.value = query.name;
    packageVersion.value = query.version;
    path.value = query.path;
    line.value = query.line;
  }

  watchEffect(() => {
    let query = packageName.value;
    if (packageVersion.value) query += `@${packageVersion.value}`;
    if (path.value) query += path.value;
    if (line.value) query += `:${line.value}`;
    if (query) {
      search.set("q", query);
      history.replaceState(null, "", "?" + search.toString());
    }
  });

  return {
    packageName,
    packageVersion,
    path,
    line,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApplicationStore, import.meta.hot));
}
