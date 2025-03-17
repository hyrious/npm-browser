import * as fs from 'node:fs';
import * as esbuild from 'esbuild';
import * as rollup from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

const plugin = (): rollup.Plugin => {
  const building = new Map<string, Promise<string>>();

  const build = (dist: string) => {
    building.set(dist, esbuild.build({
      entryPoints: [dist.replace(/\.js$/, '.ts')],
      bundle: true,
      packages: 'external',
      platform: 'neutral',
      write: false,
      outfile: dist,
      define: {
        'import.meta.env.NPM': 'true',
      },
    }).then(r => r.outputFiles[0].text));
  };

  return ({
    name: 'typescript',
    resolveId(id, base) {
      if (!base && id.endsWith('.js')) {
        build(id);
        return id;
      }
    },
    load(id) {
      return building.get(id);
    },
  });
};

const bundle = await rollup.rollup({
  input: ['src/cli.js'],
  plugins: [plugin(), commonjs(), nodeResolve()],
  treeshake: true,
});

await bundle.write({
  file: 'dist/cli.js',
  format: 'esm',
});

const code = '#!/usr/bin/env node\n' + fs.readFileSync('dist/cli.js', 'utf8');
fs.writeFileSync('dist/cli.js', code, 'utf8');
fs.chmodSync('dist/cli.js', 0o755);

const size = fs.statSync('dist/cli.js').size;
console.log('✅ dist/cli.js', (size / 1024).toFixed(2), 'kB');
