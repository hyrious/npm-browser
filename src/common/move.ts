import type { ITarball } from './untar';

// Min Heap
class Heap {
  public size = 0;
  public data: number[] = new Array(128);

  get() {
    return this.data.slice(0, this.size);
  }

  add(value: number) {
    if (this.size < 127) {
      this.data[this.size++] = value;
      this._up(this.size - 1);
    }
    else {
      this.data[this.size] = value;
      this._up(this.size);
      this.data[0] = this.data[this.size];
      this._down(0);
    }
  }

  _up(index: number) {
    let parent = (index - 1) >> 1;
    while (index > 0 && this.data[parent] > this.data[index]) {
      const temp = this.data[index];
      this.data[index] = this.data[parent];
      this.data[parent] = temp;

      index = parent;
      parent = (index - 1) >> 1;
    }
  }

  _down(index: number) {
    while (index < this.size >> 1) {
      const left = (index << 1) | 1;
      const right = left + 1;

      const a = this.data[index];
      const la = this.data[left];
      const ra = this.data[right];

      if (a < la && a < ra) { break; }

      const j = la < ra ? left : right;
      this.data[index] = this.data[j];
      this.data[j] = a;

      index = j;
    }
  }
}

/**
 * {@link http://www.isthe.com/chongo/tech/comp/fnv/index.html#FNV-param FNV hash}
 */
function hash_line(line: string): number {
  let hash = 2166136261;
  for (let i = 0; i < 80 && i < line.length; i++) {
    hash ^= line.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

function hash(text: string): number[] {
  const lines = text.split(/\r\n|\r|\n/g);
  const heap = new Heap();
  for (let line of lines) {
    if (line = line.trim()) { heap.add(hash_line(line)); }
  }
  return heap.get().sort((a, b) => a - b);
}

function match(a: number[], b: number[]): number {
  let count = 0;
  for (let i = 0, len = a.length; i < len; i++) {
    if (a[i] === b[i]) { count++; }
  }
  return (100 * count * 2) / (a.length + b.length);
}

export interface IMove {
  readonly a: string;
  readonly b: string;
}

export function detectFileMoves(a: ITarball, b: ITarball): IMove[] {
  const moves: IMove[] = [];
  const uniqA: [filename: string, hash: number[]][] = [];
  const uniqB: [filename: string, hash: number[]][] = [];

  const files = new Set(Object.keys(a).concat(Object.keys(b)));
  for (const filename of files) {
    const fileA = a[filename], fileB = b[filename];
    if (fileA && fileB && fileA.text === fileB.text && fileA.mode === fileB.mode) { continue; }
    if (fileA && fileB) {
      moves.push({ a: filename, b: filename });
    } else if (fileA && typeof fileA.text === 'string') {
      uniqA.push([filename, hash(fileA.text)]);
    } else if (fileB && typeof fileB.text === 'string') {
      uniqB.push([filename, hash(fileB.text)]);
    }
  }

  const scores: [i: number, j: number, score: number][] = [];
  for (let i = 0; i < uniqA.length; i++) {
    for (let j = 0; j < uniqB.length; j++) {
      scores.push([i, j, match(uniqA[i][1], uniqB[j][1])]);
    }
  }
  scores.sort((a, b) => b[2] - a[2]);
  for (const [i, j, score] of scores) {
    if (uniqA[i][0] && uniqB[j][0] && score >= 50) {
      moves.push({ a: uniqA[i][0], b: uniqB[j][0] });
      uniqA[i][0] = uniqB[j][0] = '';
    }
  }

  for (let i = 0; i < uniqA.length; i++) {
    if (uniqA[i][0]) { moves.push({ a: uniqA[i][0], b: '' }); }
  }

  for (let i = 0; i < uniqB.length; i++) {
    if (uniqB[i][0]) { moves.push({ a: '', b: uniqB[i][0] }); }
  }

  return moves;
}
