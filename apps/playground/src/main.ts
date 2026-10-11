import { createEditor, type Editor } from '@oh-new-editor/core';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createTableSupport } from '@oh-new-editor/core/table';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

import './styles.css';

// Thin manual integration harness for the core package. The marketing site
// and the polished demo live in apps/website.

type Mode = 'toolbar' | 'notion';
type Output = 'markdown' | 'html';

const initialContent = `
  <h2>Playground</h2>
  <p>Manual harness for <strong>@oh-new-editor/core</strong>. Try markdown shortcuts, <code>/</code> commands in Notion mode, tables, links and images.</p>
  <ul><li><p>Tab / Shift-Tab nests list items</p></li><li><p>Right-click a table cell for the table menu</p></li></ul>
  <pre data-language="typescript"><code data-language="typescript">export const hello = (name: string) => \`Hello, \${name}\`;</code></pre>
`;

function required<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

const host = required<HTMLElement>('#editor');
const output = required<HTMLElement>('#output');
const modeSelect = required<HTMLSelectElement>('#mode');
const outputSelect = required<HTMLSelectElement>('#output-format');
const themeToggle = required<HTMLInputElement>('#dark');
const readOnlyToggle = required<HTMLInputElement>('#read-only');
const eventLog = required<HTMLElement>('#events');

const editor: Editor = createEditor(host, {
  initialContent,
  placeholder: 'Start typing…',
  table: createTableSupport({ maxRows: 12, maxCols: 8 }),
  markdown: createMarkdownSupport(),
  image: {
    upload: async (file) => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      return URL.createObjectURL(file);
    }
  },
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport()
  }
});

function renderOutput() {
  output.textContent = editor.getContent(outputSelect.value as Output);
}

function logEvent(name: string) {
  const line = `${new Date().toLocaleTimeString()}  ${name}`;
  eventLog.textContent = `${line}\n${eventLog.textContent ?? ''}`.split('\n').slice(0, 8).join('\n');
}

for (const name of ['change', 'focus', 'blur'] as const) {
  editor.on(name, () => logEvent(name));
}
editor.on('change', renderOutput);

modeSelect.addEventListener('change', () => editor.setStyle(modeSelect.value as Mode));
outputSelect.addEventListener('change', renderOutput);
readOnlyToggle.addEventListener('change', () => editor.setReadOnly(readOnlyToggle.checked));
themeToggle.addEventListener('change', () => {
  document.documentElement.dataset.theme = themeToggle.checked ? 'dark' : 'light';
});

themeToggle.checked = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = themeToggle.checked ? 'dark' : 'light';
renderOutput();

// Handy for poking at the instance from devtools.
Object.assign(window, { editor });
