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

const ALLOWED_CSS_PROPERTIES = ['font-size', 'background-color'];

function createSanitizer() {
  const purify = createDOMPurify(window);

  purify.addHook('afterSanitizeAttributes', (node) => {
    if (!(node instanceof HTMLElement) || !node.hasAttribute('style')) return;

    const el = node as HTMLElement;
    const allowed: string[] = [];

    for (let i = 0; i < el.style.length; i++) {
      const camel = el.style[i];
      const dashed = camel.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      if (ALLOWED_CSS_PROPERTIES.includes(dashed)) {
        allowed.push(`${dashed}:${el.style.getPropertyValue(dashed)}`);
      }
    }

    if (allowed.length > 0) {
      el.setAttribute('style', allowed.join(';'));
    } else {
      el.removeAttribute('style');
    }
  });

  return purify;
}

const sanitizer = createSanitizer();

export function sanitizeHtml(html: string) {
  return sanitizer.sanitize(html, {
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
