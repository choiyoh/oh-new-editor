import { createEditor } from './editor';
import type { Editor, EditorMarkdownSupport, EditorOptions } from './types';

import { parseMarkdown } from './parsers/markdown';
import { serializeMarkdown } from './serializers/markdown';

export { parseMarkdown, serializeMarkdown };

export function createMarkdownSupport(): EditorMarkdownSupport {
  return {
    parse: parseMarkdown,
    serialize: serializeMarkdown
  };
}

export function createMarkdownEditor(element: HTMLElement, options: EditorOptions = {}): Editor {
  return createEditor(element, {
    ...options,
    markdown: options.markdown ?? createMarkdownSupport()
  });
}
