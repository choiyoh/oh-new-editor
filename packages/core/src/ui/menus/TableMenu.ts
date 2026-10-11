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
import { DEFAULT_MESSAGES, type EditorMessages } from '../../i18n';
import { onPress } from '../dom';
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

  constructor(private readonly view: EditorView, maxRows?: number, maxCols?: number, messages: EditorMessages = DEFAULT_MESSAGES) {
    const m = messages;
    this.actions = [
      { label: m.addRowAbove, icon: toolbarIcons.addRow, command: withLimit(addRowBefore, 'rows', maxRows) },
      { label: m.addRowBelow, icon: toolbarIcons.addRow, command: withLimit(addRowAfter, 'rows', maxRows) },
      { label: m.addColumnLeft, icon: toolbarIcons.addColumn, command: withLimit(addColumnBefore, 'cols', maxCols) },
      { label: m.addColumnRight, icon: toolbarIcons.addColumn, command: withLimit(addColumnAfter, 'cols', maxCols) },
      { label: m.deleteRow, icon: toolbarIcons.removeRow, command: deleteRow },
      { label: m.deleteColumn, icon: toolbarIcons.removeColumn, command: deleteColumn },
      { label: m.mergeCells, icon: toolbarIcons.merge, command: mergeCells },
      { label: m.splitCell, icon: toolbarIcons.split, command: splitCell }
    ];
    this.element.className = 'oh-editor__table-menu';
    this.element.hidden = true;
    this.element.setAttribute('role', 'menu');
    this.element.setAttribute('aria-label', m.tableMenu);
    this.render();
    document.addEventListener('keydown', this.handleKeyDown, true);
    document.addEventListener('mousedown', this.handleClickOutside, true);
  }

  /** `left`/`top` are relative to the menu's offset parent (the editor host). */
  open(left: number, top: number) {
    this.element.hidden = false;
    this.isOpen = true;
    this.sync();

    const parent = this.element.offsetParent ?? this.element.parentElement;
    const maxLeft = parent ? Math.max(4, parent.clientWidth - this.element.offsetWidth - 4) : left;
    this.element.style.left = `${Math.min(Math.max(4, left), maxLeft)}px`;
    this.element.style.top = `${Math.max(4, top)}px`;
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
    document.removeEventListener('keydown', this.handleKeyDown, true);
    this.element.remove();
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      this.view.focus();
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;

    // Arrow keys move into / through the menu, also when focus is still in the editor.
    const buttons = Array.from(this.element.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    if (!buttons.length) return;
    event.preventDefault();
    event.stopPropagation();

    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    else if (event.key === 'ArrowDown') next = index === -1 ? 0 : (index + 1) % buttons.length;
    else if (event.key === 'ArrowUp') next = index === -1 ? buttons.length - 1 : (index - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
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
      button.setAttribute('role', 'menuitem');
      button.tabIndex = -1;
      button.dataset.index = String(index);

      if (action.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'oh-editor__table-menu-icon';
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.innerHTML = action.icon;
        button.append(iconSpan);
      }

      const label = document.createElement('span');
      label.textContent = action.label;
      button.append(label);

      onPress(button, () => {
        action.command(this.view.state, this.view.dispatch);
        this.close();
        this.view.focus();
      });
      this.element.append(button);
    }
  }
}
