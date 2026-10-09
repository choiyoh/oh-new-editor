import { describe, expect, it } from 'vitest';

import { getActiveLink, removeLink, setLink } from '../src/commands';
import { createEditor } from '../src/editor';
import { createNotionSupport } from '../src/notion';
import { createTableSupport } from '../src/table';
import { createToolbarSupport } from '../src/toolbar';
import { normalizeHref } from '../src/utils/url';
import { findTextPos, getView, mountHost, setCursor, typeText } from './helpers';

describe('normalizeHref', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['example.com/docs?q=1', 'https://example.com/docs?q=1'],
    ['  https://a.dev  ', 'https://a.dev'],
    ['//cdn.example.com/x', 'https://cdn.example.com/x'],
    ['me@example.com', 'mailto:me@example.com'],
    ['mailto:me@example.com', 'mailto:me@example.com'],
    ['/relative/path', '/relative/path'],
    ['#section', '#section'],
    ['localhost:3000', 'https://localhost:3000']
  ])('%s -> %s', (input, expected) => {
    expect(normalizeHref(input)).toBe(expected);
  });

  it.each(['', '   ', 'https://', 'javascript:alert(1)', 'data:text/html,x', 'hello world', 'word'])('rejects %j', (input) => {
    expect(normalizeHref(input)).toBeNull();
  });
});

describe('link commands', () => {
  function setup(html: string) {
    const editor = createEditor(mountHost(), { initialContent: html });
    return { editor, view: getView(editor) };
  }

  it('removes the whole link when the cursor is inside it', () => {
    const { editor, view } = setup('<p>hello <a href="https://a.com">link</a> world</p>');
    setCursor(view, findTextPos(view, 'link') + 2);
    expect(getActiveLink(view.state)?.href).toBe('https://a.com');
    expect(removeLink()(view.state, view.dispatch)).toBe(true);
    expect(editor.getContent('html')).toBe('<p>hello link world</p>');
    editor.destroy();
  });

  it('updates the href of the link under the cursor instead of removing it', () => {
    const { editor, view } = setup('<p><a href="https://a.com">link</a></p>');
    setCursor(view, findTextPos(view, 'link') + 1);
    setLink('https://b.com')(view.state, view.dispatch);
    expect(editor.getContent('html')).toBe('<p><a href="https://b.com">link</a></p>');
    editor.destroy();
  });

  it('replaces the href across a selection that already has a link', () => {
    const { editor, view } = setup('<p><a href="https://a.com">link</a> text</p>');
    const from = findTextPos(view, 'link');
    view.dispatch(view.state.tr.setSelection(
      (view.state.selection.constructor as typeof import('prosemirror-state').TextSelection).create(view.state.doc, from, from + 9)
    ));
    setLink('https://b.com')(view.state, view.dispatch);
    expect(editor.getContent('html')).toBe('<p><a href="https://b.com">link text</a></p>');
    editor.destroy();
  });

  it('inserts the URL as linked text when nothing is selected', () => {
    const { editor, view } = setup('<p>go</p>');
    setCursor(view, 3);
    setLink('https://c.com')(view.state, view.dispatch);
    typeText(view, '!');
    expect(editor.getContent('html')).toBe('<p>go<a href="https://c.com">https://c.com</a>!</p>');
    editor.destroy();
  });
});

