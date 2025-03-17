import type { ITarball } from './untar';

export enum FileMode {
  Read = 4,
  Write = 2,
  Execute = 1,
}

export enum FileType {
  File = 1,
  Directory = 2,
}

export interface IStat {
  readonly type: FileType;
  readonly size: number;
}

export interface IFileSystemProvider {
  stat(path: string): Promise<IStat>;
  readdir(path: string): Promise<[string, FileType][]>;
  readFile(path: string): Promise<Uint8Array>;
}

type Entry = File | Directory;

interface File {
  readonly type: FileType.File;
  readonly content: Uint8Array;
}

function createFile(content: Uint8Array): File {
  return { type: FileType.File, content };
}

interface Directory {
  readonly type: FileType.Directory;
  readonly children: Map<string, Entry>;
}

function createDirectory(): Directory {
  return { type: FileType.Directory, children: new Map() };
}

export class Stat implements IStat {
  constructor(readonly type: FileType, readonly size: number) { }
  static readonly directory = new Stat(FileType.Directory, 0);
  static file(size: number): IStat { return new Stat(FileType.File, size); }
  isDirectory() { return this.type === FileType.Directory; }
  isFile() { return this.type === FileType.File; }
}

export class FileSystemError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = 'FileSystemError';
  }
  static readonly ENOENT = new FileSystemError('ENOENT');
  static readonly EEXIST = new FileSystemError('EEXIST');
  static readonly EISDIR = new FileSystemError('EISDIR');
  static readonly ENOTDIR = new FileSystemError('ENOTDIR');
}

/**
 * ```js
 * splitPath('/foo/bar/baz') // ['foo', 'bar', 'baz']
 * splitPath('/') // []
 * ```
 */
function splitPath(path: string): string[] {
  if (path === '/') { return []; }
  const parts = path.split('/');
  parts.shift();
  return parts;
}

function getEntryFromPath(root: Directory, path: string): Entry {
  const parts = splitPath(path);
  let dir = root;
  for (let i = 0, n = parts.length; i < n; i++) {
    const child = dir.children.get(parts[i]);
    if (!child) { throw FileSystemError.ENOENT; }
    if (child.type === FileType.File) {
      if (i + 1 === n) { return child; }
      throw FileSystemError.ENOTDIR;
    }
    dir = child;
  }
  return dir;
}

function rejectConflict(part: string): never {
  throw new Error(JSON.stringify(part) + ' cannot be both a file and a directory');
}

export class TarballFS implements IFileSystemProvider {
  private readonly root: Directory = createDirectory();

  constructor(tarball: ITarball) {
    for (const path in tarball) {
      const parts = path.split('/');
      let dir = this.root;

      for (let i = 0; i + 1 < parts.length; i++) {
        const part = parts[i];
        let child = dir.children.get(part);
        if (!child) {
          child = createDirectory();
          dir.children.set(part, child);
        } else if (child.type !== FileType.Directory) {
          rejectConflict(part);
        }
        dir = child;
      }

      const part = parts[parts.length - 1];
      if (dir.children.has(part)) { rejectConflict(part); }
      dir.children.set(part, createFile(tarball[path].content));
    }
  }

  async readdir(path: string): Promise<[string, FileType][]> {
    const entry = getEntryFromPath(this.root, path);
    if (entry.type !== FileType.Directory) { throw FileSystemError.ENOTDIR; }
    const result: [string, FileType][] = [];
    for (const [name, child] of entry.children) {
      result.push([name, child.type]);
    }
    return result;
  }

  async readFile(path: string): Promise<Uint8Array> {
    const entry = getEntryFromPath(this.root, path);
    if (entry.type === FileType.Directory) { throw FileSystemError.EISDIR; }
    return entry.content;
  }

  async stat(path: string): Promise<IStat> {
    const entry = getEntryFromPath(this.root, path);
    if (entry.type === FileType.Directory) { return Stat.directory; }
    return Stat.file(entry.content.byteLength);
  }
}
