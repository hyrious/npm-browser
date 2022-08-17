import untar, { File } from "js-untar";
import { inflate, Data } from "pako";

export default async function extractPackage(data: Data, callback: (file: File) => void) {
  const array = inflate(data);
  return await untar(array.buffer).progress(callback);
}
