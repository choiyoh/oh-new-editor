<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { createEditor, type Editor, type EditorOptions } from '@oh-new-editor/core';

  export let value: string | undefined = undefined;
  export let options: EditorOptions | undefined = undefined;

  let host: HTMLDivElement;
  let editor: Editor | null = null;
  let currentValue = value;

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
  });

  onDestroy(() => {
    editor?.destroy();
    editor = null;
  });

  $: if (editor && value !== undefined && value !== currentValue) {
    editor.setContent(value, options?.outputFormat ?? 'html');
    currentValue = value;
  }
</script>

<div bind:this={host}></div>
