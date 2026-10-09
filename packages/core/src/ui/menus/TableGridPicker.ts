import type { EditorView } from 'prosemirror-view';

import { insertTable } from '../../commands';

const MAX_GRID = 8;

export class TableGridPicker {
  readonly element = document.createElement('div');
  private hoveredRows = 0;
  private hoveredCols = 0;
  private keyboardRows = 0;
  private keyboardCols = 0;
  private isOpen = false;

  constructor(
    private readonly view: EditorView,
    private readonly limits?: { maxRows?: number; maxCols?: number }
  ) {
    this.element.className = 'oh-editor__grid-picker';
    this.element.hidden = true;
    this.element.tabIndex = -1;
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-label', 'Insert table: use arrow keys to choose a size, Enter to insert');
    this.render();
    this.element.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleClickOutside, true);
  }

  open(left: number, top: number) {
    this.isOpen = true;
    this.hoveredRows = 0;
    this.hoveredCols = 0;
    this.keyboardRows = 0;
    this.keyboardCols = 0;
    this.element.hidden = false;
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.updateHighlight();
    this.element.focus();
  }

  close() {
    this.isOpen = false;
    this.element.hidden = true;
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

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.keyboardCols = this.hoveredCols < MAX_GRID ? this.hoveredCols + 1 : this.hoveredCols;
        this.hoveredCols = this.keyboardCols;
        if (this.keyboardRows === 0) this.keyboardRows = 1;
        this.hoveredRows = this.keyboardRows;
        this.updateHighlight();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.keyboardCols = this.hoveredCols > 1 ? this.hoveredCols - 1 : this.hoveredCols;
        this.hoveredCols = this.keyboardCols;
        if (this.keyboardRows === 0) this.keyboardRows = 1;
        this.hoveredRows = this.keyboardRows;
        this.updateHighlight();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.keyboardRows = this.hoveredRows < MAX_GRID ? this.hoveredRows + 1 : this.hoveredRows;
        this.hoveredRows = this.keyboardRows;
        if (this.keyboardCols === 0) this.keyboardCols = 1;
        this.hoveredCols = this.keyboardCols;
        this.updateHighlight();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.keyboardRows = this.hoveredRows > 1 ? this.hoveredRows - 1 : this.hoveredRows;
        this.hoveredRows = this.keyboardRows;
        if (this.keyboardCols === 0) this.keyboardCols = 1;
        this.hoveredCols = this.keyboardCols;
        this.updateHighlight();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.hoveredRows > 0 && this.hoveredCols > 0) {
          const rows = this.hoveredRows;
          const cols = this.hoveredCols;
          this.close();
          insertTable(rows, cols, this.limits)(this.view.state, this.view.dispatch);
          this.view.focus();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        this.view.focus();
        break;
    }
  };

  private readonly handleClickOutside = (event: MouseEvent) => {
    if (!this.isOpen) return;
    if (!this.element.contains(event.target as Node)) {
      this.close();
    }
  };

  private render() {
    const grid = document.createElement('div');
    grid.className = 'oh-editor__grid-picker-grid';

    for (let row = 0; row < MAX_GRID; row++) {
      for (let col = 0; col < MAX_GRID; col++) {
        const cell = document.createElement('div');
        cell.className = 'oh-editor__grid-picker-cell';
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.addEventListener('mouseenter', () => {
          this.hoveredRows = row + 1;
          this.hoveredCols = col + 1;
          this.keyboardRows = this.hoveredRows;
          this.keyboardCols = this.hoveredCols;
          this.updateHighlight();
        });
        cell.addEventListener('click', () => {
          const rows = this.hoveredRows;
          const cols = this.hoveredCols;
          this.close();
          insertTable(rows, cols, this.limits)(this.view.state, this.view.dispatch);
          this.view.focus();
        });
        grid.append(cell);
      }
    }

    const label = document.createElement('div');
    label.className = 'oh-editor__grid-picker-label';
    label.setAttribute('aria-live', 'polite');

    this.element.append(grid, label);
    this.element.addEventListener('mouseleave', () => {
      this.hoveredRows = 0;
      this.hoveredCols = 0;
      this.updateHighlight();
    });
  }

  private updateHighlight() {
    const cells = this.element.querySelectorAll<HTMLDivElement>('.oh-editor__grid-picker-cell');
    const label = this.element.querySelector<HTMLDivElement>('.oh-editor__grid-picker-label');

    for (const cell of cells) {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const active = this.hoveredRows > 0 && row < this.hoveredRows && col < this.hoveredCols;
      cell.dataset.active = active ? 'true' : 'false';
    }

    if (label) {
      label.textContent = this.hoveredRows > 0
        ? `${this.hoveredRows} × ${this.hoveredCols}`
        : 'Select table size';
    }
  }
}