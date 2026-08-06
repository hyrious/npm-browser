import { default as untar, type File } from 'js-untar'
import { inflate } from './gzip'

export type { File }

export async function extractPackage(data: ArrayBuffer, callback: (file: File) => void) {
  const array = await inflate(data)
  return await untar(array.buffer).progress(callback)
}
