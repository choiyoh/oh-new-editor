import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  plugins: [svelte()],
  server: { middlewareMode: true, hmr: false },
});
try {
  const { OhNewEditor, render } = await server.ssrLoadModule('/svelte-entry.mjs');
  const html = render(OhNewEditor, { props: { value: '<p>Hello</p>' } }).body;
  assert.match(html, /<div><\/div>/);
  assert.ok(!html.includes('<p>Hello</p>'));
  console.log('Svelte source export: Vite server compilation and rendering OK');
} finally {
  await server.close();
}
