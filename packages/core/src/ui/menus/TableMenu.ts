import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  findTable,
  isInTable,
  mergeCells,
  splitCell,
  TableMap
} from 'prosemirror-tables';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { toolbarIcons } from '../icons';

type TableMenuAction = {
  label: string;
  icon?: string;
  command: (state: EditorState, dispatch?: EditorView['dispatch']) => boolean;
};

function getTableSize(state: EditorState) {
  const table = findTable(state.selection.$from);
  if (!table) return null;
  const map = TableMap.get(table.node);
  return { rows: map.height, cols: map.width };
}

function withLimit(command: TableMenuAction['command'], axis: 'rows' | 'cols', limit?: number): TableMenuAction['command'] {
  return (state, dispatch) => {
    const size = getTableSize(state);
    if (!size) return false;
    if (limit && size[axis] >= limit) return false;
    return command(state, dispatch);
  };
}

export class TableMenu {
  readonly element = document.createElement('div');
  private isOpen = false;
  private readonly actions: TableMenuAction[];

  constructor(private readonly view: EditorView, maxRows?: number, maxCols?: number) {
    this.actions = [
      { label: 'Add row above', icon: toolbarIcons.addRow, command: withLimit(addRowBefore, 'rows', maxRows) },
      { label: 'Add row below', icon: toolbarIcons.addRow, command: withLimit(addRowAfter, 'rows', maxRows) },
      { label: 'Add column left', icon: toolbarIcons.addColumn, command: withLimit(addColumnBefore, 'cols', maxCols) },
      { label: 'Add column right', icon: toolbarIcons.addColumn, command: withLimit(addColumnAfter, 'cols', maxCols) },
      { label: 'Delete row', icon: toolbarIcons.removeRow, command: deleteRow },
      { label: 'Delete column', icon: toolbarIcons.removeColumn, command: deleteColumn },
      { label: 'Merge cells', icon: toolbarIcons.merge, command: mergeCells },
      { label: 'Split cell', icon: toolbarIcons.split, command: splitCell }
    ];
    this.element.className = 'oh-editor__table-menu';
    this.element.hidden = true;
    this.render();
    this.element.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleClickOutside, true);
  }

  open(left: number, top: number) {
    this.element.hidden = false;
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.isOpen = true;
    this.sync();
  }

  close() {
    this.element.hidden = true;
    this.isOpen = false;
  }

  sync() {
    if (!this.isOpen) return;
    const buttons = Array.from(this.element.querySelectorAll<HTMLButtonElement>('button[data-index]'));
    for (const button of buttons) {
      const action = this.actions[Number(button.dataset.index)];
      button.disabled = !isInTable(this.view.state) || !action.command(this.view.state);
    }
  }

  contains(target: EventTarget | null) {
    return target instanceof Node && this.element.contains(target);
  }

  destroy() {
    document.removeEventListener('mousedown', this.handleClickOutside, true);
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.remove();
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  };

  private readonly handleClickOutside = (event: MouseEvent) => {
    if (!this.isOpen) return;
    if (!this.element.contains(event.target as Node)) {
      this.close();
    }
  };

  private render() {
    for (const [index, action] of this.actions.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'oh-editor__table-menu-button';
      button.dataset.index = String(index);

      if (action.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'oh-editor__table-menu-icon';
        iconSpan.innerHTML = action.icon;
        button.append(iconSpan);
      }

      const label = document.createElement('span');
      label.textContent = action.label;
      button.append(label);

      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        action.command(this.view.state, this.view.dispatch);
        this.view.focus();
        this.close();
      });
      this.element.append(button);
    }
  }
}
