import createDOMPurify from 'dompurify';
import { DOMSerializer } from 'prosemirror-model';

import { editorSchema } from '../schema';
import type { EditorDocument, EditorSchema } from '../types';

const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul'
];

const ALLOWED_ATTR = [
  'alt',
  'colspan',
  'data-language',
  'height',
  'href',
  'rowspan',
  'src',
  'style',
  'title',
  'width'
];

function getSanitizer() {
  return createDOMPurify(window);
}

export function sanitizeHtml(html: string) {
  return getSanitizer().sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    USE_PROFILES: { html: true }
  });
}

export function serializeHtml(doc: EditorDocument, schema: EditorSchema = editorSchema) {
  const serializer = DOMSerializer.fromSchema(schema);
  const fragment = serializer.serializeFragment(doc.content);
  const container = window.document.createElement('div');
  container.append(fragment);
  return sanitizeHtml(container.innerHTML);
}
