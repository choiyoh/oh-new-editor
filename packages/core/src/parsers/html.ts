import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';

import { editorSchema } from '../schema';
import type { EditorSchema } from '../types';
import { sanitizeHtml } from '../serializers/html';

const EMPTY_DOC_HTML = '<p></p>';

export function parseHtml(content?: string, schema: EditorSchema = editorSchema) {
  const container = document.createElement('div');
  container.innerHTML = sanitizeHtml(content?.trim() ? content : EMPTY_DOC_HTML);
  return ProseMirrorDOMParser.fromSchema(schema).parse(container);
}
