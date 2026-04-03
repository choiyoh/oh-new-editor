import { Plugin } from 'prosemirror-state';

import type { EditorTableSupport } from '../types';
import { sanitizeHtml } from '../serializers/html';

function clampTableElement(table: HTMLTableElement, maxRows?: number, maxCols?: number) {
  const rows = Array.from(table.querySelectorAll('tr'));

  rows.forEach((row, rowIndex) => {
    if (maxRows && rowIndex >= maxRows) {
      row.remove();
      return;
    }

    const cells = Array.from(row.children).filter(
      (child): child is HTMLTableCellElement => child instanceof HTMLTableCellElement
    );

    cells.forEach((cell, colIndex) => {
      if (maxCols && colIndex >= maxCols) {
        cell.remove();
        return;
      }

      if (maxCols) {
        const colspan = Number(cell.getAttribute('colspan') ?? '1');
        const remaining = maxCols - colIndex;
        if (colspan > remaining) {
          cell.setAttribute('colspan', String(Math.max(1, remaining)));
        }
      }
    });
  });
}

function clampPastedTables(html: string, table?: EditorTableSupport) {
  if (!table?.maxRows && !table?.maxCols) {
    return html;
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  container.querySelectorAll('table').forEach((tableNode) => {
    if (tableNode instanceof HTMLTableElement) {
      clampTableElement(tableNode, table.maxRows, table.maxCols);
    }
  });

  return container.innerHTML;
}

export function createPastePlugin(table?: EditorTableSupport) {
  return new Plugin({
    props: {
      transformPastedHTML(html) {
        return clampPastedTables(sanitizeHtml(html), table);
      }
    }
  });
}
