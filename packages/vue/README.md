# @oh-new-editor/vue

Vue 3 adapter for Oh New Editor.

## Install

```sh
pnpm add @oh-new-editor/vue @oh-new-editor/core
```

Vue is a peer dependency.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { OhNewEditor } from '@oh-new-editor/vue';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

const value = ref('<p>Hello</p>');
const options = { toolbar: createToolbarSupport() };
</script>

<template>
  <OhNewEditor v-model="value" :options="options" />
</template>
```

Use `v-model` (`modelValue` / `update:modelValue`) for controlled content, or `value` with the `change` event. External updates are deferred while focused and applied on blur; only the latest value is kept.

The editor is created in `onMounted` and destroyed on unmount. Imports and the empty host support server rendering, including Nuxt; the editor and HTML processing run on the client.

`options.readOnly` and `options.outputFormat` update live. Structural options (schema, plugins, toolbar, tables, Markdown, image upload, placeholder, messages) are read on mount; change `key` to recreate the editor. Markdown requires `createMarkdownSupport()` from `@oh-new-editor/core/markdown`.

[Core API and optional features](https://github.com/choiyoh/oh-new-editor#readme)

## License

MIT.
