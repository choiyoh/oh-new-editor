# @oh-new-editor/core

Framework-agnostic rich-text editor powered by ProseMirror. The core is headless; UI, Markdown, tables, and AI integration are opt-in.

## Install

```sh
pnpm add @oh-new-editor/core
```

## Use

```ts
import { createEditor, messagesKo } from '@oh-new-editor/core';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

const editor = createEditor(document.querySelector<HTMLElement>('#editor')!, {
  initialContent: '<p>Hello</p>',
  toolbar: createToolbarSupport(),
  messages: messagesKo,
});

editor.on('change', () => console.log(editor.getContent('html')));
// Call editor.destroy() when the host is removed.
```

Import `createMarkdownSupport` from `@oh-new-editor/core/markdown` and pass it as `options.markdown` for Markdown input/output. Import `createTableSupport` from `@oh-new-editor/core/table` and pass it as `options.table` for tables. `@oh-new-editor/core/notion` provides slash commands and a bubble toolbar. The `ai` entry exports `createEditor` and AI types; pass your streaming backend as `options.ai`.

Importing the package is safe during server rendering. Creating an editor or parsing/serializing HTML requires a browser DOM: call those APIs after the component mounts. Server imports do not sanitize HTML on their own.

Import `@oh-new-editor/core/style.css` once for built-in UI. Set `data-theme="dark"` on an ancestor for dark mode. Built-in UI defaults to English; `messagesKo` and `messagesZhCN` are available presets.

[API documentation and examples](https://github.com/choiyoh/oh-new-editor#readme)

## License

MIT.
