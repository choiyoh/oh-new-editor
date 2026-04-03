import { baseKeymap, chainCommands, exitCode } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, sinkListItem } from 'prosemirror-schema-list';

import {
  insertCodeBlock,
  insertHR,
  setHeading,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleCode,
  toggleItalic,
  toggleOrderedList,
  toggleStrike,
  toggleUnderline
} from '../commands';
import { editorSchema } from '../schema';

export function createKeymapPlugin() {
  return keymap({
    'Mod-b': toggleBold(),
    'Mod-i': toggleItalic(),
    'Mod-u': toggleUnderline(),
    'Shift-Mod-5': toggleStrike(),
    'Mod-`': toggleCode(),
    'Mod-Alt-1': setHeading(1),
    'Mod-Alt-2': setHeading(2),
    'Mod-Alt-3': setHeading(3),
    'Mod-Shift-7': toggleOrderedList(),
    'Mod-Shift-8': toggleBulletList(),
    'Mod-Alt-0': toggleBlockquote(),
    'Mod-Alt--': insertHR(),
    'Shift-Ctrl-\\': insertCodeBlock(),
    'Mod-z': undo,
    'Shift-Mod-z': redo,
    'Mod-y': redo,
    Tab: sinkListItem(editorSchema.nodes.list_item),
    'Shift-Tab': liftListItem(editorSchema.nodes.list_item),
    Enter: chainCommands(exitCode, baseKeymap.Enter)
  });
}

export function createBaseKeymapPlugin() {
  return keymap(baseKeymap);
}
