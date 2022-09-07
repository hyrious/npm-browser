import { is_binary } from "./is-binary";

console.log([
  is_binary(Uint8Array.of(0, 1, 2, 3).buffer),
  is_binary(new TextEncoder().encode("hello").buffer),
]);
