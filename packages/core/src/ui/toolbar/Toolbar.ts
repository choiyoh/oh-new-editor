import { redo, undo } from 'prosemirror-history';
import { NodeSelection, type Command, type EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import {
  clearFontSize,
  insertCodeBlock,
  insertHR,
  insertParagraph,
  setCodeBlockLanguage,
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
import type { EditorToolbarAction } from '../../types';
import { toolbarIcons } from '../icons';

const DEFAULT_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];
const DEFAULT_CODE_LANGUAGES = ['', 'plaintext', 'javascript', 'typescript', 'tsx', 'jsx', 'json', 'html', 'css', 'bash', 'markdown'];

type ToolbarActionConfig = {
  label: string;
  title: string;
  command: (view: EditorView) => boolean | Promise<boolean>;
  isEnabled?: (state: EditorState) => boolean;
  isActive?: (state: EditorState) => boolean;
};

function run(view: EditorView, command: Command) {
  return command(view.state, view.dispatch, view);
}

function hasMark(state: EditorState, markName: string) {
  const markType = state.schema.marks[markName];
  if (!markType) return false;

  const { from, to, empty } = state.selection;
  if (empty) {
    return Boolean(markType.isInSet(state.storedMarks ?? state.selection.$from.marks()));
  }

  return state.doc.rangeHasMark(from, to, markType);
}

function isBlockActive(state: EditorState, nodeName: string, attrs?: Record<string, unknown>) {
  const nodeType = state.schema.nodes[nodeName];
  if (!nodeType) return false;

  const { $from } = state.selection;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type !== nodeType) continue;
    if (!attrs) return true;
    return Object.entries(attrs).every(([key, value]) => node.attrs[key] === value);
  }

  return false;
}

function getActiveFontSize(state: EditorState) {
  const marks = state.storedMarks ?? state.selection.$from.marks();
  const fontSize = state.schema.marks.font_size;
  return fontSize ? marks.find((mark) => mark.type === fontSize)?.attrs.size ?? '' : '';
}

function getBlockValue(state: EditorState) {
  const { $from } = state.selection;
  const parent = $from.parent;

  if (parent.type === state.schema.nodes.heading) {
    return `h${parent.attrs.level}`;
  }

  if (parent.type === state.schema.nodes.code_block) {
    return 'code_block';
  }

  return 'paragraph';
}

function isImageSelected(state: EditorState) {
  return state.selection instanceof NodeSelection && state.selection.node.type === state.schema.nodes.image;
}

function getActiveCodeLanguage(state: EditorState) {
  const codeBlock = state.schema.nodes.code_block;
  if (!codeBlock) return '';

  const { $from } = state.selection;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type === codeBlock) return node.attrs.language ?? '';
  }

  return '';
}

function isInCodeBlock(state: EditorState) {
  return getBlockValue(state) === 'code_block';
}

export class Toolbar {
  readonly element = document.createElement('div');

  private readonly actions = new Map<HTMLButtonElement, ToolbarActionConfig>();
  private readonly codeLanguageGroup = document.createElement('div');
  private readonly fontSizeSelect = document.createElement('select');
  private readonly blockSelect = document.createElement('select');
  private readonly codeLanguageSelect = document.createElement('select');
  private readonly insertActions: EditorToolbarAction[];
  private readonly tableActions: EditorToolbarAction[];
  private readonly onPickImage?: () => Promise<void>;
  private readonly canUploadImages: boolean;
  private readonly onEditImageAlt?: () => void;
  private readOnly = false;

