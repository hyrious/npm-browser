import { acceptHMRUpdate, defineStore } from "pinia";
import { parse } from "../helpers/query";

export const useApplicationStore = defineStore("app", () => {
  const packageName = ref("");
  const packageVersion = ref("");
  const path = ref("");
  const line = ref(0);

  const fromQuery = () => {
    const search = new URLSearchParams(location.search);
    const query = parse(search.get("q") || location.hash.slice(1));
    if (query) {
      packageName.value = query.name;
      packageVersion.value = query.version;
      path.value = query.path;
      line.value = query.line;
    }
    return search;
  };

  const search = fromQuery();

  watchEffect(() => {
    let query = packageName.value;
    if (packageVersion.value) query += `@${packageVersion.value}`;
    if (path.value) query += path.value;
    if (line.value) query += `:${line.value}`;
    if (query && search.get("q") !== query) {
      search.set("q", query);
      // TODO: if $code has changed because of selecting file, push history
      history.replaceState(null, "", "?" + search.toString());
    }
  });

  watch(
    [packageName, packageVersion, path],
    ([name, version, path]) => {
      const normal_path = path.replace(/^\/\w+\//, "");
      if (path) {
        document.title = `${normal_path} - ${name} ${version}`;
      } else if (name) {
        document.title = version ? `${name}@${version}` : name;
      } else {
        document.title = "NPM Browser";
      }
    },
    { immediate: true }
  );

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
