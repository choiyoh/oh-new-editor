import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

function isEmptyDoc(doc: Parameters<typeof DecorationSet.create>[0]) {
  return doc.childCount === 1 && doc.firstChild?.isTextblock && doc.firstChild.content.size === 0;
}

export function createPlaceholderPlugin(text: string) {
  return new Plugin({
    props: {
      decorations(state) {
        if (!text || !isEmptyDoc(state.doc)) {
          return null;
        }

        const placeholder = document.createElement('span');
        placeholder.className = 'oh-editor__placeholder';
        placeholder.textContent = text;
        placeholder.setAttribute('aria-hidden', 'true');

        return DecorationSet.create(state.doc, [
          Decoration.widget(1, placeholder, {
            side: -1,
            ignoreSelection: true
          })
        ]);
      }
    }
  });
}
