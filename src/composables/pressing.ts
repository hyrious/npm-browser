import { listen } from "@wopjs/dom";

export function usePressing(key: string) {
  const pressing = ref(false);
  onMounted(() => {
    const disposers: (() => void)[] = [];
    disposers.push(
      listen(document, "keydown", (e) => {
        if (e.key === key) {
          pressing.value = true;
        }
      })
    );
    disposers.push(
      listen(document, "keyup", (e) => {
        if (e.key === key) {
          pressing.value = false;
        }
      })
    );
    return () => disposers.forEach((f) => f());
  });
  return pressing;
}
