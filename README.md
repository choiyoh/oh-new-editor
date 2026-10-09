# Oh New Editor

Framework-agnostic rich-text editor packages built on ProseMirror.

[한국어 문서](./README.ko.md)

## Overview

Oh New Editor provides a headless core plus optional UI and feature modules for building rich-text editing experiences across vanilla JavaScript, React, Vue, and Svelte.

## Packages

- `@oh-new-editor/core` — headless editor core
- `@oh-new-editor/core/toolbar` — fixed toolbar UI
- `@oh-new-editor/core/notion` — slash menu + bubble toolbar UI
- `@oh-new-editor/core/table` — table schema and editing support
- `@oh-new-editor/core/markdown` — markdown parse/serialize support
- `@oh-new-editor/react` — React wrapper
- `@oh-new-editor/vue` — Vue wrapper
- `@oh-new-editor/svelte` — Svelte wrapper

## Features

- Sanitized HTML input and output
- Optional markdown input and output
- Toolbar and Notion-style editing UIs
- Image upload, drag-and-drop, retry, alt text, and resize handles
- Tables with insert, resize, merge/split, row/column actions, and size guards
- CSS custom properties and dark mode via `data-theme="dark"`
- Thin framework adapters for React, Vue, and Svelte
- Built-in UI strings in English, Korean and Simplified Chinese

## Installation

```bash
pnpm add @oh-new-editor/core
```

Import optional features from subpath exports as needed.

## Quick start

### Headless core + toolbar

```ts
import { createEditor } from '@oh-new-editor/core';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import { createTableSupport } from '@oh-new-editor/core/table';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';
import '@oh-new-editor/core/style.css';

const editor = createEditor(document.getElementById('editor')!, {
  toolbar: createToolbarSupport(),
  table: createTableSupport({ maxRows: 50, maxCols: 20 }),
  markdown: createMarkdownSupport(),
  placeholder: 'Write something…',
  image: {
    upload: async (file) => {
      const url = await uploadFileSomewhere(file);
      return url;
    }
  },
  initialContent: '<p>Hello</p>'
});
```

### Notion-style UI

```ts
import { createEditor } from '@oh-new-editor/core';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createTableSupport } from '@oh-new-editor/core/table';
import '@oh-new-editor/core/style.css';

createEditor(document.getElementById('editor')!, {
  toolbar: createNotionSupport(),
  table: createTableSupport()
});
```

## Framework adapters

### React

```tsx
import { OhNewEditor } from '@oh-new-editor/react';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

export function Example() {
  return <OhNewEditor options={{ toolbar: createToolbarSupport() }} />;
}
```

### Vue

```ts
import { OhNewEditor } from '@oh-new-editor/vue';
```

### Svelte

```ts
import { OhNewEditor } from '@oh-new-editor/svelte';
```

## Core API

```ts
const editor = createEditor(element, options);

editor.getContent('html');
editor.getContent('markdown');
editor.setContent('<p>Hello</p>', 'html');
editor.setOutputFormat('markdown');
editor.setReadOnly(true);
editor.on('change', () => {}); // fires for document changes only
editor.destroy();
```

Link helpers work on the current selection (or the link under the cursor):

```ts
import { normalizeHref, removeLink, setLink } from '@oh-new-editor/core';

const href = normalizeHref('example.com'); // 'https://example.com'
```

## Localization

The built-in UI ships English strings by default. Pass a preset or a partial override:

```ts
import { createEditor, messagesKo } from '@oh-new-editor/core';

createEditor(element, { messages: messagesKo });
createEditor(element, { messages: { bold: 'Gras', italic: 'Italique' } });
```

Presets: `messagesKo`, `messagesZhCN`. Slash-command search understands English, Korean (including initial consonants such as `ㅈㅁ`) and Chinese keywords regardless of the UI language.

## Accessibility

Toolbar, bubble menu, table menu and link editor are keyboard operable: the toolbar is a single tab stop with arrow-key navigation, buttons respond to Enter/Space, the table menu opens with Shift+F10 / the Menu key inside a cell, and the slash menu exposes listbox semantics.

## Theming

Import the core stylesheet and override the provided tokens.

```css
.my-editor-scope {
  --oh-editor-bg: #ffffff;
  --oh-editor-primary: #7c3aed;
}

[data-theme='dark'] {
  --oh-editor-bg: #0f172a;
}
```

Set `data-theme="dark"` on any ancestor for the dark palette, or `data-theme="system"` to follow the OS setting.

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm --filter @oh-new-editor/core test
pnpm dev
```

## Notes

- `@oh-new-editor/core` is intentionally headless.
- Markdown support is opt-in via `@oh-new-editor/core/markdown`.
- Table support is opt-in via `@oh-new-editor/core/table`.
- Toolbar and Notion UIs are opt-in via `@oh-new-editor/core/toolbar` and `@oh-new-editor/core/notion`.
- Code block language selection is implemented, but syntax highlighting is not yet included.
- Markdown output can be lossy for some features; see `MARKDOWN_LOSS.md`.
