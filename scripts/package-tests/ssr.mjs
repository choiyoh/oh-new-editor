import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createSSRApp, h } from 'vue';
import { renderToString as renderVue } from '@vue/server-renderer';

const require = createRequire(import.meta.url);
for (const entry of ['', '/markdown', '/table', '/toolbar', '/notion', '/ai']) {
  assert.ok(Object.keys(await import(`@oh-new-editor/core${entry}`)).length);
  assert.ok(Object.keys(require(`@oh-new-editor/core${entry}`)).length);
}

for (const adapter of [await import('@oh-new-editor/react'), require('@oh-new-editor/react')]) {
  const html = renderToString(React.createElement(adapter.OhNewEditor, { value: '<p>Hello</p>', className: 'editor-host' }));
  assert.equal(html, '<div class="editor-host"></div>');
}
for (const adapter of [await import('@oh-new-editor/vue'), require('@oh-new-editor/vue')]) {
  assert.equal(await renderVue(createSSRApp({ render: () => h(adapter.OhNewEditor, { modelValue: '<p>Hello</p>' }) })), '<div></div>');
}
assert.equal(typeof (await import('@oh-new-editor/svelte')).OhNewEditor, 'function');
assert.equal(typeof require('@oh-new-editor/svelte').OhNewEditor, 'function');
console.log('SSR without DOM: core ESM/CJS, React, Vue, Svelte imports OK');
