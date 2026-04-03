import { redo, undo } from 'prosemirror-history';
import type { Mark, NodeType } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import {
  clearFontSize,
  insertCodeBlock,
  insertHR,
  insertParagraph,
  setFontSize,
  setHeading,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleCode,
  toggleItalic,
  toggleLink,
  toggleOrderedList,
  toggleStrike,
  toggleUnderline
} from '../../commands';
import { editorSchema } from '../../schema';

const DEFAULT_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

type ToolbarActionConfig = {
  label: string;
  title: string;
  command: (view: EditorView) => boolean;
  isActive?: (state: EditorState) => boolean;
};

function run(view: EditorView, command: Command) {
  return command(view.state, view.dispatch, view);
}

function hasMark(state: EditorState, markName: keyof typeof editorSchema.marks) {
  const markType = editorSchema.marks[markName];
  if (!markType) return false;

  const { from, to, empty } = state.selection;
  if (empty) {
    return Boolean(markType.isInSet(state.storedMarks ?? state.selection.$from.marks()));
  }

  return state.doc.rangeHasMark(from, to, markType);
}

function isBlockActive(state: EditorState, nodeType: NodeType, attrs?: Record<string, unknown>) {
  const {$from} = state.selection;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type !== nodeType) continue;
    if (!attrs) return true;
    return Object.entries(attrs).every(([key, value]) => node.attrs[key] === value);
  }
  return false;
}

function getActiveFontSize(state: EditorState) {
  const marks: readonly Mark[] = state.storedMarks ?? state.selection.$from.marks();
  return marks.find((mark) => mark.type === editorSchema.marks.font_size)?.attrs.size ?? '';
}

function getBlockValue(state: EditorState) {
  const {$from} = state.selection;
  const parent = $from.parent;

  if (parent.type === editorSchema.nodes.heading) {
    return `h${parent.attrs.level}`;
  }

  if (parent.type === editorSchema.nodes.code_block) {
    return 'code_block';
  }

  return 'paragraph';
}

export class Toolbar {
  readonly element = document.createElement('div');

  private readonly actions = new Map<HTMLButtonElement, ToolbarActionConfig>();
  private readonly fontSizeSelect = document.createElement('select');
  private readonly blockSelect = document.createElement('select');
  private readOnly = false;

