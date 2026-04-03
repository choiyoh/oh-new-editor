import { chainCommands, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import type { Command } from 'prosemirror-state';
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
