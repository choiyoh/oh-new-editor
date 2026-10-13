import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const checks = [
  { pattern: 'packages/core/dist/editor-*.js', label: 'core shared chunk', maxKb: 120 },
  { pattern: 'apps/playground/dist/assets/index-*.js', label: 'playground bundle', maxKb: 160 }
];

function resolveSingleGlob(pattern) {
  const dir = dirname(pattern);
  const [prefix, suffix] = pattern.split('*');
  const basePrefix = prefix.slice(dir.length + 1);

  return readdirSync(dir)
    .filter((name) => name.startsWith(basePrefix) && name.endsWith(suffix))
    .map((name) => join(dir, name))[0];
}

let failed = false;

for (const check of checks) {
  const file = resolveSingleGlob(check.pattern);
  if (!file) {
    console.error(`Missing artifact for ${check.label}: ${check.pattern}`);
    failed = true;
    continue;
  }

  const gzipped = gzipSync(readFileSync(file)).byteLength / 1024;
  console.log(`${check.label}: ${gzipped.toFixed(2)} kB gzip (limit ${check.maxKb} kB)`);
  if (gzipped > check.maxKb) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
