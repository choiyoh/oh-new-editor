import './style.css';

import { createEditor } from './editor';
import type { Editor, EditorOptions, EditorToolbarSupport } from './types';
import { Toolbar } from './ui/toolbar/Toolbar';

export function createToolbarSupport(): EditorToolbarSupport {
  return {
    createToolbar(view, options) {
      return new Toolbar(view, options);
    }
  };
}

export function createToolbarEditor(element: HTMLElement, options: EditorOptions = {}): Editor {
  return createEditor(element, {
    ...options,
    toolbar: options.toolbar ?? createToolbarSupport()
  });
}
