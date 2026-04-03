import { Plugin } from 'prosemirror-state';

import { sanitizeHtml } from '../serializers/html';

export function createPastePlugin() {
  return new Plugin({
    props: {
      transformPastedHTML(html) {
        return sanitizeHtml(html);
      }
    }
  });
}
