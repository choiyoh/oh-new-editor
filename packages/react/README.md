# @oh-new-editor/react

React 18 and 19 adapter for Oh New Editor.

## Install

```sh
pnpm add @oh-new-editor/react @oh-new-editor/core
```

React and React DOM are peer dependencies; use matching versions in your application.

## Use

```tsx
'use client'; // Required for the component below in Next.js App Router.

import { useRef, useState } from 'react';
import { OhNewEditor } from '@oh-new-editor/react';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import type { Editor } from '@oh-new-editor/core';
import '@oh-new-editor/core/style.css';

const options = { toolbar: createToolbarSupport() };

export function Example() {
  const editor = useRef<Editor | null>(null);
  const [value, setValue] = useState('<p>Hello</p>');
  return <OhNewEditor ref={editor} value={value} onChange={setValue} options={options} />;
}
```

The editor mounts in an effect and is destroyed on unmount. Server rendering produces an empty host; editing begins on the client. The published adapter retains a `use client` directive for Next.js.

Use `onReady(editor)` or the forwarded ref for the editor API. External `value` updates are deferred while focused and applied on blur; only the latest value is kept. Omitting `value` makes the component uncontrolled.

`options.readOnly` and `options.outputFormat` update live. Structural options (schema, plugins, toolbar, tables, Markdown, image upload, placeholder, messages) are read on mount. Change the component's `key` to recreate it with different structural options. Markdown requires `createMarkdownSupport()` from `@oh-new-editor/core/markdown`.

[Core API and optional features](https://github.com/choiyoh/oh-new-editor#readme)

## License

MIT.
