import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><div id="host"></div>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'Text', 'Comment', 'SVGElement', 'Event', 'FocusEvent']) {
  globalThis[key] = dom.window[key];
}
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const require = createRequire(import.meta.url);
const host = document.querySelector('#host');
const { createEditor } = await import('@oh-new-editor/core');
const editor = createEditor(host, { initialContent: '<p>Hello<script>alert(1)</script></p>' });
assert.equal(editor.getContent('html'), '<p>Hello</p>');
editor.destroy();

const React = await import('react');
const { createRoot } = await import('react-dom/client');
const act = React.act ?? (await import('react-dom/test-utils')).act;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
for (const adapter of [await import('@oh-new-editor/react'), require('@oh-new-editor/react')]) {
  const root = createRoot(host);
  const ref = React.createRef();
  await act(async () => root.render(React.createElement(adapter.OhNewEditor, { ref, value: '<p>React consumer</p>' })));
  assert.equal(host.querySelector('.ProseMirror')?.textContent, 'React consumer');
  assert.ok(ref.current);
  await act(async () => root.unmount());
  assert.equal(host.querySelector('.ProseMirror'), null);
}

const { createApp } = await import('vue');
const { OhNewEditor: VueEditor } = await import('@oh-new-editor/vue');
const app = createApp(VueEditor, { modelValue: '<p>Vue consumer</p>' });
app.mount(host);
assert.equal(host.querySelector('.ProseMirror')?.textContent, 'Vue consumer');
app.unmount();

const { mount, unmount, flushSync: flushSvelte } = await import('svelte');
for (const adapter of [await import('@oh-new-editor/svelte'), require('@oh-new-editor/svelte')]) {
  const component = mount(adapter.OhNewEditor, { target: host, props: { value: '<p>Svelte consumer</p>' } });
  flushSvelte();
  assert.equal(host.querySelector('.ProseMirror')?.textContent, 'Svelte consumer');
  await unmount(component);
  assert.equal(host.querySelector('.ProseMirror'), null);
}
dom.window.close();
console.log(`Browser DOM: core sanitization, React ${React.version} ESM/CJS, Vue, Svelte ESM/CJS mount/unmount OK`);
