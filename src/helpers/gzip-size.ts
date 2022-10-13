import { Data, gzip } from "pako";

export default function gzipSize(data: Data) {
  return gzip(data).byteLength;
}
