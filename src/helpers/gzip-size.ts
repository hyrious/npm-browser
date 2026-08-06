import { gzip } from './gzip'

export function gzipSize(data: ArrayBuffer) {
  return gzip(data).then((arr) => arr.byteLength)
}
