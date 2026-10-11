import { describe, expect, it } from 'vitest';

import { createEditor } from '../src/editor';
import { createMarkdownSupport } from '../src/markdown';
import { createTableSupport } from '../src/table';
import { mountHost } from './helpers';

describe('markdown with tables', () => {
  it('serializes a document that contains a table', () => {
    const editor = createEditor(mountHost(), {
      table: createTableSupport(),
      markdown: createMarkdownSupport(),
      initialContent: '<table><tbody><tr><th><p>A</p></th><th><p>B</p></th></tr><tr><td><p>1</p></td><td><p>2</p></td></tr></tbody></table>'
    });
    expect(editor.getContent('markdown')).toBe('| A | B |\n| --- | --- |\n| 1 | 2 |');
    editor.destroy();
  });

  it('parses markdown tables into table nodes', () => {
    const editor = createEditor(mountHost(), {
      table: createTableSupport(),
      markdown: createMarkdownSupport(),
      outputFormat: 'markdown',
      initialContent: '| A | B |\n| --- | --- |\n| 1 | 2 |'
    });
    expect(editor.getContent('html')).toContain('<table');
    expect(editor.getContent('markdown')).toBe('| A | B |\n| --- | --- |\n| 1 | 2 |');
    editor.destroy();
  });

  it('round-trips common formatting', () => {
    const editor = createEditor(mountHost(), { markdown: createMarkdownSupport(), outputFormat: 'markdown' });
    const source = '# Title\n\nSome **bold**, *em*, ~~gone~~ and `code` with a [link](https://a.dev).\n\n- one\n- two\n\n```ts\nconst x = 1;\n```';
    editor.setContent(source, 'markdown');
    expect(editor.getContent('markdown')).toBe(source);
    editor.destroy();
  });
});

describe('markdown lists', () => {
  it.each([
    '1. first\n2. second',
    '3. three\n4. four',
    '- parent\n\n  - child\n  - sibling\n- next'
  ])('round-trips %j', (source) => {
    const editor = createEditor(mountHost(), { markdown: createMarkdownSupport(), outputFormat: 'markdown' });
    editor.setContent(source, 'markdown');
    const once = editor.getContent('markdown');
    editor.setContent(once, 'markdown');
    expect(editor.getContent('markdown')).toBe(once);
    expect(once).not.toMatch(/^[ \t]+$/m);
    if (!source.includes('child')) expect(once).toBe(source);
    editor.destroy();
  });
});
