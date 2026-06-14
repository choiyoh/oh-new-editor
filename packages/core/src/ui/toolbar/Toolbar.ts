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
import { TableGridPicker } from '../menus/TableGridPicker';
import { LinkEditor } from '../LinkEditor';

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

function getActiveLinkHref(state: EditorState): string | null {
  const { $from, empty } = state.selection;
  if (!empty) return null;
  const linkMark = state.schema.marks.link;
  if (!linkMark) return null;
  const marks = state.storedMarks ?? $from.marks();
  const link = linkMark.isInSet(marks);
  return link?.attrs.href ?? null;
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
  private readonly tableLimits?: { maxRows?: number; maxCols?: number };
  private gridPicker: TableGridPicker | null = null;
  private readOnly = false;
  private linkEditor: LinkEditor = new LinkEditor();

  private readonly toolbarGroups: HTMLElement[] = [];
  private readonly groupWidths = new Map<HTMLElement, number>();
  private readonly groupPriorities: number[] = [];
  private blockGroupIndex = -1;

  private overflowContainer = document.createElement('div');
  private overflowButton = document.createElement('button');
  private overflowGroup = document.createElement('div');
  private overflowOpen = false;
  private resizeObserver: ResizeObserver | null = null;

  private readonly boundUpdateOverflow = () => this.updateOverflow();
  private readonly boundHandleDocumentMouseDown = (event: MouseEvent) => this.handleDocumentMouseDown(event);
  private readonly boundHandleKeydown = (event: KeyboardEvent) => this.handleToolbarKeydown(event);

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
      tableLimits?: { maxRows?: number; maxCols?: number };
    } = {}
  ) {
    this.readOnly = Boolean(options.readOnly);
    this.insertActions = options.insertActions ?? [];
    this.tableActions = options.tableActions ?? [];
    this.canUploadImages = Boolean(options.canUploadImages);
    this.onPickImage = options.onPickImage;
    this.onEditImageAlt = options.onEditImageAlt;
    this.tableLimits = options.tableLimits;
    this.element.className = 'oh-editor__toolbar';
    this.element.setAttribute('role', 'toolbar');
    this.element.setAttribute('aria-label', 'Text formatting');
    this.element.setAttribute('aria-orientation', 'horizontal');

    this.renderToolbar(options.fontSizes ?? DEFAULT_FONT_SIZES);
    this.setupOverflow();
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
      button.setAttribute('aria-pressed', button.dataset.active);

      if (isAltButton) {
        button.hidden = !isImageSelected(state);
      }
    }

    this.blockSelect.disabled = this.readOnly;
    this.blockSelect.value = getBlockValue(state);

    this.fontSizeSelect.disabled = this.readOnly;
    this.fontSizeSelect.value = String(getActiveFontSize(state));

    const inCodeBlock = isInCodeBlock(state);
    const wasCodeLanguageHidden = this.codeLanguageGroup.hidden;
    this.codeLanguageGroup.hidden = !inCodeBlock;
    this.codeLanguageSelect.disabled = this.readOnly || !inCodeBlock;
    this.codeLanguageSelect.value = getActiveCodeLanguage(state);

    if (wasCodeLanguageHidden !== this.codeLanguageGroup.hidden) {
      requestAnimationFrame(() => this.updateOverflow());
    }
  }

  destroy() {
    this.closeGridPicker();
    this.linkEditor.close();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    window.removeEventListener('resize', this.boundUpdateOverflow);
    document.removeEventListener('mousedown', this.boundHandleDocumentMouseDown);
    this.element.removeEventListener('keydown', this.boundHandleKeydown);

    this.element.remove();
    this.actions.clear();
  }

  private renderToolbar(fontSizes: number[]) {
    const historyGroup = this.renderGroup(
      [
        { label: toolbarIcons.undo, title: 'Undo', command: (view) => undo(view.state, view.dispatch) },
        { label: toolbarIcons.redo, title: 'Redo', command: (view) => redo(view.state, view.dispatch) }
      ],
      'History'
    );
    historyGroup.dataset.priority = '3';

    const blockGroup = this.renderBlockSelect();
    blockGroup.dataset.priority = '0';
    this.blockGroupIndex = 1;

    const fontSizeGroup = this.renderFontSizeSelect(fontSizes);
    fontSizeGroup.dataset.priority = '3';

    const codeLanguageGroup = this.renderCodeLanguageSelect();
    codeLanguageGroup.dataset.priority = '2';

    const marksGroup = this.renderGroup(
      [
        { label: toolbarIcons.bold, title: 'Bold', command: (view) => run(view, toggleBold()), isActive: (state) => hasMark(state, 'strong') },
        { label: toolbarIcons.italic, title: 'Italic', command: (view) => run(view, toggleItalic()), isActive: (state) => hasMark(state, 'em') },
        { label: toolbarIcons.underline, title: 'Underline', command: (view) => run(view, toggleUnderline()), isActive: (state) => hasMark(state, 'underline') },
        { label: toolbarIcons.strike, title: 'Strikethrough', command: (view) => run(view, toggleStrike()), isActive: (state) => hasMark(state, 'strike') },
        { label: toolbarIcons.inlineCode, title: 'Inline code', command: (view) => run(view, toggleCode()), isActive: (state) => hasMark(state, 'code') },
        {
          label: toolbarIcons.link,
          title: 'Insert link',
          command: () => {
            const linkButton = this.element.querySelector<HTMLElement>('[aria-label="Insert link"]');
            if (!linkButton) return false;
            const btnRect = linkButton.getBoundingClientRect();
            const container = this.element.parentElement;
            if (!container) return false;
            const existingHref = getActiveLinkHref(this.view.state);

            this.linkEditor.open({
              container,
              coords: { left: btnRect.left, top: btnRect.bottom + 4 },
              anchorHref: existingHref ?? undefined,
              onConfirm: (href) => {
                run(this.view, toggleLink(href));
                this.view.focus();
                this.sync();
              },
              onRemove: existingHref ? () => {
                run(this.view, toggleLink(existingHref));
                this.view.focus();
                this.sync();
              } : undefined,
              onClose: () => {
                this.view.focus();
                this.sync();
              }
            });
            return true;
          },
          isActive: (state) => hasMark(state, 'link')
        }
      ],
      'Text formatting'
    );
    marksGroup.dataset.priority = '1';

    const listBlockGroup = this.renderGroup(
      [
        { label: toolbarIcons.bulletList, title: 'Bullet list', command: (view) => run(view, toggleBulletList()), isActive: (state) => isBlockActive(state, 'bullet_list') },
        { label: toolbarIcons.orderedList, title: 'Ordered list', command: (view) => run(view, toggleOrderedList()), isActive: (state) => isBlockActive(state, 'ordered_list') },
        { label: toolbarIcons.quote, title: 'Blockquote', command: (view) => run(view, toggleBlockquote()), isActive: (state) => isBlockActive(state, 'blockquote') },
        { label: toolbarIcons.codeBlock, title: 'Code block', command: (view) => run(view, insertCodeBlock()), isActive: (state) => isBlockActive(state, 'code_block') },
        { label: toolbarIcons.horizontalRule, title: 'Horizontal rule', command: (view) => run(view, insertHR()) }
      ],
      'Lists and blocks'
    );
    listBlockGroup.dataset.priority = '2';

    const insertGroup = this.renderInsertGroup();
    insertGroup.dataset.priority = '2';

    this.toolbarGroups.push(historyGroup, blockGroup, fontSizeGroup, codeLanguageGroup, marksGroup, listBlockGroup, insertGroup);
    this.groupPriorities.push(3, 0, 3, 2, 1, 2, 2);

    this.element.append(historyGroup, blockGroup, fontSizeGroup, codeLanguageGroup, marksGroup, listBlockGroup, insertGroup);

    if (this.tableActions.length) {
      const tableGroup = this.renderTableGroup();
      tableGroup.dataset.priority = '2';
      this.toolbarGroups.push(tableGroup);
      this.groupPriorities.push(2);
      this.element.append(tableGroup);
    }
  }

  private renderInsertGroup() {
    const insertGroup = document.createElement('div');
    insertGroup.className = 'oh-editor__toolbar-group';
    insertGroup.setAttribute('role', 'group');
    insertGroup.setAttribute('aria-label', 'Insert');

    const imageButton = document.createElement('button');
    imageButton.type = 'button';
    imageButton.className = 'oh-editor__button';
    imageButton.innerHTML = `
      <span class="oh-editor__button-icon">${toolbarIcons.image}</span>
      <span class="oh-editor__button-spinner">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6" stroke-dasharray="28" stroke-dashoffset="8" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite"/></circle></svg>
      </span>
    `;
    imageButton.title = 'Upload image';
    imageButton.setAttribute('aria-label', 'Upload image');
    imageButton.setAttribute('aria-pressed', 'false');
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
    altButton.setAttribute('aria-pressed', 'false');
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

    // The first insert action is always the table insert button —
    // wire it to open the grid picker instead of directly inserting 3×3.
    const hasTableInsert = this.insertActions.length > 0;

    for (let i = 0; i < this.insertActions.length; i++) {
      const action = this.insertActions[i];

      if (i === 0 && hasTableInsert) {
        // Table insert → grid picker
        const tableButton = document.createElement('button');
        tableButton.type = 'button';
        tableButton.className = 'oh-editor__button';
        tableButton.innerHTML = action.label;
        tableButton.title = action.title;
        tableButton.setAttribute('aria-label', action.title);
        tableButton.setAttribute('aria-pressed', 'false');
        tableButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
          if (this.readOnly) return;
          this.openGridPicker(tableButton);
        });
        this.actions.set(tableButton, {
          label: action.label,
          title: action.title,
          command: action.run,
          isEnabled: action.isEnabled,
          isActive: action.isActive
        });
        insertGroup.append(tableButton);
      } else {
        this.appendActionButton(insertGroup, {
          label: action.label,
          title: action.title,
          command: action.run,
          isEnabled: action.isEnabled,
          isActive: action.isActive
        });
      }
    }

    return insertGroup;
  }

  private openGridPicker(anchor: HTMLElement) {
    this.closeGridPicker();

    this.gridPicker = new TableGridPicker(this.view, this.tableLimits);

    const rect = anchor.getBoundingClientRect();
    const editorRect = this.element.parentElement?.getBoundingClientRect() ?? document.body.getBoundingClientRect();
    this.gridPicker.open(rect.left - editorRect.left, rect.bottom - editorRect.top + 4);
    this.element.parentElement?.append(this.gridPicker.element);
  }

  private closeGridPicker() {
    if (this.gridPicker) {
      this.gridPicker.destroy();
      this.gridPicker = null;
    }
  }

  private renderTableGroup() {
    const tableGroup = document.createElement('div');
    tableGroup.className = 'oh-editor__toolbar-group';
    tableGroup.setAttribute('role', 'group');
    tableGroup.setAttribute('aria-label', 'Table actions');

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
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Block type');

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
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Font size');

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
    this.codeLanguageGroup.setAttribute('role', 'group');
    this.codeLanguageGroup.setAttribute('aria-label', 'Code block language');

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

  private renderGroup(configs: ToolbarActionConfig[], ariaLabel?: string) {
    const group = document.createElement('div');
    group.className = 'oh-editor__toolbar-group';
    group.setAttribute('role', 'group');
    if (ariaLabel) {
      group.setAttribute('aria-label', ariaLabel);
    }

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
    button.setAttribute('aria-pressed', 'false');
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

  private setupOverflow() {
    const overflowId = `oh-editor-toolbar-overflow-${Math.random().toString(36).slice(2, 9)}`;

    this.overflowContainer.className = 'oh-editor__toolbar-overflow';
    this.overflowContainer.id = overflowId;
    this.overflowContainer.setAttribute('aria-hidden', 'true');

    this.overflowButton.type = 'button';
    this.overflowButton.className = 'oh-editor__button oh-editor__toolbar-overflow-button';
    this.overflowButton.innerHTML = '&#8942;';
    this.overflowButton.title = 'More';
    this.overflowButton.setAttribute('aria-label', 'More');
    this.overflowButton.setAttribute('aria-haspopup', 'true');
    this.overflowButton.setAttribute('aria-expanded', 'false');
    this.overflowButton.setAttribute('aria-controls', overflowId);
    this.overflowButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.toggleOverflow();
    });

    this.overflowGroup.className = 'oh-editor__toolbar-group oh-editor__toolbar-group--overflow';
    this.overflowGroup.setAttribute('role', 'group');
    this.overflowGroup.setAttribute('aria-label', 'More actions');
    this.overflowGroup.append(this.overflowButton, this.overflowContainer);
    this.element.append(this.overflowGroup);

    this.element.addEventListener('keydown', this.boundHandleKeydown);
    document.addEventListener('mousedown', this.boundHandleDocumentMouseDown);
    window.addEventListener('resize', this.boundUpdateOverflow);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.boundUpdateOverflow);
      this.resizeObserver.observe(this.element);
    }

    this.updateOverflow();
  }

  private updateOverflow() {
    if (!this.element.isConnected || this.toolbarGroups.length === 0) {
      return;
    }

    const toolbarStyle = getComputedStyle(this.element);
    const toolbarRect = this.element.getBoundingClientRect();
    const paddingH = parseFloat(toolbarStyle.paddingLeft) + parseFloat(toolbarStyle.paddingRight);
    const available = Math.max(0, toolbarRect.width - paddingH);

    for (const group of this.toolbarGroups) {
      const width = group.getBoundingClientRect().width;
      if (width > 0) {
        this.groupWidths.set(group, width);
      }
    }

    const totalWidth = this.toolbarGroups.reduce((sum, group) => sum + (this.groupWidths.get(group) ?? 0), 0);
    const buttonSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--oh-editor-button-size')) || 32;
    const overflowButtonWidth = buttonSize + 12;

    const visible = new Set<number>(this.toolbarGroups.map((_, index) => index));
    let visibleWidth = totalWidth;

    if (totalWidth > available) {
      const collapseOrder = this.toolbarGroups
        .map((_, index) => index)
        .sort((a, b) => {
          const priorityDiff = (this.groupPriorities[b] ?? 2) - (this.groupPriorities[a] ?? 2);
          if (priorityDiff !== 0) return priorityDiff;
          return b - a;
        });

      for (const index of collapseOrder) {
        if (visible.size <= 1 && visible.has(this.blockGroupIndex)) {
          break;
        }
        if (!visible.has(index)) continue;
        if (index === this.blockGroupIndex) continue;

        visible.delete(index);
        visibleWidth -= this.groupWidths.get(this.toolbarGroups[index]) ?? 0;

        if (visibleWidth + overflowButtonWidth <= available) {
          break;
        }
      }
    }

    const hasOverflow = visible.size < this.toolbarGroups.length;
    const visibleIndices: number[] = [];
    const overflowIndices: number[] = [];

    for (let i = 0; i < this.toolbarGroups.length; i++) {
      if (visible.has(i)) {
        visibleIndices.push(i);
      } else {
        overflowIndices.push(i);
      }
    }

    const visibleFragment = document.createDocumentFragment();
    for (const index of visibleIndices) {
      visibleFragment.appendChild(this.toolbarGroups[index]);
    }
    this.element.insertBefore(visibleFragment, this.overflowGroup);

    const overflowFragment = document.createDocumentFragment();
    for (const index of overflowIndices) {
      overflowFragment.appendChild(this.toolbarGroups[index]);
    }
    this.overflowContainer.append(overflowFragment);

    this.overflowGroup.hidden = !hasOverflow;

    if (!hasOverflow && this.overflowOpen) {
      this.closeOverflow();
    }
  }

  private toggleOverflow() {
    if (this.overflowOpen) {
      this.closeOverflow();
    } else {
      this.openOverflow();
    }
  }

  private openOverflow() {
    this.overflowOpen = true;
    this.overflowContainer.classList.add('is-open');
    this.overflowContainer.setAttribute('aria-hidden', 'false');
    this.overflowButton.setAttribute('aria-expanded', 'true');
  }

  private closeOverflow() {
    this.overflowOpen = false;
    this.overflowContainer.classList.remove('is-open');
    this.overflowContainer.setAttribute('aria-hidden', 'true');
    this.overflowButton.setAttribute('aria-expanded', 'false');
  }

  private handleDocumentMouseDown(event: MouseEvent) {
    if (!this.overflowOpen) return;
    const target = event.target as Node;
    if (!this.overflowGroup.contains(target)) {
      this.closeOverflow();
    }
  }

  private handleToolbarKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.overflowOpen) {
        event.preventDefault();
        this.closeOverflow();
        this.overflowButton.focus();
      }
      return;
    }

    const isHorizontal = event.key === 'ArrowRight' || event.key === 'ArrowLeft';
    const isHomeEnd = event.key === 'Home' || event.key === 'End';
    if (!isHorizontal && !isHomeEnd) return;

    const target = event.target as HTMLElement;
    if (target.tagName !== 'BUTTON') return;

    const focusables = Array.from(
      this.element.querySelectorAll<HTMLElement>('button:not([hidden]):not(:disabled), select:not([hidden]):not(:disabled)')
    );

    const index = focusables.indexOf(target);
    if (index === -1) return;

    let nextIndex = index;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % focusables.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + focusables.length) % focusables.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = focusables.length - 1;
    }

    if (nextIndex !== index) {
      event.preventDefault();
      focusables[nextIndex].focus();
    }
  }
}