describe('toolbar keyboard access', () => {
  it('activates buttons with click (Enter/Space) and keeps one tab stop', () => {
    const host = mountHost();
    const editor = createEditor(host, { toolbar: createToolbarSupport(), initialContent: '<p>hello</p>' });
    const view = getView(editor);
    view.dispatch(view.state.tr.setSelection(
      (view.state.selection.constructor as typeof import('prosemirror-state').TextSelection).create(view.state.doc, 1, 6)
    ));

    const bold = host.querySelector<HTMLButtonElement>('button[aria-label="Bold"]')!;
    bold.click();
    expect(editor.getContent('html')).toBe('<p><strong>hello</strong></p>');
    expect(bold.getAttribute('aria-pressed')).toBe('true');

    const undo = host.querySelector<HTMLButtonElement>('button[aria-label="Undo"]')!;
    expect(undo.hasAttribute('aria-pressed')).toBe(false);

    const tabStops = Array.from(host.querySelectorAll<HTMLElement>('.oh-editor__toolbar button, .oh-editor__toolbar select'))
      .filter((element) => element.tabIndex === 0);
    expect(tabStops).toHaveLength(1);
    editor.destroy();
  });

  it('applies a link typed without protocol and flags invalid input', () => {
    const host = mountHost();
    const editor = createEditor(host, { toolbar: createToolbarSupport(), initialContent: '<p>hello</p>' });
    const view = getView(editor);
    view.dispatch(view.state.tr.setSelection(
      (view.state.selection.constructor as typeof import('prosemirror-state').TextSelection).create(view.state.doc, 1, 6)
    ));

    host.querySelector<HTMLButtonElement>('button[aria-label="Insert link"]')!.click();
    const input = host.querySelector<HTMLInputElement>('.oh-editor__link-editor-input')!;
    const apply = host.querySelector<HTMLButtonElement>('.oh-editor__link-editor-button--confirm')!;

    input.value = 'not a url';
    apply.click();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(host.querySelector('.oh-editor__link-editor')).toBeTruthy();

    input.value = 'example.com';
    apply.click();
    expect(editor.getContent('html')).toBe('<p><a href="https://example.com">hello</a></p>');
    expect(host.querySelector('.oh-editor__link-editor')).toBeNull();
    editor.destroy();
  });
});

describe('notion slash menu', () => {
  function setup() {
    const host = mountHost();
    const editor = createEditor(host, { toolbar: createNotionSupport(), table: createTableSupport() });
    return { host, editor, view: getView(editor) };
  }

  const labels = (host: HTMLElement) =>
    Array.from(host.querySelectorAll('.oh-editor__slash-item-label')).map((element) => element.textContent);

  it('filters with Korean keywords and initial consonants', () => {
    const { host, editor, view } = setup();
    typeText(view, '/제목');
    expect(labels(host)).toEqual(['Heading 1', 'Heading 2', 'Heading 3']);

    typeText(view, '2');
    expect(labels(host)).toEqual(['Heading 2']);
    editor.destroy();

    const second = setup();
    typeText(second.view, '/ㅍ');
    expect(labels(second.host)).toContain('Table');
    second.editor.destroy();
  });

  it('resets the active item when the query changes and runs it on Enter', () => {
    const { host, editor, view } = setup();
    typeText(view, '/');
    view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(host.querySelector('.oh-editor__slash-item[data-active="true"] .oh-editor__slash-item-label')?.textContent).toBe('Heading 1');

    typeText(view, 'head');
    expect(host.querySelector('.oh-editor__slash-item[aria-selected="true"] .oh-editor__slash-item-label')?.textContent).toBe('Heading 1');
    expect(view.dom.getAttribute('aria-activedescendant')).toBeTruthy();

    view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(editor.getContent('html')).toBe('<h1></h1>');
    editor.destroy();
  });

  it('closes on Escape and stays closed while typing the same command', () => {
    const { host, editor, view } = setup();
    typeText(view, '/');
    view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(host.querySelector<HTMLElement>('.oh-editor__slash-menu')?.hidden).toBe(true);
    typeText(view, 'h');
    expect(host.querySelector<HTMLElement>('.oh-editor__slash-menu')?.hidden).toBe(true);
    editor.destroy();
  });

  it('ignores Enter while an IME composition is active', () => {
    const { editor, view } = setup();
    typeText(view, '/');
    view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }));
    // The slash item must not run; what ProseMirror does with the raw key is its business.
    expect(editor.getContent('html')).toMatch(/^<p>\/<\/p>/);
    editor.destroy();
  });
});
