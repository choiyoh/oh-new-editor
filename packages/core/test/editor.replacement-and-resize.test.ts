import { Schema } from 'prosemirror-model';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createEditor } from '../src/editor';
import type { Editor } from '../src/types';
import { mountHost } from './helpers';

const editors: Editor[] = [];
function mount(options: Parameters<typeof createEditor>[1] = {}) {
  const editor = createEditor(mountHost(), options);
  editors.push(editor);
  return editor;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}
afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
  vi.restoreAllMocks();
});

describe('document replacement', () => {
  it.each(['setContent', 'setDocument'] as const)('cancels pending AI on %s', async (method) => {
    const result = deferred<string>();
    let signal!: AbortSignal;
    const editor = mount({ ai: { onGenerate: (_prompt, _context, requestSignal) => {
      signal = requestSignal;
      return result.promise;
    } } });
    const pending = editor.ai!.generate('old document');
    if (method === 'setContent') editor.setContent('<p>new document</p>');
    else {
      const schema = editor.getDocument().type.schema;
      editor.setDocument(schema.node('doc', null, [schema.node('paragraph', null, schema.text('new document'))]));
    }
    expect(signal.aborted).toBe(true);
    result.resolve('OLD RESPONSE');
    await pending;
    expect(editor.getDocument().textContent).toBe('new document');
    expect(editor.ai!.isGenerating).toBe(false);
    expect(editor.getView().editable).toBe(true);
  });

  it('does not let an old request unlock or cancel the replacement request', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const onGenerate = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const editor = mount({ ai: { onGenerate } });
    const old = editor.ai!.generate('first');
    editor.setContent('<p>new document</p>');
    const current = editor.ai!.generate('second');
    first.resolve('OLD');
    await old;
    expect(editor.ai!.isGenerating).toBe(true);
    expect(editor.getView().editable).toBe(false);
    expect(editor.getDocument().textContent).toBe('new document');
    second.resolve('NEW');
    await current;
    expect(editor.getDocument().textContent).toBe('NEWnew document');
    expect(editor.ai!.isGenerating).toBe(false);
  });

  it('rejects a foreign schema before changing the document or cancelling AI', async () => {
    const result = deferred<string>();
    const editor = mount({ initialContent: '<p>original</p>', ai: { onGenerate: () => result.promise } });
    const schema = editor.getDocument().type.schema;
    const foreign = new Schema({ nodes: schema.spec.nodes, marks: schema.spec.marks });
    const pending = editor.ai!.generate('write');
    expect(() => editor.setDocument(foreign.node('doc', null, [foreign.node('paragraph')]))).toThrow(/schema/);
    expect(editor.getContent()).toBe('<p>original</p>');
    expect(editor.ai!.isGenerating).toBe(true);
    result.resolve('');
    await pending;
  });

  it('rejects a non-document node from the correct schema', () => {
    const editor = mount({ initialContent: '<p>original</p>' });
    const schema = editor.getDocument().type.schema;
    expect(() => editor.setDocument(schema.node('paragraph'))).toThrow(/schema/);
    expect(editor.getContent()).toBe('<p>original</p>');
  });

  it('rejects invalid content in a document from the correct schema', () => {
    const editor = mount({ initialContent: '<p>original</p>' });
    const schema = editor.getDocument().type.schema;
    expect(() => editor.setDocument(schema.topNodeType.create())).toThrow();
    expect(editor.getContent()).toBe('<p>original</p>');
  });

  it('silently replaces a document while a stream is pending without leaking old chunks', async () => {
    const next = deferred<string>();
    const editor = mount({ ai: {
      onGenerate: async () => '',
      async *onStream() { yield 'partial'; yield await next.promise; }
    } });
    const pending = editor.ai!.generate('write');
    await vi.waitFor(() => expect(editor.getDocument().textContent).toBe('partial'));
    const onChange = vi.fn();
    editor.on('change', onChange);
    const schema = editor.getDocument().type.schema;
    editor.setDocument(schema.node('doc', null, [schema.node('paragraph', null, schema.text('new document'))]), { silent: true });
    expect(onChange).not.toHaveBeenCalled();
    next.resolve('OLD CHUNK');
    await pending;
    expect(editor.getDocument().textContent).toBe('new document');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the AI edit lock when read-only is toggled during generation', async () => {
    const result = deferred<string>();
    const editor = mount({ ai: { onGenerate: () => result.promise } });
    const pending = editor.ai!.generate('write');
    editor.setReadOnly(true);
    editor.setReadOnly(false);
    expect(editor.getView().editable).toBe(false);
    result.resolve('done');
    await pending;
    expect(editor.getView().editable).toBe(true);
  });
});

describe('image resize lifecycle', () => {
  function setup() {
    const editor = mount({ initialContent: '<img src="/image.png">' });
    const view = editor.getView();
    const image = view.dom.querySelector<HTMLImageElement>('img')!;
    const handle = view.dom.querySelector<HTMLButtonElement>('.oh-editor__image-resize-handle')!;
    vi.spyOn(image, 'getBoundingClientRect').mockImplementation(() => ({
      width: Number.parseFloat(image.style.width) || 100,
      height: Number.parseFloat(image.style.height) || 100
    }) as DOMRect);
    let pos = 0;
    view.state.doc.descendants((node, position) => { if (node.type.name === 'image') pos = position; });
    return { editor, image, handle, attrs: () => editor.getDocument().nodeAt(pos)!.attrs };
  }
  const start = (handle: HTMLElement) => handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
  const move = () => window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
  const end = () => window.dispatchEvent(new MouseEvent('mouseup'));

  it('still commits a resize while editable', () => {
    const { handle, attrs } = setup();
    start(handle); move(); end();
    expect(attrs()).toMatchObject({ width: '150', height: '150' });
  });

  it.each(['beforeStart', 'beforeMove', 'beforeEnd'] as const)('does not resize when read-only is enabled %s', (timing) => {
    const { editor, image, handle, attrs } = setup();
    if (timing === 'beforeStart') editor.setReadOnly(true);
    start(handle);
    if (timing === 'beforeMove') editor.setReadOnly(true);
    move();
    if (timing === 'beforeEnd') editor.setReadOnly(true);
    end();
    expect(attrs()).toMatchObject({ width: null, height: null });
    expect(image.style.width).toBe('');
    expect(image.style.height).toBe('');
  });
});
