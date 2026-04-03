import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';

import { editorSchema } from '../schema';
import { sanitizeHtml } from '../serializers/html';

const EMPTY_DOC_HTML = '<p></p>';

export function parseHtml(content?: string) {
  const container = document.createElement('div');
  container.innerHTML = sanitizeHtml(content?.trim() ? content : EMPTY_DOC_HTML);
  return ProseMirrorDOMParser.fromSchema(editorSchema).parse(container);
}
