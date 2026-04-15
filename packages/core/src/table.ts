import {
  addColumnAfter,
  addRowAfter,
  columnResizing,
  deleteColumn,
  deleteRow,
  findTable,
  isInTable,
  mergeCells,
  splitCell,
  TableMap,
  tableEditing
} from 'prosemirror-tables';

import { insertTable } from './commands';
import { createEditor } from './editor';
import { createEditorSchema } from './schema';
import { tableEnabledNodes } from './schema/tableNodes';
import { toolbarIcons } from './ui/icons';
import { TableMenu } from './ui/menus/TableMenu';
import type { Editor, EditorOptions, EditorTableSupport, EditorToolbarAction } from './types';

export const tableSchema = createEditorSchema(tableEnabledNodes);

function getTableSize(state: Parameters<NonNullable<EditorToolbarAction['isEnabled']>>[0]) {
  const table = findTable(state.selection.$from);
  if (!table) return null;
  const map = TableMap.get(table.node);
  return { rows: map.height, cols: map.width };
}

export function createTableSupport(options: { maxRows?: number; maxCols?: number } = {}): EditorTableSupport {
  const insertActions: EditorToolbarAction[] = [
    {
      label: toolbarIcons.table,
      title: 'Insert table',
      run: (view) => insertTable(3, 3, options)(view.state, view.dispatch, view)
    }
  ];

  const tableActions: EditorToolbarAction[] = [
    {
      label: toolbarIcons.addRow,
      title: 'Add row after',
      run: (view) => addRowAfter(view.state, view.dispatch),
      isEnabled: (state) => {
        const size = getTableSize(state);
        return Boolean(isInTable(state) && size && (!options.maxRows || size.rows < options.maxRows));
      }
    },
    {
      label: toolbarIcons.addColumn,
      title: 'Add column after',
      run: (view) => addColumnAfter(view.state, view.dispatch),
      isEnabled: (state) => {
        const size = getTableSize(state);
        return Boolean(isInTable(state) && size && (!options.maxCols || size.cols < options.maxCols));
      }
    },
    {
      label: toolbarIcons.removeRow,
      title: 'Delete row',
      run: (view) => deleteRow(view.state, view.dispatch),
      isEnabled: (state) => isInTable(state)
    },
    {
      label: toolbarIcons.removeColumn,
      title: 'Delete column',
      run: (view) => deleteColumn(view.state, view.dispatch),
      isEnabled: (state) => isInTable(state)
    },
    {
      label: toolbarIcons.merge,
      title: 'Merge selected cells',
      run: (view) => mergeCells(view.state, view.dispatch),
      isEnabled: (state) => isInTable(state) && mergeCells(state)
    },
    {
      label: toolbarIcons.split,
      title: 'Split merged cell',
      run: (view) => splitCell(view.state, view.dispatch),
      isEnabled: (state) => isInTable(state) && splitCell(state)
    }
  ];

  return {
    schema: tableSchema,
    maxRows: options.maxRows,
    maxCols: options.maxCols,
    plugins: [
      columnResizing({
        cellMinWidth: 40,
        defaultCellMinWidth: 120,
        lastColumnResizable: true
      }),
      tableEditing()
    ],
    insertActions,
    actions: tableActions,
    createMenu: (view) => new TableMenu(view, options.maxRows, options.maxCols)
  };
}

export function createTableEditor(element: HTMLElement, options: EditorOptions = {}): Editor {
  return createEditor(element, {
    ...options,
    table: options.table ?? createTableSupport()
  });
}
