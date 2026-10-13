import { redo, undo } from 'prosemirror-history';
import { NodeSelection } from 'prosemirror-state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditor } from '../src/editor';
import { createNotionSupport } from '../src/notion';
import { createToolbarSupport } from '../src/toolbar';
import { imageUploadPluginKey } from '../src/plugins/imageUpload';
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
afterEach(() => { for (const editor of editors.splice(0)) editor.destroy(); vi.restoreAllMocks(); });

function pasteImage(editor: Editor) {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: {
    files: [new File(['image'], 'image.png', { type: 'image/png' })], getData: () => ''
  } });
  editor.getView().dom.dispatchEvent(event);
}

describe('image upload permissions', () => {
  it.each(['paste', 'drop'] as const)('ignores image %s in a read-only editor', async (kind) => {
    const upload = vi.fn().mockResolvedValue('/image.png');
    const editor = mount({ readOnly: true, image: { upload } });
    if (kind === 'paste') pasteImage(editor);
    else {
      const event = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: { files: [new File(['image'], 'image.png', { type: 'image/png' })] } });
      editor.getView().dom.dispatchEvent(event);
    }
    await Promise.resolve();
    expect(upload).not.toHaveBeenCalled();
    expect(editor.getView().dom.querySelector('img')).toBeNull();
  });

  it('discards an upload completed after read-only is enabled', async () => {
    const result = deferred<string>();
    const upload = vi.fn(() => result.promise);
    const editor = mount({ image: { upload } });
    pasteImage(editor);
    await vi.waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    editor.setReadOnly(true);
    result.resolve('/image.png');
    await vi.waitFor(() => expect(imageUploadPluginKey.getState(editor.getView().state)!.find()).toHaveLength(0));
    expect(editor.getView().dom.querySelector('img')).toBeNull();
  });

  it('does not retry a failed upload after read-only is enabled', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('offline'));
    const editor = mount({ image: { upload } });
    pasteImage(editor);
    await vi.waitFor(() => expect(editor.getView().dom.querySelector('.oh-editor__upload-retry')).not.toBeNull());
    editor.setReadOnly(true);
    (editor.getView().dom.querySelector('.oh-editor__upload-retry') as HTMLButtonElement).click();
    await Promise.resolve();
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('handles an upload callback that throws before returning a promise', async () => {
    const editor = mount({ image: { upload: () => { throw new Error('offline'); } } });
    expect(() => pasteImage(editor)).not.toThrow();
    await vi.waitFor(() => expect(editor.getView().dom.querySelector('.oh-editor__upload-retry')).not.toBeNull());
    expect(editor.getView().dom.textContent).toContain('offline');
  });
});

describe('async UI callbacks', () => {
  it('reports rejected image prompts without changing alt text', async () => {
    const error = new Error('prompt failed');
    const onError = vi.fn();
    const editor = mount({ initialContent: '<img src="/image.png" alt="original">', prompt: async () => { throw error; }, onError });
    const view = editor.getView();
    let pos = 0;
    view.state.doc.descendants((node, position) => { if (node.type.name === 'image') pos = position; });
    const image = view.state.doc.nodeAt(pos)!;
    view.someProp('handleDoubleClickOn', (handler) => handler(view, pos, image, pos, new MouseEvent('dblclick'), true));
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
    expect(view.state.doc.nodeAt(pos)!.attrs.alt).toBe('original');
  });

  it('reports rejected slash commands', async () => {
    const error = new Error('command failed');
    const onError = vi.fn();
    const editor = mount({ onError, toolbar: createNotionSupport({ slashItems: [
      { icon: '★', label: 'Custom', keywords: ['custom'], run: async () => { throw error; } }
    ] }) });
    const view = editor.getView();
    view.dispatch(view.state.tr.insertText('/custom'));
    (view.dom.parentElement!.parentElement!.querySelector('.oh-editor__slash-item') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });

  it.each(['destroy', 'style'] as const)('does not refocus a disposed slash UI after %s', async (action) => {
    const pending = deferred<void>();
    const notion = createNotionSupport({ slashItems: [{ icon: '★', label: 'Custom', keywords: ['custom'], run(view) {
      const tr = view.state.tr.insert(0, view.state.schema.nodes.image.create({ src: '/image.png' }));
      view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, 0)));
      return pending.promise;
    } }] });
    const editor = mount({ styles: { notion, toolbar: createToolbarSupport() }, style: 'notion' });
    const view = editor.getView();
    view.dispatch(view.state.tr.insertText('/custom'));
    (view.dom.parentElement!.parentElement!.querySelector('.oh-editor__slash-item') as HTMLButtonElement).click();
    const focus = vi.spyOn(view, 'focus');
    if (action === 'destroy') editor.destroy();
    else editor.setStyle('toolbar');
    pending.resolve();
    await pending.promise;
    await Promise.resolve();
    expect(focus).not.toHaveBeenCalled();
  });
});

