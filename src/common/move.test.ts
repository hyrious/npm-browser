import { detectFileMoves } from './move';

const content = Uint8Array.of();
const moves = detectFileMoves({
  a: { mode: 0, content, text: 'foo' },
  b: { mode: 0, content, text: 'bar' },
}, {
  c: { mode: 0, content, text: 'foo' },
  b: { mode: 0, content, text: 'barbar' },
});
for (const m of moves) {
  console.log(m.a, '->', m.b);
}
