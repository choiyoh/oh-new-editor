import { createEditor, type Editor } from '@oh-new-editor/core';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createTableSupport } from '@oh-new-editor/core/table';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

import './styles.css';

type DemoMode = 'toolbar' | 'notion';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app container');
}

app.innerHTML = `
  <main class="landing-shell">
    <section class="hero-section">
      <div class="hero-copy">
        <span class="eyebrow">Headless core. Optional UI. Framework adapters.</span>
        <h1>Oh New Editor</h1>
        <p class="hero-summary">
          A ProseMirror-based editor toolkit with split markdown, table, toolbar, and Notion-style modules.
          Build the editing experience you need without shipping everything by default.
        </p>
        <div class="hero-actions">
          <a class="primary-button" href="#live-demo">Try the live demo</a>
          <a class="secondary-button" href="#packages">Explore packages</a>
        </div>
        <ul class="hero-metrics">
          <li><strong>Headless core</strong><span>Optional feature entrypoints</span></li>
          <li><strong>Framework ready</strong><span>React, Vue, Svelte adapters</span></li>
          <li><strong>Production guardrails</strong><span>Sanitization, tests, CI, size checks</span></li>
        </ul>
      </div>
      <div class="hero-card">
        <div class="hero-card__label">Why teams use it</div>
        <ul class="hero-card__list">
          <li>Start with a headless editor and add only the UI you want.</li>
          <li>Use toolbar or Notion-style controls without changing the core API.</li>
          <li>Enable markdown and tables only when your product needs them.</li>
        </ul>
      </div>
    </section>

    <section id="packages" class="section-block">
      <div class="section-heading">
        <span class="eyebrow">Package architecture</span>
        <h2>Composable by default</h2>
        <p>The root package stays headless. Heavier features ship through opt-in subpath exports.</p>
      </div>
      <div class="package-grid">
        <article class="package-card">
          <h3>@oh-new-editor/core</h3>
          <p>Headless editor core, commands, lifecycle, sanitization, and image flows.</p>
        </article>
        <article class="package-card">
          <h3>@oh-new-editor/core/toolbar</h3>
          <p>Traditional fixed toolbar UI with formatting, table actions, and code language controls.</p>
        </article>
        <article class="package-card">
          <h3>@oh-new-editor/core/notion</h3>
          <p>Slash menu and bubble toolbar for a lightweight Notion-style editing experience.</p>
        </article>
        <article class="package-card">
          <h3>@oh-new-editor/core/table</h3>
          <p>Opt-in table schema, resize, merge/split, and row/column guard support.</p>
        </article>
        <article class="package-card">
          <h3>@oh-new-editor/core/markdown</h3>
          <p>Optional markdown parsing and serialization when HTML alone is not enough.</p>
        </article>
        <article class="package-card">
          <h3>React / Vue / Svelte</h3>
          <p>Thin wrappers for integrating the same editor configuration into framework apps.</p>
        </article>
      </div>
    </section>

    <section class="section-block feature-band">
      <div class="section-heading">
        <span class="eyebrow">Included capabilities</span>
        <h2>Built to cover the real editing surface</h2>
      </div>
      <div class="feature-grid">
        <article class="feature-card"><h3>Images</h3><p>Upload, drag-and-drop, retry failed uploads, edit alt text, and resize in place.</p></article>
        <article class="feature-card"><h3>Tables</h3><p>Insert, resize, merge, split, and guard row/column growth with configurable limits.</p></article>
        <article class="feature-card"><h3>Markdown</h3><p>Keep markdown support opt-in so consumers only pay for the format when they need it.</p></article>
        <article class="feature-card"><h3>Theming</h3><p>Use CSS custom properties and dark mode with <code>data-theme=&quot;dark&quot;</code>.</p></article>
      </div>
    </section>

    <section id="live-demo" class="section-block live-demo-section">
      <div class="section-heading">
        <span class="eyebrow">Live demo</span>
        <h2>Switch between toolbar and Notion-style UI</h2>
        <p>The same core editor powers both modes. Tables, markdown support, images, and dark-mode-ready styles stay enabled.</p>
      </div>

      <div class="demo-layout">
        <aside class="demo-sidebar">
          <div class="demo-mode-toggle" role="tablist" aria-label="Editor mode">
            <button class="demo-mode-button is-active" data-mode="toolbar" role="tab" aria-selected="true" aria-controls="editor-host" tabindex="0">Toolbar mode</button>
            <button class="demo-mode-button" data-mode="notion" role="tab" aria-selected="false" aria-controls="editor-host" tabindex="-1">Notion mode</button>
          </div>

          <div class="demo-panel">
            <h3>What to try</h3>
            <ul>
              <li>Paste formatted HTML or a table.</li>
              <li>Upload or drag an image, then resize it.</li>
              <li>Insert a code block and change its language.</li>
              <li>Switch modes without changing the core editor API.</li>
            </ul>
          </div>

          <div class="demo-panel code-panel">
            <h3>Current setup</h3>
            <pre><code id="demo-config"></code></pre>
          </div>
        </aside>

        <div class="demo-stage-wrapper">
          <div class="demo-stage">
            <div class="demo-stage__header">
              <div class="demo-stage__header-main">
                <span id="demo-badge" class="demo-badge">Document editor</span>
                <strong id="demo-title">Product brief</strong>
                <p id="demo-description">Classic editor chrome with a document-style canvas and integrated toolbar.</p>
              </div>
              <div class="demo-stage__header-controls">
                <span id="demo-status" class="demo-status">Autosave on</span>
                <label class="theme-toggle">
                  <input id="theme-toggle" type="checkbox" />
                  <span class="toggle-track" aria-hidden="true"></span>
                  <span class="toggle-label">Dark theme</span>
                </label>
              </div>
            </div>
            <div id="editor-host" class="demo-editor" role="tabpanel" aria-label="Editor"></div>
          </div>

          <div class="demo-preview">
            <div class="demo-preview__header">
              <span class="demo-badge">Markdown Preview</span>
              <strong>Live Output</strong>
              <p>WYSIWYG edits are serialized to markdown in real-time.</p>
            </div>
            <div class="demo-preview__body">
              <pre><code id="markdown-preview"></code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
`;