describe('AI history', () => {
  it.each(['image', 'horizontal_rule'])('streams at a selected %s boundary and restores the original document on undo', async (type) => {
    const editor = mount({ ai: {
      onGenerate: async () => '', async *onStream() { yield 'one '; yield 'two'; }
    } });
    const view = editor.getView();
    const schema = view.state.schema;
    const original = schema.node('doc', null, [schema.node(type, type === 'image' ? { src: '/image.png' } : null)]);
    editor.setDocument(original);
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, 0)));
    await editor.ai!.generate('write');
    expect(view.state.doc.childCount).toBe(2);
    expect(view.state.doc.child(0).textContent).toBe('one two');
    expect(view.state.doc.child(1).type.name).toBe(type);
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.eq(original)).toBe(true);
    expect(redo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.child(0).textContent).toBe('one two');
    expect(view.state.doc.childCount).toBe(2);
  });

  it.each(['image', 'horizontal_rule'])('removes the preview paragraph when cancelling at a %s boundary', async (type) => {
    const pending = deferred<string>();
    const editor = mount({ ai: {
      onGenerate: async () => '', async *onStream() { yield 'preview'; yield await pending.promise; }
    } });
    const view = editor.getView();
    const schema = view.state.schema;
    const original = schema.node('doc', null, [schema.node(type, type === 'image' ? { src: '/image.png' } : null)]);
    editor.setDocument(original);
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, 0)));
    const generation = editor.ai!.generate('write');
    await vi.waitFor(() => expect(view.state.doc.textContent).toBe('preview'));
    editor.ai!.cancel();
    pending.resolve('old');
    await generation;
    expect(view.state.doc.eq(original)).toBe(true);
    expect(undo(view.state, view.dispatch)).toBe(false);
  });

  it.each(['generate', 'stream'] as const)('undoes and redoes the whole %s result in one step', async (mode) => {
    const editor = mount({ initialContent: '<p>original</p>', ai: {
      onGenerate: async () => 'one two',
      ...(mode === 'stream' ? { async *onStream() { yield 'one '; yield 'two'; } } : {})
    } });
    const view = editor.getView();
    // A previous user edit must remain a separate undo step.
    view.dispatch(view.state.tr.insertText('user '));
    await editor.ai!.generate('write');
    expect(view.state.doc.textContent).toBe('user one twooriginal');
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('user original');
    expect(redo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('user one twooriginal');
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('original');
  });

  it('does not add cancelled stream previews to undo history', async () => {
    const pending = deferred<string>();
    const editor = mount({ initialContent: '<p>original</p>', ai: {
      onGenerate: async () => '', async *onStream() { yield 'preview'; yield await pending.promise; }
    } });
    const view = editor.getView();
    view.dispatch(view.state.tr.insertText('user '));
    const generation = editor.ai!.generate('write');
    await vi.waitFor(() => expect(view.state.doc.textContent).toContain('preview'));
    editor.ai!.cancel();
    pending.resolve('old');
    await generation;
    expect(view.state.doc.textContent).toBe('user original');
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('original');
    expect(undo(view.state, view.dispatch)).toBe(false);
  });

  it('keeps a failed stream partial result undoable and reports the failure', async () => {
    const error = new Error('stream failed');
    const onError = vi.fn();
    const editor = mount({ initialContent: '<p>original</p>', ai: {
      onGenerate: async () => '', onError,
      async *onStream() { yield 'partial'; throw error; }
    } });
    await editor.ai!.generate('write');
    const view = editor.getView();
    expect(onError).toHaveBeenCalledWith(error);
    expect(view.state.doc.textContent).toBe('partialoriginal');
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('original');
    expect(redo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('partialoriginal');
  });
});
