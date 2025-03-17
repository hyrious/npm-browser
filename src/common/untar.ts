import { Data, Writable } from './base';
import { decode, inflate, isBinary, toUint8Array } from './bytes';

export interface IFileEntry {
  readonly mode: number;
  readonly content: Uint8Array;
  readonly text: string | undefined;
}

export interface ITarball {
  readonly [path: string]: IFileEntry;
}

const packagePrefix = 'package/';
function normalize(path: string): string {
  path = path.replace(/\\+/g, '/').replace(/^\.\/|^\./, '');
  if (path.startsWith(packagePrefix)) { path = path.slice(packagePrefix.length); }
  return path;
}

export async function untar(data: Data): Promise<ITarball> {
  data = toUint8Array(data);

  if (data[0] === 0x1f && data[1] === 0x8b) {
    data = await inflate(data);
  }

  const files: Writable<ITarball> = Object.create(null);
  const str = (i: number, n: number) => String.fromCharCode(...data.subarray(i, i + n)).replace(/\0.*$/, '');

  let offset = 0;
  while (offset < data.length) {
    const name = normalize(str(offset, 100));
    const mode = Number.parseInt(str(offset + 100, 8), 8);
    const size = Number.parseInt(str(offset + 124, 12), 8);
    offset += 512;
    if (Number.isInteger(size)) {
      const content = data.subarray(offset, offset + size);
      files[name] = new FileEntry(mode, content);
      offset += size + 511 & ~511;
    }
  }

  return files;
}

class FileEntry implements IFileEntry {
  constructor(readonly mode: number, readonly content: Uint8Array) { }
  private _text: 0 | string | undefined = 0;
  get text(): string | undefined {
    if (this._text !== 0) {
      return this._text;
    } else {
      if (isBinary(this.content)) { this._text = undefined; }
      else { this._text = decode(this.content); }
    }
  }
}
