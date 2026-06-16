import { useCallback, useEffect, useRef, useState } from 'react';
import { createEditor, type Editor } from '@oh-new-editor/core';
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

export function useDemoEditor(hostRef: React.RefObject<HTMLElement | null>) {
  const editorRef = useRef<Editor | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');

  const updateMarkdown = useCallback((editor: Editor) => {
    setMarkdownContent(editor.getContent('markdown'));
  }, []);

  // Initialize editor once
  useEffect(() => {
    const host = hostRef.current;
    if (!host || editorRef.current) return;

    const config = {
      table: createTableSupport({ maxRows: 12, maxCols: 8 }),
      markdown: createMarkdownSupport(),
      placeholder: 'Start typing…',
      initialContent,
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
    };

    const editor = createEditor(host, config);
    editorRef.current = editor;

    editor.on('change', () => {
      updateMarkdown(editor);
    });

    // Initial markdown
    updateMarkdown(editor);

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [hostRef, updateMarkdown]);

  const setStyle = useCallback((mode: DemoMode) => {
    editorRef.current?.setStyle(mode);
  }, []);

  return { markdownContent, setStyle };
}
