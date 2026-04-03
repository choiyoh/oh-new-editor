import { describe, expect, it } from 'vitest';

import { createEditor } from '../src/editor';
import { createNotionSupport } from '../src/notion';
import { createTableSupport } from '../src/table';
import { createToolbarSupport } from '../src/toolbar';

describe('editor supports smoke', () => {
  it('mounts with toolbar support', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const editor = createEditor(host, {
      toolbar: createToolbarSupport(),
      initialContent: '<p>Hello</p>'
    });

    expect(host.querySelector('.oh-editor__toolbar')).toBeTruthy();
    editor.destroy();
  });

  it('mounts with notion support', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const editor = createEditor(host, {
      toolbar: createNotionSupport(),
      initialContent: '<p>Hello</p>'
    });

    expect(host.querySelector('.oh-editor__notion-ui')).toBeTruthy();
    editor.destroy();
  });

  it('mounts with table support and round-trips table html', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const editor = createEditor(host, {
      table: createTableSupport({ maxRows: 4, maxCols: 4 }),
      initialContent: '<table><tbody><tr><td>Cell</td></tr></tbody></table>'
    });

    expect(editor.getContent('html')).toContain('<table');
    editor.destroy();
  });
});
