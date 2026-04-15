import './style.css';

import { createEditor } from './editor';
import type { Editor, EditorOptions, EditorToolbarSupport } from './types';
import { NotionUi } from './ui/notion/NotionUi';

export function createNotionSupport(): EditorToolbarSupport {
  return {
    createToolbar(view, options) {
      return new NotionUi(view, {
        readOnly: options.readOnly,
        onPickImage: options.onPickImage,
        onEditImageAlt: options.onEditImageAlt,
        insertActions: options.insertActions,
        tableLimits: options.tableLimits
      });
    }
  };
}

export function createNotionEditor(element: HTMLElement, options: EditorOptions = {}): Editor {
  return createEditor(element, {
    ...options,
    toolbar: options.toolbar ?? createNotionSupport()
  });
}
