import { marked } from 'marked';

import { editorSchema } from '../schema';
import type { EditorSchema } from '../types';
import { parseHtml } from './html';

export function parseMarkdown(content?: string, schema: EditorSchema = editorSchema) {
  const result = marked.parse(content?.trim() ? content : '');

  if (typeof result !== 'string') {
    throw new TypeError('Expected marked.parse() to return a string in sync mode.');
  }

  // marked marks fenced code with class="language-x"; the sanitizer drops
  // `class`, so carry the language over as the attribute the schema reads.
  const html = result.replace(/<code class="language-([\w+#.-]+)">/g, '<code data-language="$1">');
  return parseHtml(html, schema);
}
