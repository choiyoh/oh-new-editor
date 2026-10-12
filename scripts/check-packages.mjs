import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(join(tmpdir(), 'oh-editor-packages-'));
const packages = ['core', 'react', 'vue', 'svelte'];
const fixtures = join(repo, 'scripts', 'package-tests');

function run(command, args, cwd) {
  try {
    return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    if (error.stdout) process.stderr.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

function exportPaths(value) {
  if (typeof value === 'string') return [value];
  return Object.values(value).flatMap(exportPaths);
}

try {
  const archives = join(temporary, 'archives');
  await mkdir(archives);
  const dependencies = {};

  for (const name of packages) {
    const directory = join(repo, 'packages', name);
    const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
    run('pnpm', ['pack', '--pack-destination', archives], directory);
    const archive = join(archives, `oh-new-editor-${name}-${manifest.version}.tgz`);
    const extracted = join(temporary, name);
    await mkdir(extracted);
    run('tar', ['-xzf', archive, '-C', extracted], repo);
    const packed = join(extracted, 'package');
    const packedManifest = JSON.parse(await readFile(join(packed, 'package.json'), 'utf8'));
    assert.equal(packedManifest.license, 'MIT', `${name}: missing MIT metadata`);
    await readFile(join(packed, 'README.md'));
    await readFile(join(packed, 'LICENSE'));
    for (const path of exportPaths(packedManifest.exports)) {
      await readFile(join(packed, path));
    }
    for (const version of Object.values(packedManifest.peerDependencies ?? {})) {
      assert.ok(!version.startsWith('workspace:'), `${name}: unpublished workspace peer`);
    }
    if (name === 'react') {
      for (const file of ['index.mjs', 'index.cjs']) {
        assert.match(await readFile(join(packed, 'dist', file), 'utf8'), /^['"]use client['"];?/);
      }
    }
    dependencies[packedManifest.name] = `file:${archive}`;
    console.log(`Package contents: ${packedManifest.name}@${packedManifest.version} OK`);
  }

  for (const reactVersion of ['18.0.0', '19.2.0']) {
    const consumer = join(temporary, `react-${reactVersion}`);
    await mkdir(consumer);
    await writeFile(join(consumer, 'package.json'), JSON.stringify({
      private: true,
      type: 'module',
      dependencies: {
        ...dependencies,
        react: reactVersion,
        'react-dom': reactVersion,
        vue: '3.5.22',
        '@vue/server-renderer': '3.5.22',
        svelte: '5.39.6',
        '@sveltejs/vite-plugin-svelte': '6.2.1',
        vite: '7.3.1',
        jsdom: '26.1.0',
        typescript: '6.0.2',
        '@types/react': reactVersion.startsWith('18') ? '18.3.28' : '19.2.14',
        '@types/react-dom': reactVersion.startsWith('18') ? '18.3.7' : '19.2.3',
      },
    }, null, 2));
    console.log(`Installing isolated consumer: React ${reactVersion}, Vue 3, Svelte 5`);
    run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], consumer);
    for (const file of await readdir(fixtures)) {
      await copyFile(join(fixtures, file), join(consumer, file));
    }
    process.stdout.write(run('node', ['ssr.mjs'], consumer));
    process.stdout.write(run('node', ['--conditions=browser', 'client.mjs'], consumer));
    process.stdout.write(run('node', ['svelte-ssr.mjs'], consumer));
    run('pnpm', ['exec', 'tsc', '--project', 'tsconfig.json'], consumer);
    console.log(`Published package consumption: React ${reactVersion} OK`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
