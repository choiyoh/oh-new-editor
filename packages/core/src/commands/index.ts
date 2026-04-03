import { chainCommands, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import type { Command } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';

import { editorSchema } from '../schema';
import { isSafeHref } from '../utils/url';

const { nodes, marks } = editorSchema;

function removeMark(markName: keyof typeof marks) {
  const markType = marks[markName];
  return ((state, dispatch) => {
    const { from, to } = state.selection;
    if (!markType) return false;
    if (dispatch) {
      dispatch(state.tr.removeMark(from, to, markType));
    }
    return true;
  }) satisfies Command;
}

function isSelectionInList(state: Parameters<Command>[0], listType: NonNullable<(typeof nodes)['bullet_list'] | (typeof nodes)['ordered_list']>) {
  const range = state.selection.$from.blockRange(state.selection.$to);
  return Boolean(range && range.parent.type === listType);
}

function toggleList(listType: NonNullable<(typeof nodes)['bullet_list'] | (typeof nodes)['ordered_list']>): Command {
  return (state, dispatch) => {
    const listItemType = nodes.list_item;
    if (!listType || !listItemType) return false;

    if (isSelectionInList(state, listType)) {
      return liftListItem(listItemType)(state, dispatch);
    }

    return wrapInList(listType)(state, dispatch);
  };
}

export const toggleBold = () => toggleMark(marks.strong);
export const toggleItalic = () => toggleMark(marks.em);
export const toggleUnderline = () => toggleMark(marks.underline);
export const toggleStrike = () => toggleMark(marks.strike);
export const toggleCode = () => toggleMark(marks.code);
export const toggleBlockquote = () => wrapIn(nodes.blockquote);
export const toggleBulletList = () => toggleList(nodes.bullet_list);
export const toggleOrderedList = () => toggleList(nodes.ordered_list);
export const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => setBlockType(nodes.heading, { level });
export const insertCodeBlock = (language?: string) => setBlockType(nodes.code_block, { language: language ?? null });

export function toggleLink(href: string): Command {
  if (!isSafeHref(href)) {
    return () => false;
  }

  return toggleMark(marks.link, { href });
}

export function setFontSize(size: number): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (empty) return false;

    let transaction = state.tr.removeMark(from, to, marks.font_size);
    transaction = transaction.addMark(from, to, marks.font_size.create({ size }));

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

    const rule = nodes.horizontal_rule.create();
    dispatch(state.tr.replaceSelectionWith(rule).scrollIntoView());
    return true;
  };
}

export function liftCurrentListItem(): Command {
  return liftListItem(nodes.list_item);
}

export function sinkCurrentListItem(): Command {
  return sinkListItem(nodes.list_item);
}

export function insertParagraph(): Command {
  return setBlockType(nodes.paragraph);
}

export function insertImage(attrs: { src: string; alt?: string | null; title?: string | null; width?: string | null; height?: string | null }): Command {
  return (state, dispatch) => {
    if (!dispatch) return true;
    const image = nodes.image.create(attrs);
    dispatch(state.tr.replaceSelectionWith(image).scrollIntoView());
    return true;
  };
}

export function insertTable(rows = 3, cols = 3): Command {
  return (state, dispatch) => {
    if (!dispatch) return true;
    const table = nodes.table.createAndFill(null, createTableRows(rows, cols));
    if (!table) return false;
    dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
    return true;
  };
}

function createTableRows(rows: number, cols: number) {
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
