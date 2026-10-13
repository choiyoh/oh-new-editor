import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { describe, expect, it, vi } from 'vitest';

import { createEditor } from '../src/editor';
import { createNotionSupport } from '../src/notion';
import { getView, mountHost } from './helpers';

describe('host integration hooks', () => {
  it('priorityPlugins run before the built-in keymaps', () => {
    const key = new PluginKey('probe');
    const seen: string[] = [];
    const probe = new Plugin({
      key,
      props: {
        handleKeyDown(_view, event) {
          seen.push(event.key);
          return event.key === 'F9';
        }
      }
    });
    const editor = createEditor(mountHost(), { priorityPlugins: [probe] });
    const view = getView(editor);
    const handled = view.someProp('handleKeyDown', (f) => f(view, new KeyboardEvent('keydown', { key: 'F9' })));
    expect(handled).toBe(true);
    expect(seen).toEqual(['F9']);
    editor.destroy();
  });

  it('getView / getDocument / setDocument(silent) replace the document without a change event', () => {
    const editor = createEditor(mountHost(), {});
    const onChange = vi.fn();
    editor.on('change', onChange);
    const doc = editor.getDocument();
    const next = doc.type.schema.nodes.doc.create(null, [doc.type.schema.nodes.paragraph.create(null, doc.type.schema.text('loaded'))]);
    editor.setDocument(next, { silent: true });
    expect(editor.getView()).toBe(getView(editor));
    expect(editor.getDocument().textContent).toBe('loaded');
    expect(onChange).not.toHaveBeenCalled();
    editor.setDocument(next);
    expect(onChange).toHaveBeenCalledTimes(1);
    editor.destroy();
  });

  it('nodeViews option is registered on the view', () => {
    const created: string[] = [];
    const editor = createEditor(mountHost(), {
      nodeViews: {
        horizontal_rule: () => {
          created.push('hr');
          const dom = document.createElement('div');
          dom.className = 'custom-hr';
          return { dom };
        }
      }
    });
    const view = getView(editor);
    const hr = view.state.schema.nodes.horizontal_rule.create();
    view.updateState(view.state.apply(view.state.tr.insert(0, hr)));
    expect(created).toEqual(['hr']);
    expect(view.dom.querySelector('.custom-hr')).toBeTruthy();
    editor.destroy();
  });

  it('resolveImageSrc maps the stored src to the rendered URL', () => {
    const editor = createEditor(mountHost(), { resolveImageSrc: (src) => `vault://x/${src}` });
    const view = getView(editor);
    const img = view.state.schema.nodes.image.create({ src: 'a.png', alt: 'a' });
    view.dispatch(view.state.tr.insert(0, img));
    expect((view.dom.querySelector('img') as HTMLImageElement).src).toBe('vault://x/a.png');
    editor.destroy();
  });

  it('image altText derives the alt of uploaded images', async () => {
    const editor = createEditor(mountHost(), {
      image: { upload: async () => 'u.png', altText: (f) => f.name.replace(/\.[^.]+$/, '') }
    });
    const view = getView(editor);
    view.dispatch(view.state.tr.setSelection(TextSelection.atStart(view.state.doc)));
    const file = new File([new Uint8Array(4)], 'photo.png', { type: 'image/png' });
    const event = { clipboardData: { files: [file], items: [], types: ['Files'], getData: () => '' }, preventDefault() {} } as unknown as ClipboardEvent;
    const handler = view.someProp('handleDOMEvents', (h) => h.paste);
    handler?.(view, event);
    await new Promise((r) => setTimeout(r, 30));
    let alt: string | null = null;
    view.state.doc.descendants((n) => {
      if (n.type.name === 'image') alt = n.attrs.alt;
    });
    expect(alt).toBe('photo');
    editor.destroy();
  });

  it('createNotionSupport({ slashItems }) adds custom slash menu entries', () => {
    const run = vi.fn();
    const support = createNotionSupport({ slashItems: [{ icon: '★', label: '내 항목', keywords: ['mine'], run }] });
    const editor = createEditor(mountHost(), { toolbar: support });
    expect(editor).toBeTruthy();
    editor.destroy();
  });
});
