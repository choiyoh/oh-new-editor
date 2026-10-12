# @oh-new-editor/svelte

Svelte 5 adapter for Oh New Editor.

## Install

```sh
pnpm add @oh-new-editor/svelte @oh-new-editor/core
```

Svelte is a peer dependency. Use a Svelte-aware bundler, such as Vite with `@sveltejs/vite-plugin-svelte` or SvelteKit. The `svelte` export condition provides the component source and generated declarations for client and server compilation. Compiled ESM/CJS entries are also included for client use.

## Use

```svelte
<script lang="ts">
  import { OhNewEditor } from '@oh-new-editor/svelte';
  import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
  import '@oh-new-editor/core/style.css';

  let value = '<p>Hello</p>';
  const options = { toolbar: createToolbarSupport() };
</script>

<OhNewEditor {value} {options} on:change={(event) => value = event.detail} />
```

The adapter emits `change` with the serialized content in `event.detail`. External values are deferred while focused and applied on blur; only the latest value is kept.

In SvelteKit, use the same component import: the editor is created in `onMount` and destroyed on unmount. Server rendering produces an empty host, and editing begins on the client. Creating an editor and parsing/serializing HTML require a browser DOM.

`options.readOnly` and `options.outputFormat` update live. Structural options (schema, plugins, toolbar, tables, Markdown, image upload, placeholder, messages) are read on mount. Use a `{#key ...}` block to recreate the component when structural configuration changes. Markdown requires `createMarkdownSupport()` from `@oh-new-editor/core/markdown`.

[Core API and optional features](https://github.com/choiyoh/oh-new-editor#readme)

## License

MIT.