const editorHost = document.querySelector<HTMLElement>('#editor-host');
const configCode = document.querySelector<HTMLElement>('#demo-config');
const demoBadge = document.querySelector<HTMLElement>('#demo-badge');
const demoStatus = document.querySelector<HTMLElement>('#demo-status');
const demoTitle = document.querySelector<HTMLElement>('#demo-title');
const demoDescription = document.querySelector<HTMLElement>('#demo-description');
const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
const themeToggle = document.querySelector<HTMLInputElement>('#theme-toggle');
const markdownPreview = document.querySelector<HTMLElement>('#markdown-preview');

if (!editorHost || !configCode || !demoBadge || !demoStatus || !demoTitle || !demoDescription || !themeToggle || !markdownPreview) {
  throw new Error('Missing demo UI elements');
}

const editorHostElement = editorHost;
const configCodeElement = configCode;
const demoBadgeElement = demoBadge;
const demoStatusElement = demoStatus;
const demoTitleElement = demoTitle;
const demoDescriptionElement = demoDescription;
const themeToggleElement = themeToggle;
const markdownPreviewElement = markdownPreview;

let editor: Editor | null = null;
let mode: DemoMode = 'toolbar';

const editorConfig = {
  table: createTableSupport({ maxRows: 12, maxCols: 8 }),
  markdown: createMarkdownSupport(),
  placeholder: 'Start typing…',
  initialContent: '',
  image: {
    upload: async (file: File) => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      return URL.createObjectURL(file);
    }
  },
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport()
  }
};

const initialContent = `
  <h2>Build only what you need</h2>
  <p>Oh New Editor keeps the core headless and moves heavier features behind opt-in entrypoints.</p>
  <p>Try tables, image upload, markdown-aware output, and code blocks with language selection.</p>
  <pre data-language="typescript"><code data-language="typescript">export function hello(name: string) {
  return \`Hello, \${name}\`;
}</code></pre>
`;

editorConfig.initialContent = initialContent;

function updateModeUi(currentMode: DemoMode) {
  for (const button of modeButtons) {
    const active = button.dataset.mode === currentMode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  }

  if (currentMode === 'notion') {
    demoBadgeElement.textContent = 'Notion-style editor';
    demoTitleElement.textContent = 'Working notes';
    demoDescriptionElement.textContent = 'A lighter document flow with slash commands, bubble formatting, and fewer visible controls.';
    demoStatusElement.textContent = 'Focused writing mode';
  } else {
    demoBadgeElement.textContent = 'Document editor';
    demoTitleElement.textContent = 'Product brief';
    demoDescriptionElement.textContent = 'Classic editor chrome with a document-style canvas and integrated toolbar.';
    demoStatusElement.textContent = 'Autosave on';
  }

  editorHostElement.dataset.mode = currentMode;

  configCodeElement.textContent = JSON.stringify(
    {
      styles: {
        toolbar: 'createToolbarSupport()',
        notion: 'createNotionSupport()'
      },
      currentMode,
      table: 'createTableSupport({ maxRows: 12, maxCols: 8 })',
      markdown: 'createMarkdownSupport()',
      image: 'upload(file) => Promise<string>'
    },
    null,
    2
  );
}

function updateMarkdownPreview() {
  if (!editor || !markdownPreviewElement) return;
  markdownPreviewElement.textContent = editor.getContent('markdown');
}

function mountEditor(nextMode: DemoMode) {
  if (!editor) {
    editor = createEditor(editorHostElement, editorConfig);
    editor.on('change', () => {
      updateMarkdownPreview();
    });
  }
  editor.setStyle(nextMode);
  mode = nextMode;
  updateModeUi(nextMode);
  updateMarkdownPreview();
}

for (const button of modeButtons) {
  button.addEventListener('click', () => {
    const nextMode = button.dataset.mode as DemoMode;
    if (nextMode === mode) return;
    mountEditor(nextMode);
  });
}

themeToggleElement.addEventListener('change', () => {
  document.documentElement.dataset.theme = themeToggleElement.checked ? 'dark' : 'light';
});

document.documentElement.dataset.theme = 'light';
mountEditor(mode);
