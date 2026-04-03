import { createEditor } from '@oh-new-editor/core';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createTableSupport } from '@oh-new-editor/core/table';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app container');
}

app.innerHTML = `
  <main style="max-width: 960px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
    <h1 style="margin: 0 0 12px; font-size: 32px;">Oh New Editor Playground</h1>
    <p style="margin: 0 0 20px; color: #475569;">Notion-style MVP with slash menu and bubble toolbar.</p>
    <div id="editor"></div>
  </main>
`;

const editorHost = document.querySelector<HTMLElement>('#editor');

if (!editorHost) {
  throw new Error('Missing #editor container');
}

createEditor(editorHost, {
  toolbar: createNotionSupport(),
  table: createTableSupport(),
  placeholder: 'Write something…',
  initialContent: '<p>Hello from ProseMirror.</p>',
  image: {
    upload: async (file: File) => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      return URL.createObjectURL(file);
    }
  }
});
