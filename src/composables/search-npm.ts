import { events } from "~/helpers/events";

export function useSearchNPM() {
  let timer = 0;

  const searching = ref(false);
  const results = ref<{ name: string; description: string }[]>([]);

  function search(text: string) {
    clearTimeout(timer);
    if (text) {
      timer = setTimeout(do_search, 500, text);
      searching.value = true;
      results.value = [];
    } else {
      searching.value = false;
      results.value = [];
    }
  }

  const api = new URL("https://registry.npmjs.org/-/v1/search");
  let abortController: AbortController | null = null;
  async function do_search(str: string) {
    api.searchParams.set("text", str);
    try {
      abortController && abortController.abort();
      abortController = new AbortController();
      const ret = await fetch(api, { signal: abortController.signal }).then((r) => r.json());
      results.value = ret.objects.map((e: any) => e.package);
    } catch (e) {
      if (e.name === "AbortError") return;
      events.emit("message", e.message);
      throw e;
    }
    searching.value = false;
  }

  return { searching, results, search };
}
