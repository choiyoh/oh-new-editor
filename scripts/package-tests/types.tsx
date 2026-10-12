import { createEditor, messagesKo, type EditorOptions } from '@oh-new-editor/core';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';
import { createTableSupport } from '@oh-new-editor/core/table';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import type { EditorAIOptions } from '@oh-new-editor/core/ai';
import { OhNewEditor as ReactEditor } from '@oh-new-editor/react';
import { OhNewEditor as VueEditor } from '@oh-new-editor/vue';
import { OhNewEditor as SvelteEditor, type OhNewEditorProps } from '@oh-new-editor/svelte';
import { mount } from 'svelte';

const options: EditorOptions = {
  markdown: createMarkdownSupport(),
  table: createTableSupport(),
  toolbar: createToolbarSupport(),
  messages: messagesKo,
};
createEditor(document.createElement('div'), options);
const react = <ReactEditor value="<p>Hello</p>" options={options} />;
const svelteProps: OhNewEditorProps = { options };
mount(SvelteEditor, { target: document.createElement('div'), props: svelteProps });
void [react, VueEditor, createNotionSupport];
export type AIOptions = EditorAIOptions;
