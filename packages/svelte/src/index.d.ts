import type { SvelteComponent } from 'svelte';
import type { EditorOptions } from '@oh-new-editor/core';

export interface OhNewEditorProps {
  value?: string;
  options?: EditorOptions;
}

export default class OhNewEditor extends SvelteComponent<OhNewEditorProps, { change: CustomEvent<string> }, {}> {}
export { OhNewEditor };
