import { TextSelection } from 'prosemirror-state';
import { describe, expect, it, vi } from 'vitest';

import { createEditor } from '../src/editor';
import { messagesKo } from '../src/i18n';
import { createNotionSupport } from '../src/notion';
import { createTableSupport } from '../src/table';
import { createToolbarSupport } from '../src/toolbar';
import { getView, mountHost } from './helpers';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function pickFile(host: HTMLElement, file: File) {
  const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  input.dispatchEvent(new Event('change'));
}

describe('image upload', () => {
  it('retries in place without leaving a stale placeholder', async () => {
    const host = mountHost();
    const upload = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('https://cdn.example.com/a.png');
    const editor = createEditor(host, { image: { upload } });

    pickFile(host, new File(['x'], 'a.png', { type: 'image/png' }));
    await flush();
    expect(host.querySelectorAll('.oh-editor__upload-placeholder')).toHaveLength(1);
    expect(host.querySelector('.oh-editor__upload-placeholder')?.textContent).toContain('offline');

    host.querySelector<HTMLButtonElement>('.oh-editor__upload-retry')!.click();
    expect(host.querySelectorAll('.oh-editor__upload-placeholder')).toHaveLength(1);
    await flush();

    expect(host.querySelectorAll('.oh-editor__upload-placeholder')).toHaveLength(0);
    expect(editor.getContent('html')).toContain('src="https://cdn.example.com/a.png"');
    editor.destroy();
  });

  it('lets validation errors be dismissed', () => {
    const host = mountHost();
    const editor = createEditor(host, { image: { upload: vi.fn() } });

    pickFile(host, new File(['x'], 'notes.txt', { type: 'text/plain' }));
    expect(host.querySelector('.oh-editor__upload-retry')).toBeNull();
    host.querySelector<HTMLButtonElement>('.oh-editor__upload-dismiss')!.click();
    expect(host.querySelector('.oh-editor__upload-placeholder')).toBeNull();
    editor.destroy();
  });

  it('keeps text when the clipboard has both markup and an image', () => {
    const host = mountHost();
    const upload = vi.fn();
    const editor = createEditor(host, { image: { upload } });
    const view = getView(editor);

    const data = {
      files: [new File(['x'], 'shot.png', { type: 'image/png' })],
      getData: (type: string) => (type === 'text/html' ? '<p>from office</p>' : 'from office')
    };
    const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', { value: data });
    view.dom.dispatchEvent(event);

    expect(upload).not.toHaveBeenCalled();
    editor.destroy();
  });
});

describe('messages', () => {
  it('translates the toolbar, link editor and table menu', () => {
    const host = mountHost();
    const editor = createEditor(host, {
      toolbar: createToolbarSupport(),
      table: createTableSupport(),
      messages: messagesKo
    });

    expect(host.querySelector('button[aria-label="굵게"]')).toBeTruthy();
    expect(host.querySelector('button[aria-label="표 삽입"]')).toBeTruthy();
    expect(host.querySelector('button[aria-label="행 삭제"]')).toBeTruthy();
    expect(Array.from(host.querySelectorAll('select[aria-label="블록 유형"] option')).map((o) => o.textContent)).toContain('제목 2');
    expect(host.querySelector('.oh-editor__table-menu')?.textContent).toContain('위에 행 추가');
    editor.destroy();
  });

  it('translates slash items and keeps one heading per category', () => {
    const host = mountHost();
    const editor = createEditor(host, {
      toolbar: createNotionSupport(),
      table: createTableSupport(),
      image: { upload: vi.fn() },
      messages: messagesKo
    });
    const view = getView(editor);
    view.dispatch(view.state.tr.insertText('/'));

    const categories = Array.from(host.querySelectorAll('.oh-editor__slash-category')).map((el) => el.textContent);
    expect(categories).toEqual(['기본', '미디어', '고급']);
    expect(host.querySelector('.oh-editor__slash-item-label')?.textContent).toBe('텍스트');
    editor.destroy();
  });
});

describe('notion bubble', () => {
  it('stays visible when re-shown while its exit animation is pending', () => {
    const host = mountHost();
    const editor = createEditor(host, { toolbar: createNotionSupport(), initialContent: '<p>hello world</p>' });
    const view = getView(editor);
    const bubble = host.querySelector<HTMLElement>('.oh-editor__bubble-toolbar')!;
    const select = (from: number, to: number) =>
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));

    select(1, 6);
    expect(bubble.hidden).toBe(false);

    // Pretend an exit animation is running, then re-select before it ends.
    const style = vi.spyOn(window, 'getComputedStyle').mockReturnValue({ animationName: 'oh-editor-bubble-exit' } as CSSStyleDeclaration);
    select(3, 3);
    select(1, 6);
    style.mockRestore();

    bubble.dispatchEvent(new Event('animationend'));
    expect(bubble.hidden).toBe(false);
    editor.destroy();
  });
});

describe('ai', () => {
  it('reports generation errors through onError', async () => {
    const onError = vi.fn();
    const editor = createEditor(mountHost(), {
      ai: { onGenerate: () => Promise.reject(new Error('quota')), onError }
    });
    await editor.ai!.generate('write');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'quota' }));
    expect(editor.ai!.isGenerating).toBe(false);
    editor.destroy();
  });
});
