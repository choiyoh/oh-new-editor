import { chainCommands, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import type { Mark, MarkType, ResolvedPos } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';

import { isSafeHref } from '../utils/url';

function getNodes(state: Parameters<Command>[0]) {
  return state.schema.nodes;
}

function getMarks(state: Parameters<Command>[0]) {
  return state.schema.marks;
}

function removeMark(markName: string) {
  return ((state, dispatch) => {
    const markType = getMarks(state)[markName];
    const { from, to } = state.selection;
    if (!markType) return false;
    if (dispatch) {
      dispatch(state.tr.removeMark(from, to, markType));
    }
    return true;
  }) satisfies Command;
}

 function isSelectionInList(state: Parameters<Command>[0], listType: NonNullable<ReturnType<typeof getNodes>['bullet_list'] | ReturnType<typeof getNodes>['ordered_list']>) {
  const range = state.selection.$from.blockRange(state.selection.$to);
  return Boolean(range && range.parent.type === listType);
}

function toggleList(listName: 'bullet_list' | 'ordered_list'): Command {
  return (state, dispatch) => {
    const nodes = getNodes(state);
    const listType = nodes[listName];
    const listItemType = nodes.list_item;
    if (!listType || !listItemType) return false;

    if (isSelectionInList(state, listType)) {
      return liftListItem(listItemType)(state, dispatch);
    }

    return wrapInList(listType)(state, dispatch);
  };
}

export const toggleBold = (): Command => (state, dispatch, view) => toggleMark(getMarks(state).strong)(state, dispatch, view);
export const toggleItalic = (): Command => (state, dispatch, view) => toggleMark(getMarks(state).em)(state, dispatch, view);
export const toggleUnderline = (): Command => (state, dispatch, view) => toggleMark(getMarks(state).underline)(state, dispatch, view);
export const toggleStrike = (): Command => (state, dispatch, view) => toggleMark(getMarks(state).strike)(state, dispatch, view);
export const toggleCode = (): Command => (state, dispatch, view) => toggleMark(getMarks(state).code)(state, dispatch, view);
export const toggleBlockquote = (): Command => (state, dispatch, view) => wrapIn(getNodes(state).blockquote)(state, dispatch, view);
export const toggleBulletList = () => toggleList('bullet_list');
export const toggleOrderedList = () => toggleList('ordered_list');
export const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6): Command => (state, dispatch, view) => setBlockType(getNodes(state).heading, { level })(state, dispatch, view);
export const insertCodeBlock = (language?: string): Command => (state, dispatch, view) => setBlockType(getNodes(state).code_block, { language: language ?? null })(state, dispatch, view);

export function setCodeBlockLanguage(language?: string | null): Command {
  return (state, dispatch) => {
    const codeBlock = getNodes(state).code_block;
    if (!codeBlock) return false;

    const { $from } = state.selection;
    for (let depth = $from.depth; depth >= 0; depth -= 1) {
      const node = $from.node(depth);
      if (node.type !== codeBlock) continue;
      if (!dispatch) return true;

      dispatch(state.tr.setNodeMarkup($from.before(depth), undefined, {
        ...node.attrs,
        language: language?.trim() ? language : null
      }));
      return true;
    }

    return false;
  };
}

export function toggleLink(href: string): Command {
  if (!isSafeHref(href)) {
    return () => false;
  }

  return (state, dispatch, view) => toggleMark(getMarks(state).link, { href })(state, dispatch, view);
}

/** Finds the contiguous run of text around `$pos` that carries a mark of `type`. */
export function getMarkRange($pos: ResolvedPos, type: MarkType): { from: number; to: number; mark: Mark } | null {
  const { parent } = $pos;
  let start = parent.childAfter($pos.parentOffset);
  if (!start.node || !type.isInSet(start.node.marks)) {
    start = parent.childBefore($pos.parentOffset);
  }
  if (!start.node) return null;

  const mark = type.isInSet(start.node.marks);
  if (!mark) return null;

  let startIndex = start.index;
  let from = $pos.start() + start.offset;
  let endIndex = startIndex + 1;
  let to = from + start.node.nodeSize;

  while (startIndex > 0 && mark.isInSet(parent.child(startIndex - 1).marks)) {
    startIndex -= 1;
    from -= parent.child(startIndex).nodeSize;
  }
  while (endIndex < parent.childCount && mark.isInSet(parent.child(endIndex).marks)) {
    to += parent.child(endIndex).nodeSize;
    endIndex += 1;
  }

  return { from, to, mark };
}

/** The link under the cursor, or the first link inside the selected range. */
export function getActiveLink(state: EditorState): { href: string; from: number; to: number } | null {
  const linkType = getMarks(state).link;
  if (!linkType) return null;

  const { from, to, empty, $from } = state.selection;
  if (empty) {
    const range = getMarkRange($from, linkType);
    // Links are non-inclusive, so a cursor right after a link is not "in" it.
    if (!range || !linkType.isInSet(state.storedMarks ?? $from.marks())) return null;
    return { href: range.mark.attrs.href, from: range.from, to: range.to };
  }

  let found: { href: string; from: number; to: number } | null = null;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (found || !node.isText) return !found;
    const mark = linkType.isInSet(node.marks);
    if (mark) {
      found = { href: mark.attrs.href, from: Math.max(from, pos), to: Math.min(to, pos + node.nodeSize) };
    }
    return false;
  });
  return found;
}

