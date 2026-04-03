import { describe, expect, it } from 'vitest';

import { createEditor } from '../src/editor';

describe('editor lifecycle', () => {
  it('mounts into the host element', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const editor = createEditor(host, {
      initialContent: '<p>Hello</p>'
    });

    expect(host.classList.contains('oh-editor')).toBe(true);
    expect(host.querySelector('.oh-editor__content')).toBeTruthy();
    expect(host.querySelector('.ProseMirror')).toBeTruthy();

    editor.destroy();
  });

  it('supports content updates and round-trip html', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const editor = createEditor(host, {
      initialContent: '<p>Hello</p>'
    });

    editor.setContent('<p>Updated</p>');
    expect(editor.getContent('html')).toContain('Updated');

    editor.destroy();
  });

  it('cleans host content on destroy and allows remount', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const first = createEditor(host, {
      initialContent: '<p>First</p>'
    });
    first.destroy();

    expect(host.classList.contains('oh-editor')).toBe(false);
    expect(host.childElementCount).toBe(0);

    const second = createEditor(host, {
      initialContent: '<p>Second</p>'
    });
    expect(second.getContent('html')).toContain('Second');
    second.destroy();
  });

  it('survives repeated create/destroy cycles on same host', () => {
    const host = document.createElement('div');
    document.body.append(host);

    for (let index = 0; index < 5; index += 1) {
      const editor = createEditor(host, {
        initialContent: `<p>Cycle ${index}</p>`
      });
      editor.destroy();
      expect(host.childElementCount).toBe(0);
    }
  });

  it('does not keep host content after destroy during pending image upload', async () => {
    const host = document.createElement('div');
    document.body.append(host);

    let resolveUpload!: (value: string) => void;

    const editor = createEditor(host, {
      image: {
        upload: () =>
          new Promise<string>((resolve) => {
            resolveUpload = resolve;
          })
      }
    });

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = host.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file]
    });
    input?.dispatchEvent(new Event('change'));

    editor.destroy();
    resolveUpload('https://example.com/image.png');
    await Promise.resolve();

    expect(host.childElementCount).toBe(0);
  });
});
