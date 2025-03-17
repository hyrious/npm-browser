import { Data } from './base';

let textDecoder: TextDecoder | undefined;
export function decode(buffer: Data): string {
  if (!textDecoder) { textDecoder = new TextDecoder(); }
  return textDecoder.decode(buffer);
}

export function isUint8Array(data: Data): data is Uint8Array {
  return data instanceof Uint8Array;
}

export function toUint8Array(buffer: Data): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

export function isBinary(buffer: Data): boolean {
  buffer = toUint8Array(buffer).subarray(0, Math.min(8000, buffer.byteLength));
  return Array.prototype.indexOf.call(buffer, 0) >= 0;
}
export function base64Encode(str: string): string {
  return uint8ArrayToBase64(new TextEncoder().encode(str));
}

export function base64Decode(base64: string): string {
  return new TextDecoder().decode(base64ToUint8Array(base64));
}

export function uint8ArrayToBase64(array: Uint8Array): string {
  if (array.length < 65535) {
    return btoa(String.fromCodePoint.apply(String, array as unknown as number[]));
  } else {
    let base64 = "";
    for (const value of array) {
      base64 += String.fromCodePoint(value);
    }
    return btoa(base64);
  }
}

export function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), x => x.codePointAt(0)!);
}

// Note: CompressionStream is supported in Node.js 18 and later
export function gzip(data: Data): Promise<Uint8Array> {
  if (typeof CompressionStream !== 'undefined') {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(toUint8Array(data));
    writer.close();
    return new Response(cs.readable).arrayBuffer().then(toUint8Array);
  } else {
    return import('pako').then(({ gzip }) => gzip(data));
  }
}

export function inflate(data: Data): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(toUint8Array(data));
    writer.close();
    return new Response(ds.readable).arrayBuffer().then(toUint8Array);
  } else {
    return import('pako').then(({ inflate }) => inflate(data));
  }
}

export function gzipSize(data: Data): Promise<number> {
  return gzip(data).then((buffer) => buffer.byteLength);
}