/**
 * Applies `href` to the selection. With a collapsed cursor inside a link the
 * whole link is updated; with a collapsed cursor elsewhere the URL itself is
 * inserted as linked text.
 */
export function setLink(href: string, attrs: { title?: string | null } = {}): Command {
  return (state, dispatch) => {
    const linkType = getMarks(state).link;
    if (!linkType || !isSafeHref(href)) return false;

    const mark = linkType.create({ href, title: attrs.title ?? null });
    const { empty, from, to } = state.selection;

    if (!dispatch) return true;

    if (empty) {
      const active = getActiveLink(state);
      if (active) {
        dispatch(state.tr.removeMark(active.from, active.to, linkType).addMark(active.from, active.to, mark));
        return true;
      }

      const tr = state.tr.insert(from, state.schema.text(href, [mark]));
      tr.setSelection(TextSelection.create(tr.doc, from + href.length));
      dispatch(tr.removeStoredMark(linkType).scrollIntoView());
      return true;
    }

    dispatch(state.tr.removeMark(from, to, linkType).addMark(from, to, mark).scrollIntoView());
    return true;
  };
}

/** Removes the link under the cursor (the whole link) or from the selected range. */
export function removeLink(): Command {
  return (state, dispatch) => {
    const linkType = getMarks(state).link;
    if (!linkType) return false;

    const { empty, from, to, $from } = state.selection;
    if (empty) {
      const range = getMarkRange($from, linkType);
      if (!range) return false;
      if (dispatch) dispatch(state.tr.removeMark(range.from, range.to, linkType).removeStoredMark(linkType));
      return true;
    }

    if (!state.doc.rangeHasMark(from, to, linkType)) return false;
    if (dispatch) dispatch(state.tr.removeMark(from, to, linkType));
    return true;
  };
}

export function setFontSize(size: number): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (empty) return false;

    const fontSize = getMarks(state).font_size;
    if (!fontSize) return false;

    let transaction = state.tr.removeMark(from, to, fontSize);
    transaction = transaction.addMark(from, to, fontSize.create({ size }));

    if (dispatch) {
      dispatch(transaction.scrollIntoView());
    }

    return true;
  };
}

export function clearFontSize(): Command {
  return removeMark('font_size');
}

export function insertHR(): Command {
  return (state, dispatch) => {
    if (!dispatch) return true;

    const rule = getNodes(state).horizontal_rule.create();
    dispatch(state.tr.replaceSelectionWith(rule).scrollIntoView());
    return true;
  };
}

export function liftCurrentListItem(): Command {
  return (state, dispatch) => liftListItem(getNodes(state).list_item)(state, dispatch);
}

export function sinkCurrentListItem(): Command {
  return (state, dispatch) => sinkListItem(getNodes(state).list_item)(state, dispatch);
}

export function insertParagraph(): Command {
  return (state, dispatch, view) => setBlockType(getNodes(state).paragraph)(state, dispatch, view);
}

export function insertImage(attrs: { src: string; alt?: string | null; title?: string | null; width?: string | null; height?: string | null }): Command {
  return (state, dispatch) => {
    if (!dispatch) return true;
    const image = getNodes(state).image.create(attrs);
    dispatch(state.tr.replaceSelectionWith(image).scrollIntoView());
    return true;
  };
}

export function insertTable(rows = 3, cols = 3, limits?: { maxRows?: number; maxCols?: number }): Command {
  return (state, dispatch) => {
    if (!dispatch) return true;
    const nodes = getNodes(state);
    if (!nodes.table || !nodes.table_row || !nodes.table_cell) return false;
    const safeRows = Math.max(1, Math.min(rows, limits?.maxRows ?? rows));
    const safeCols = Math.max(1, Math.min(cols, limits?.maxCols ?? cols));
    const table = nodes.table.createAndFill(null, createTableRows(safeRows, safeCols, state));
    if (!table) return false;
    dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
    return true;
  };
}

function createTableRows(rows: number, cols: number, state: Parameters<Command>[0]) {
  const nodes = getNodes(state);
  return Array.from({ length: rows }, () =>
    nodes.table_row.createChecked(
      null,
      Array.from({ length: cols }, () =>
        nodes.table_cell.createAndFill() ?? nodes.table_cell.createChecked()
      )
    )
  );
}

export function focusStart(): Command {
  return (state, dispatch) => {
    if (!dispatch) return true;
    dispatch(state.tr.setSelection(TextSelection.atStart(state.doc)));
    return true;
  };
}

export const defaultEnterCommand = chainCommands(insertParagraph(), insertCodeBlock());
