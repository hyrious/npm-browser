import { FileType, IFileSystemProvider, TarballFS } from './file';
import { untar } from './untar';

fetch('https://registry.npmmirror.com/vite/-/vite-6.2.4.tgz')
  .then(r => r.bytes())
  .then(untar)
  .then(bytes => readdirRecursive(new TarballFS(bytes)));

async function readdirRecursive(fs: IFileSystemProvider, dir = '/', depth = 0) {
  const entries = await fs.readdir(dir);
  for (const [name, type] of entries) {
    const path = dir === '/' ? `/${name}` : `${dir}/${name}`;
    console.log('\t'.repeat(depth) + name + (type === FileType.Directory ? '/' : ''));
    if (type === FileType.Directory) {
      await readdirRecursive(fs, path, depth + 1);
    }
  }
}
