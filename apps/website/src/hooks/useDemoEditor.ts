import { useCallback, useEffect, useRef, useState } from 'react';
import { createEditor, messagesKo, messagesZhCN, type Editor, type EditorMessages } from '@oh-new-editor/core';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createTableSupport } from '@oh-new-editor/core/table';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

type DemoMode = 'toolbar' | 'notion';

const initialContent = `
  <h2>Build only what you need</h2>
  <p>Oh New Editor keeps the core headless and moves heavier features behind opt-in entrypoints.</p>
  <p>Try tables, image upload, markdown-aware output, and code blocks with language selection.</p>
  <pre data-language="typescript"><code data-language="typescript">export function hello(name: string) {
  return \`Hello, \${name}\`;
}</code></pre>
`;

function messagesFor(language: string): Partial<EditorMessages> | undefined {
  if (language.startsWith('ko')) return messagesKo;
  if (language.startsWith('zh')) return messagesZhCN;
  return undefined;
}

export function useDemoEditor(
  hostRef: React.RefObject<HTMLElement | null>,
  { mode, language, placeholder }: { mode: DemoMode; language: string; placeholder: string },
) {
  const editorRef = useRef<Editor | null>(null);
  const contentRef = useRef(initialContent);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [markdownContent, setMarkdownContent] = useState('');

  // (Re)create the editor when the UI language changes, keeping the content.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const editor = createEditor(host, {
      table: createTableSupport({ maxRows: 12, maxCols: 8 }),
      markdown: createMarkdownSupport(),
      placeholder,
      initialContent: contentRef.current,
      messages: messagesFor(language),
      image: {
        upload: async (file: File) => {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          return URL.createObjectURL(file);
        },
      },
      styles: {
        toolbar: createToolbarSupport(),
        notion: createNotionSupport(),
      },
      style: modeRef.current,
    });
    editorRef.current = editor;

    const update = () => {
      contentRef.current = editor.getContent('html');
      setMarkdownContent(editor.getContent('markdown'));
    };
    editor.on('change', update);
    update();

    return () => {
      contentRef.current = editor.getContent('html');
      editor.destroy();
      editorRef.current = null;
    };
  }, [hostRef, language, placeholder]);

  const setStyle = useCallback((nextMode: DemoMode) => {
    editorRef.current?.setStyle(nextMode);
  }, []);

  return { markdownContent, setStyle };
}
