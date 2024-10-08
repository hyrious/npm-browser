import { default as untar, type File } from 'js-untar'
import type { Data } from 'pako'
import { inflate } from './gzip'

export async function extractPackage(data: Data, callback: (file: File) => void) {
  const array = await inflate(data)
  return await untar(array.buffer).progress(callback)
}
