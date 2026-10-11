import { describe, expect, it } from 'vitest';

import { createEditor } from '../src/editor';
import { createTableSupport } from '../src/table';
import { getView, mountHost, setCursor, typeText } from './helpers';

describe('change event', () => {
  it('fires for document changes only, not selection moves', () => {
    const editor = createEditor(mountHost(), { initialContent: '<p>hello</p>' });
    const view = getView(editor);
    let count = 0;
    editor.on('change', () => count++);

    setCursor(view, 3);
    expect(count).toBe(0);

    typeText(view, '!');
    expect(count).toBe(1);

    editor.setContent('<p>reset</p>');
    expect(count).toBe(2);
    editor.destroy();
  });
});

describe('table context menu', () => {
  function rightClick(target: Element) {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
    target.dispatchEvent(event);
    return event;
  }

  it('opens on an empty cell without throwing and positions relative to the host', () => {
    const host = mountHost();
    const editor = createEditor(host, {
      table: createTableSupport(),
      initialContent: '<table><tbody><tr><td></td><td></td></tr></tbody></table>'
    });
    const view = getView(editor);
    const cell = host.querySelector('td');
    expect(cell).toBeTruthy();

    // jsdom has no layout, so stub the hit-test to land inside the first cell.
    let cellPos = -1;
    view.state.doc.descendants((node, pos) => {
      if (cellPos === -1 && node.type.name === 'paragraph') cellPos = pos + 1;
    });
    view.posAtCoords = () => ({ pos: cellPos, inside: -1 });
    host.getBoundingClientRect = () => ({ left: 4, top: 6, right: 0, bottom: 0, width: 0, height: 0, x: 4, y: 6, toJSON() {} });

    const event = rightClick(cell!);
    expect(event.defaultPrevented).toBe(true);

    const menu = host.querySelector<HTMLElement>('.oh-editor__table-menu');
    expect(menu?.hidden).toBe(false);
    expect(menu?.style.top).toBe('4px');
    expect(view.state.selection.from).toBe(cellPos);
    editor.destroy();
  });
});
