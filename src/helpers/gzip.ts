import type { Data } from 'pako'

declare class CompressionStream {
  constructor(format: 'gzip' | 'deflate' | 'deflate-raw')
  writable: WritableStream
  readable: ReadableStream
}

declare class DecompressionStream {
  constructor(format: 'gzip' | 'deflate' | 'deflate-raw')
  writable: WritableStream
  readable: ReadableStream
}

function arrayBufferToUint8Array(buffer: ArrayBuffer) {
  return new Uint8Array(buffer)
}

export function inflate(data: Data) {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip')
    const writer = ds.writable.getWriter()
    writer.write(data)
    writer.close()
    return new Response(ds.readable).arrayBuffer().then(arrayBufferToUint8Array)
  } else {
    return import('pako').then(({ inflate }) => inflate(data))
  }
}

export function gzip(data: Data) {
  if (typeof CompressionStream !== 'undefined') {
    const cs = new CompressionStream('gzip')
    const writer = cs.writable.getWriter()
    writer.write(data)
    writer.close()
    return new Response(cs.readable).arrayBuffer().then(arrayBufferToUint8Array)
  } else {
    return import('pako').then(({ gzip }) => gzip(data))
  }
}
