import type { Data } from 'pako'
import { gzip } from './gzip'

export function gzipSize(data: Data) {
  return gzip(data).then((arr) => arr.byteLength)
}