  constructor(
    private readonly view: EditorView,
    options: { fontSizes?: number[]; readOnly?: boolean } = {}
  ) {
    this.readOnly = Boolean(options.readOnly);
    this.element.className = 'oh-editor__toolbar';

    this.renderActions();
    this.renderBlockSelect();
    this.renderFontSizeSelect(options.fontSizes ?? DEFAULT_FONT_SIZES);
    this.sync();
  }

  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly;
    this.sync();
  }

  sync() {
    const { state } = this.view;

    for (const [button, config] of this.actions) {
      button.disabled = this.readOnly;
      button.dataset.active = config.isActive?.(state) ? 'true' : 'false';
    }

    this.blockSelect.disabled = this.readOnly;
    this.blockSelect.value = getBlockValue(state);

    this.fontSizeSelect.disabled = this.readOnly;
    this.fontSizeSelect.value = String(getActiveFontSize(state));
  }

  destroy() {
    this.element.remove();
    this.actions.clear();
  }

  private renderActions() {
    const groups: ToolbarActionConfig[][] = [
      [
        { label: 'B', title: 'Bold', command: (view) => run(view, toggleBold()), isActive: (state) => hasMark(state, 'strong') },
        { label: 'I', title: 'Italic', command: (view) => run(view, toggleItalic()), isActive: (state) => hasMark(state, 'em') },
        { label: 'U', title: 'Underline', command: (view) => run(view, toggleUnderline()), isActive: (state) => hasMark(state, 'underline') },
        { label: 'S', title: 'Strikethrough', command: (view) => run(view, toggleStrike()), isActive: (state) => hasMark(state, 'strike') },
        { label: '</>', title: 'Inline code', command: (view) => run(view, toggleCode()), isActive: (state) => hasMark(state, 'code') }
      ],
      [
        {
          label: 'Link',
          title: 'Insert link',
          command: (view) => {
            const href = window.prompt('Enter URL', 'https://');
            if (!href) return false;
            return run(view, toggleLink(href));
          },
          isActive: (state) => hasMark(state, 'link')
        }
      ],
      [
        {
          label: 'Quote',
          title: 'Blockquote',
          command: (view) => run(view, toggleBlockquote()),
          isActive: (state) => isBlockActive(state, editorSchema.nodes.blockquote)
        },
        {
          label: 'UL',
          title: 'Bullet list',
          command: (view) => run(view, toggleBulletList()),
          isActive: (state) => isBlockActive(state, editorSchema.nodes.bullet_list)
        },
        {
          label: 'OL',
          title: 'Ordered list',
          command: (view) => run(view, toggleOrderedList()),
          isActive: (state) => isBlockActive(state, editorSchema.nodes.ordered_list)
        },
        {
          label: 'Code',
          title: 'Code block',
          command: (view) => run(view, insertCodeBlock()),
          isActive: (state) => isBlockActive(state, editorSchema.nodes.code_block)
        },
        { label: 'HR', title: 'Horizontal rule', command: (view) => run(view, insertHR()) }
      ],
      [
        { label: 'Undo', title: 'Undo', command: (view) => undo(view.state, view.dispatch) },
        { label: 'Redo', title: 'Redo', command: (view) => redo(view.state, view.dispatch) }
      ]
    ];

    for (const group of groups) {
      const groupElement = document.createElement('div');
      groupElement.className = 'oh-editor__toolbar-group';

      for (const config of group) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'oh-editor__button';
        button.textContent = config.label;
        button.addEventListener('mousedown', (event) => {
          event.preventDefault();
          if (this.readOnly) return;
          config.command(this.view);
          this.view.focus();
          this.sync();
        });
        this.actions.set(button, config);
        groupElement.append(button);
      }

      this.element.append(groupElement);
    }
  }

  private renderBlockSelect() {
    const group = document.createElement('div');
    group.className = 'oh-editor__toolbar-group';

    for (const [value, label] of [
      ['paragraph', 'Paragraph'],
      ['h1', 'H1'],
      ['h2', 'H2'],
      ['h3', 'H3'],
      ['h4', 'H4'],
      ['h5', 'H5'],
      ['h6', 'H6'],
      ['code_block', 'Code block']
    ]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      this.blockSelect.append(option);
    }

    this.blockSelect.className = 'oh-editor__select';
    this.blockSelect.addEventListener('change', () => {
      if (this.readOnly) return;
      const value = this.blockSelect.value;
      const command = value === 'paragraph'
        ? insertParagraph()
        : value === 'code_block'
          ? insertCodeBlock()
          : setHeading(Number(value.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6);

      run(this.view, command);

      this.view.focus();
      this.sync();
    });

    group.append(this.blockSelect);
    this.element.prepend(group);
  }

  private renderFontSizeSelect(fontSizes: number[]) {
    const group = document.createElement('div');
    group.className = 'oh-editor__toolbar-group';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Font size';
    this.fontSizeSelect.append(defaultOption);

    for (const size of fontSizes) {
      const option = document.createElement('option');
      option.value = String(size);
      option.textContent = `${size}px`;
      this.fontSizeSelect.append(option);
    }

    this.fontSizeSelect.className = 'oh-editor__select';
    this.fontSizeSelect.addEventListener('change', () => {
      if (this.readOnly) return;
      const value = this.fontSizeSelect.value;
      const command = value ? setFontSize(Number(value)) : clearFontSize();
      run(this.view, command);
      this.view.focus();
      this.sync();
    });

    group.append(this.fontSizeSelect);
    this.element.prepend(group);
  }
}
