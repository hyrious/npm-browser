import untar, { File } from "js-untar";
import { inflate, Data } from "pako";

/**
 * ```js
 * const { extract } = await import("~/helpers/untar");
 * const files = await extract(file);
 * ```
 */
export function extract(data: Data, progress: (file: File) => void) {
  return untar(inflate(data).buffer).progress(progress);
}
