import { history } from 'prosemirror-history';

export function createHistoryPlugin() {
  return history();
}
