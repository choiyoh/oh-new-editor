import { describe, expect, it } from 'vitest';

import { createEditor } from '../src/editor';
import { createTableSupport } from '../src/table';
import { getView, mountHost, pressKey, typeText } from './helpers';

const variants = [
  ['default schema', () => ({})],
  ['table schema', () => ({ table: createTableSupport() })]
] as const;

describe.each(variants)('input rules (%s)', (_name, makeOptions) => {
  function setup() {
    const host = mountHost();
    const editor = createEditor(host, makeOptions());
    return { editor, view: getView(editor) };
  }

  it.each([
    ['# x', '<h1>x</h1>'],
    ['### x', '<h3>x</h3>'],
    ['> x', '<blockquote><p>x</p></blockquote>'],
    ['- x', '<ul><li><p>x</p></li></ul>'],
    ['1. x', '<ol><li><p>x</p></li></ol>'],
    ['**bold**', '<p><strong>bold</strong></p>'],
    ['*it*', '<p><em>it</em></p>'],
    ['~~s~~', '<p><s>s</s></p>'],
    ['`c`', '<p><code>c</code></p>']
  ])('%s', (input, expected) => {
    const { editor, view } = setup();
    typeText(view, input);
    expect(editor.getContent('html')).toBe(expected);
    editor.destroy();
  });

  it('does not italicise arithmetic like 2*3*4', () => {
    const { editor, view } = setup();
    typeText(view, '2*3*4');
    expect(editor.getContent('html')).toBe('<p>2*3*4</p>');
    editor.destroy();
  });

  it('starts ordered lists at the typed number', () => {
    const { editor, view } = setup();
    typeText(view, '3. x');
    expect(editor.getContent('html')).toBe('<ol start="3"><li><p>x</p></li></ol>');
    editor.destroy();
  });

  it('creates a new list item on Enter and nests with Tab', () => {
    const { editor, view } = setup();
    typeText(view, '- a');
    pressKey(view, 'Enter');
    typeText(view, 'b');
    expect(editor.getContent('html')).toBe('<ul><li><p>a</p></li><li><p>b</p></li></ul>');
    pressKey(view, 'Tab');
    expect(editor.getContent('html')).toBe('<ul><li><p>a</p><ul><li><p>b</p></li></ul></li></ul>');
    editor.destroy();
  });
});
