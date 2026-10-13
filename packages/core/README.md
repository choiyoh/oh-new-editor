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

## Replacing documents

`setContent(html)` and `setDocument(doc)` replace the document, reset undo history, and cancel pending AI generation. Late responses from the cancelled request are ignored.

Use the editor's schema when building a ProseMirror document. A different schema or invalid document is rejected before the current content is changed.

```ts
const schema = editor.getDocument().type.schema;
const doc = schema.node('doc', null, [
  schema.node('paragraph', null, schema.text('Loaded document')),
]);
editor.setDocument(doc, { silent: true }); // Does not emit change, including AI cancellation.
```

Hosts can access the ProseMirror view through `editor.getView()`. Configure `priorityPlugins` for handlers that run before built-in keymaps, `nodeViews` for custom node rendering (including images), `resolveImageSrc` for rendering stored image paths, and `prompt` for asynchronous image alt-text input. `image.altText(file)` customizes uploaded-image alt text. Pass `slashItems` to `createNotionSupport({ slashItems })` to add commands with `icon`, `label`, `keywords`, and `run(view)`.

Set `options.onError(error)` to receive failures from image alt prompts and custom slash commands. Without this callback, the editor logs UI failures to the console. AI backend failures use `options.ai.onError`.

Completed AI generation, including a streamed result, is one undoable edit. Cancelling a stream removes its preview without adding it to undo history. Image upload and retry require an editable view; uploads completed after switching to read-only are discarded.

## License

MIT.
