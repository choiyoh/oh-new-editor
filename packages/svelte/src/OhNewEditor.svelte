<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { createEditor, type Editor, type EditorOptions } from '@oh-new-editor/core';

  export let value: string | undefined = undefined;
  export let options: EditorOptions | undefined = undefined;

  let host: HTMLDivElement;
  let editor: Editor | null = null;
  let currentValue = value;
  let isFocused = false;
  let pendingValue: string | undefined;

  const dispatch = createEventDispatcher<{ change: string }>();

  onMount(() => {
    editor = createEditor(host, {
      ...options,
      initialContent: value ?? options?.initialContent
    });

    editor.on('change', () => {
      if (!editor) return;
      const nextValue = editor.getContent(options?.outputFormat ?? 'html');
      currentValue = nextValue;
      dispatch('change', nextValue);
    });

    editor.on('focus', () => {
      isFocused = true;
    });

    editor.on('blur', () => {
      isFocused = false;
      // Apply a value that arrived while the user was typing.
      const pending = pendingValue;
      pendingValue = undefined;
      if (editor && pending !== undefined && pending !== currentValue) {
        editor.setContent(pending, options?.outputFormat ?? 'html');
        currentValue = pending;
      }
    });
  });

  onDestroy(() => {
    editor?.destroy();
    editor = null;
  });

  $: if (editor && value !== undefined && value !== currentValue) {
    if (isFocused) {
      // Replacing content under the caret would jump the cursor; defer to blur.
      pendingValue = value;
    } else {
      editor.setContent(value, options?.outputFormat ?? 'html');
      currentValue = value;
    }
  }

  $: if (editor && options?.readOnly !== undefined) {
    editor.setReadOnly(options.readOnly);
  }

  $: if (editor && options?.outputFormat) {
    editor.setOutputFormat(options.outputFormat);
  }
</script>

<div bind:this={host}></div>
