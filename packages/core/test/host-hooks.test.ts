import { NodeSelection, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { describe, expect, it, vi } from 'vitest';

import { createEditor } from '../src/editor';
import { createNotionSupport } from '../src/notion';
import type { EditorToolbarSupport } from '../src/types';
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

  it('lets the host override the built-in image node view', () => {
    const imageView = vi.fn(() => ({ dom: document.createElement('img') }));
    const editor = createEditor(mountHost(), {
      initialContent: '<p><img src="/a.png" alt="original"></p>',
      nodeViews: { image: imageView }
    });
    expect(imageView).toHaveBeenCalledTimes(1);
    editor.destroy();
  });

  it.each(['unchanged', 'replaced', 'readOnly', 'selectionMoved', 'destroyed'] as const)(
    'handles an async alt response when the editor is %s', async (scenario) => {
      let resolvePrompt!: (value: string | null) => void;
      const prompt = vi.fn(() => new Promise<string | null>((resolve) => { resolvePrompt = resolve; }));
      let editAlt!: NonNullable<Parameters<EditorToolbarSupport['createToolbar']>[1]['onEditImageAlt']>;
      const editor = createEditor(mountHost(), {
        initialContent: '<p><img src="/a.png" alt="original"></p>',
        prompt,
        toolbar: {
          createToolbar(_view, options) {
            editAlt = options.onEditImageAlt!;
            return { element: document.createElement('div'), sync() {}, destroy() {}, setReadOnly() {} };
          }
        }
      });
      try {
        const view = editor.getView();
        const schema = view.state.schema;
        editor.setDocument(schema.nodes.doc.create(null, [
          schema.nodes.image.create({ src: '/a.png', alt: 'original' }),
          schema.nodes.paragraph.create()
        ]), { silent: true });
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, 0)));
        const response = editAlt();
        expect(prompt).toHaveBeenCalledWith(expect.any(String), 'original');
        if (scenario === 'replaced') {
          const replacement = view.state.schema.nodes.image.create({ src: '/b.png', alt: 'replacement' });
          const tr = view.state.tr.replaceWith(0, 1, replacement);
          view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, 0)));
        } else if (scenario === 'readOnly') {
          editor.setReadOnly(true);
        } else if (scenario === 'selectionMoved') {
          view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
        } else if (scenario === 'destroyed') {
          editor.destroy();
        }
        resolvePrompt('  new alt  ');
        await response;
        const image = view.state.doc.nodeAt(0)!;
        expect(image.attrs.alt).toBe(scenario === 'unchanged' ? 'new alt' : scenario === 'replaced' ? 'replacement' : 'original');
        if (scenario === 'replaced') expect(image.attrs.src).toBe('/b.png');
      } finally {
        if (scenario !== 'destroyed') editor.destroy();
      }
    }
  );

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

  it('searches and executes a custom slash command', async () => {
    const run = vi.fn((view: ReturnType<typeof getView>) => view.dispatch(view.state.tr.insertText('custom result')));
    const support = createNotionSupport({ slashItems: [{ icon: '★', label: '내 항목', keywords: ['mine'], run }] });
    const host = mountHost();
    const editor = createEditor(host, { toolbar: support });
    try {
      const view = editor.getView();
      view.dispatch(view.state.tr.insertText('/mine'));
      const labels = Array.from(host.querySelectorAll('.oh-editor__slash-item-label'));
      expect(labels.map((label) => label.textContent)).toEqual(['내 항목']);
      (labels[0].closest('button') as HTMLButtonElement).click();
      await vi.waitFor(() => expect(view.state.doc.textContent).toBe('custom result'));
      expect(run).toHaveBeenCalledWith(view);
    } finally {
      editor.destroy();
    }
  });
});
