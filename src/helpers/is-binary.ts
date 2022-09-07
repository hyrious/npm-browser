const indexOf = Array.prototype.indexOf;

export function is_binary(buffer: ArrayBuffer) {
  const first_few_bytes = new Uint8Array(buffer, 0, Math.min(8000, buffer.byteLength));
  return indexOf.call(first_few_bytes, 0) >= 0;
}
