import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { Editor } from '../src/types';

export function getView(editor: Editor): EditorView {
  return (editor as unknown as { view: EditorView }).view;
}

export function mountHost() {
  const host = document.createElement('div');
  document.body.append(host);
  return host;
}

/** Types text the way the browser would, so input rules get a chance to run. */
export function typeText(view: EditorView, text: string) {
  for (const char of text) {
    const { from, to } = view.state.selection;
    const handled = view.someProp('handleTextInput', (handler) =>
      handler(view, from, to, char, () => view.state.tr.insertText(char, from, to))
    );
    if (!handled) {
      view.dispatch(view.state.tr.insertText(char, from, to));
    }
  }
}

export function pressKey(view: EditorView, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  view.someProp('handleKeyDown', (handler) => handler(view, event));
  return event;
}

export function setCursor(view: EditorView, pos: number) {
  view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(pos))));
}

export function findTextPos(view: EditorView, text: string) {
  let found = -1;
  view.state.doc.descendants((node, pos) => {
    if (found !== -1) return false;
    if (node.isText && node.text?.includes(text)) {
      found = pos + node.text.indexOf(text);
    }
    return true;
  });
  return found;
}