  constructor(
    private readonly view: EditorView,
    options: {
      fontSizes?: number[];
      readOnly?: boolean;
      canUploadImages?: boolean;
      onPickImage?: () => Promise<void>;
      onEditImageAlt?: () => void;
      insertActions?: EditorToolbarAction[];
      tableActions?: EditorToolbarAction[];
    } = {}
  ) {
    this.readOnly = Boolean(options.readOnly);
    this.insertActions = options.insertActions ?? [];
    this.tableActions = options.tableActions ?? [];
    this.canUploadImages = Boolean(options.canUploadImages);
    this.onPickImage = options.onPickImage;
    this.onEditImageAlt = options.onEditImageAlt;
    this.element.className = 'oh-editor__toolbar';

    this.renderToolbar(options.fontSizes ?? DEFAULT_FONT_SIZES);
    this.sync();
  }

  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly;
    this.sync();
  }

  sync() {
    const { state } = this.view;

    for (const [button, config] of this.actions) {
      const isImageButton = button.dataset.role === 'image';
      const isAltButton = button.dataset.role === 'image-alt';
      button.disabled = this.readOnly || (isImageButton && !this.canUploadImages) || (isAltButton && !isImageSelected(state)) || (config.isEnabled ? !config.isEnabled(state) : false) || button.dataset.busy === 'true';
      button.dataset.active = config.isActive?.(state) ? 'true' : 'false';

      if (isAltButton) {
        button.hidden = !isImageSelected(state);
      }
    }

    this.blockSelect.disabled = this.readOnly;
    this.blockSelect.value = getBlockValue(state);

    this.fontSizeSelect.disabled = this.readOnly;
    this.fontSizeSelect.value = String(getActiveFontSize(state));

    const inCodeBlock = isInCodeBlock(state);
    this.codeLanguageGroup.hidden = !inCodeBlock;
    this.codeLanguageSelect.disabled = this.readOnly || !inCodeBlock;
    this.codeLanguageSelect.value = getActiveCodeLanguage(state);
  }

  destroy() {
    this.element.remove();
    this.actions.clear();
  }

  private renderToolbar(fontSizes: number[]) {
    this.element.append(
      this.renderGroup([
        { label: toolbarIcons.undo, title: 'Undo', command: (view) => undo(view.state, view.dispatch) },
        { label: toolbarIcons.redo, title: 'Redo', command: (view) => redo(view.state, view.dispatch) }
      ]),
      this.renderBlockSelect(),
      this.renderFontSizeSelect(fontSizes),
      this.renderCodeLanguageSelect(),
      this.renderGroup([
        { label: toolbarIcons.bold, title: 'Bold', command: (view) => run(view, toggleBold()), isActive: (state) => hasMark(state, 'strong') },
        { label: toolbarIcons.italic, title: 'Italic', command: (view) => run(view, toggleItalic()), isActive: (state) => hasMark(state, 'em') },
        { label: toolbarIcons.underline, title: 'Underline', command: (view) => run(view, toggleUnderline()), isActive: (state) => hasMark(state, 'underline') },
        { label: toolbarIcons.strike, title: 'Strikethrough', command: (view) => run(view, toggleStrike()), isActive: (state) => hasMark(state, 'strike') },
        { label: toolbarIcons.inlineCode, title: 'Inline code', command: (view) => run(view, toggleCode()), isActive: (state) => hasMark(state, 'code') },
        {
          label: toolbarIcons.link,
          title: 'Insert link',
          command: (view) => {
            const href = window.prompt('Enter URL', 'https://');
            if (!href) return false;
            return run(view, toggleLink(href));
          },
          isActive: (state) => hasMark(state, 'link')
        }
      ]),
      this.renderGroup([
        { label: toolbarIcons.bulletList, title: 'Bullet list', command: (view) => run(view, toggleBulletList()), isActive: (state) => isBlockActive(state, 'bullet_list') },
        { label: toolbarIcons.orderedList, title: 'Ordered list', command: (view) => run(view, toggleOrderedList()), isActive: (state) => isBlockActive(state, 'ordered_list') },
        { label: toolbarIcons.quote, title: 'Blockquote', command: (view) => run(view, toggleBlockquote()), isActive: (state) => isBlockActive(state, 'blockquote') },
        { label: toolbarIcons.codeBlock, title: 'Code block', command: (view) => run(view, insertCodeBlock()), isActive: (state) => isBlockActive(state, 'code_block') },
        { label: toolbarIcons.horizontalRule, title: 'Horizontal rule', command: (view) => run(view, insertHR()) }
      ]),
      this.renderInsertGroup()
    );

    if (this.tableActions.length) {
      this.element.append(this.renderTableGroup());
    }
  }

  private renderInsertGroup() {
    const insertGroup = document.createElement('div');
    insertGroup.className = 'oh-editor__toolbar-group';

    const imageButton = document.createElement('button');
    imageButton.type = 'button';
    imageButton.className = 'oh-editor__button';
    imageButton.innerHTML = toolbarIcons.image;
    imageButton.title = 'Upload image';
    imageButton.setAttribute('aria-label', 'Upload image');
    imageButton.dataset.role = 'image';
    imageButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if (this.readOnly || !this.onPickImage) return;
      imageButton.dataset.busy = 'true';
      this.sync();
      void this.onPickImage().finally(() => {
        imageButton.dataset.busy = 'false';
        this.view.focus();
        this.sync();
      });
    });
    this.actions.set(imageButton, {
      label: toolbarIcons.image,
      title: 'Upload image',
      command: () => true
    });
    insertGroup.append(imageButton);

    const altButton = document.createElement('button');
    altButton.type = 'button';
    altButton.className = 'oh-editor__button';
    altButton.innerHTML = toolbarIcons.alt;
    altButton.title = 'Edit image alt text';
    altButton.setAttribute('aria-label', 'Edit image alt text');
    altButton.dataset.role = 'image-alt';
    altButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if (this.readOnly || !this.onEditImageAlt || !isImageSelected(this.view.state)) return;
      this.onEditImageAlt();
      this.view.focus();
      this.sync();
    });
    this.actions.set(altButton, {
      label: toolbarIcons.alt,
      title: 'Edit image alt text',
      command: () => true
    });
    insertGroup.append(altButton);

    for (const action of this.insertActions) {
      this.appendActionButton(insertGroup, {
        label: action.label,
        title: action.title,
        command: action.run,
        isEnabled: action.isEnabled,
        isActive: action.isActive
      });
    }

    return insertGroup;
  }

  private renderTableGroup() {
    const tableGroup = document.createElement('div');
    tableGroup.className = 'oh-editor__toolbar-group';

    for (const action of this.tableActions) {
      this.appendActionButton(tableGroup, {
        label: action.label,
        title: action.title,
        command: action.run,
        isEnabled: action.isEnabled,
        isActive: action.isActive
      });
    }

    return tableGroup;
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
    this.blockSelect.dataset.selectKind = 'block';
    this.blockSelect.title = 'Block type';
    this.blockSelect.setAttribute('aria-label', 'Block type');
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
    return group;
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
    this.fontSizeSelect.dataset.selectKind = 'font-size';
    this.fontSizeSelect.title = 'Font size';
    this.fontSizeSelect.setAttribute('aria-label', 'Font size');
    this.fontSizeSelect.addEventListener('change', () => {
      if (this.readOnly) return;
      const value = this.fontSizeSelect.value;
      const command = value ? setFontSize(Number(value)) : clearFontSize();
      run(this.view, command);
      this.view.focus();
      this.sync();
    });

    group.append(this.fontSizeSelect);
    return group;
  }

  private renderCodeLanguageSelect() {
    this.codeLanguageGroup.className = 'oh-editor__toolbar-group';

    for (const language of DEFAULT_CODE_LANGUAGES) {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language || 'Code lang';
      this.codeLanguageSelect.append(option);
    }

    this.codeLanguageSelect.className = 'oh-editor__select';
    this.codeLanguageSelect.dataset.selectKind = 'code-language';
    this.codeLanguageSelect.title = 'Code block language';
    this.codeLanguageSelect.setAttribute('aria-label', 'Code block language');
    this.codeLanguageSelect.addEventListener('change', () => {
      if (this.readOnly || !isInCodeBlock(this.view.state)) return;
      run(this.view, setCodeBlockLanguage(this.codeLanguageSelect.value || null));
      this.view.focus();
      this.sync();
    });

    this.codeLanguageGroup.append(this.codeLanguageSelect);
    this.codeLanguageGroup.hidden = true;
    return this.codeLanguageGroup;
  }

  private renderGroup(configs: ToolbarActionConfig[]) {
    const group = document.createElement('div');
    group.className = 'oh-editor__toolbar-group';

    for (const config of configs) {
      this.appendActionButton(group, config);
    }

    return group;
  }

  private appendActionButton(group: HTMLElement, config: ToolbarActionConfig) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'oh-editor__button';
    button.innerHTML = config.label;
    button.title = config.title;
    button.setAttribute('aria-label', config.title);
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if (this.readOnly) return;

      const result = config.command(this.view);
      if (result instanceof Promise) {
        button.dataset.busy = 'true';
        this.sync();
        void result.finally(() => {
          button.dataset.busy = 'false';
          this.view.focus();
          this.sync();
        });
        return;
      }

      this.view.focus();
      this.sync();
    });
    this.actions.set(button, config);
    group.append(button);
  }
}
