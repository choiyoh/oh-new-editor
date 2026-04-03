import { marked } from 'marked';

import { parseHtml } from './html';

export function parseMarkdown(content?: string) {
  const result = marked.parse(content?.trim() ? content : '');

  if (typeof result !== 'string') {
    throw new TypeError('Expected marked.parse() to return a string in sync mode.');
  }

  return parseHtml(result);
}
