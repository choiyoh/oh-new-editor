import { NodeSelection } from 'prosemirror-state';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import {
  insertCodeBlock,
  insertHR,
  insertParagraph,
  setCodeBlockLanguage,
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
import type { EditorToolbarAction, EditorToolbarController } from '../../types';
import { toolbarIcons } from '../icons';

type NotionUiOptions = {
  readOnly?: boolean;
  onPickImage?: () => Promise<void>;
  onEditImageAlt?: () => void;
  insertActions?: EditorToolbarAction[];
};

type SlashCategory = 'Basic' | 'Media' | 'Advanced';

type SlashItem = {
  icon: string;
  label: string;
  description?: string;
  category: SlashCategory;
  keywords: string[];
  run: () => unknown;
};

function run(view: EditorView, command: ReturnType<typeof toggleBold>) {
  return command(view.state, view.dispatch, view);
}

function getSlashMatch(state: EditorState) {
  const { selection } = state;
  if (!selection.empty) return null;

  const { $from } = selection;
  if (!$from.parent.isTextblock) return null;

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\0');
  const match = /(?:^|\s)\/(?<query>[\w-]*)$/.exec(textBefore);
  if (!match?.groups) return null;

  const query = match.groups.query ?? '';
  const from = selection.from - query.length - 1;
  return { query, from, to: selection.from };
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

function isImageSelected(state: EditorState) {
  return state.selection instanceof NodeSelection && state.selection.node.type === state.schema.nodes.image;
}

function isLinkAtCursor(state: EditorState) {
  const { from, empty } = state.selection;
  if (!empty) return false;
  const marks = state.storedMarks ?? state.selection.$from.marks();
  return Boolean(state.schema.marks.link?.isInSet(marks));
}

export class NotionUi implements EditorToolbarController {
  readonly element = document.createElement('div');

  private readonly bubble = document.createElement('div');
  private readonly slash = document.createElement('div');
  private readonly slashList = document.createElement('div');
  private readonly codeLanguage = document.createElement('select');
  private readonly slashItems: SlashItem[];
  private selectedSlashIndex = 0;
  private readOnly = false;
  private readonly onEditImageAlt?: () => void;

  private getOverlayRect() {
    return (this.element.parentElement ?? this.view.dom.parentElement ?? document.body).getBoundingClientRect();
  }

  private placeOverlay(element: HTMLElement, coords: { left: number; top: number }, options: { offsetX?: number; offsetY?: number; centerX?: boolean } = {}) {
    const rect = this.getOverlayRect();
    const offsetX = options.offsetX ?? 0;
    const offsetY = options.offsetY ?? 0;

    let left = coords.left - rect.left + offsetX;
    let top = coords.top - rect.top + offsetY;

    if (options.centerX) {
      left -= element.offsetWidth / 2;
    }

    const maxLeft = Math.max(12, rect.width - element.offsetWidth - 12);
    const maxTop = Math.max(12, rect.height - element.offsetHeight - 12);

    left = Math.min(Math.max(12, left), maxLeft);
    top = Math.min(Math.max(12, top), maxTop);

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  constructor(
    private readonly view: EditorView,
    options: NotionUiOptions = {}
  ) {
    this.readOnly = Boolean(options.readOnly);
    this.onEditImageAlt = options.onEditImageAlt;
    this.element.className = 'oh-editor__notion-ui';

    this.bubble.className = 'oh-editor__bubble-toolbar';
    this.bubble.hidden = true;
    this.renderBubble();

    this.slash.className = 'oh-editor__slash-menu';
    this.slash.hidden = true;
    this.slashList.className = 'oh-editor__slash-list';
    this.slash.append(this.slashList);

    this.codeLanguage.className = 'oh-editor__code-language-chip';
    this.codeLanguage.hidden = true;
    this.codeLanguage.title = 'Code block language';
    this.codeLanguage.setAttribute('aria-label', 'Code block language');
    for (const language of ['', 'plaintext', 'javascript', 'typescript', 'tsx', 'jsx', 'json', 'html', 'css', 'bash', 'markdown']) {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language || 'Code lang';
      this.codeLanguage.append(option);
    }
    this.codeLanguage.addEventListener('change', () => {
      if (this.readOnly || !this.isInCodeBlock()) return;
      run(this.view, setCodeBlockLanguage(this.codeLanguage.value || null));
      this.view.focus();
      this.sync();
    });

    this.element.append(this.bubble, this.slash, this.codeLanguage);
    this.slashItems = this.createSlashItems(options);

    this.view.dom.addEventListener('keydown', this.handleKeyDown);
    this.view.dom.addEventListener('input', this.handleInput);
    this.sync();
  }

  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly;
    if (readOnly) {
      this.slash.hidden = true;
      this.bubble.hidden = true;
      this.codeLanguage.hidden = true;
    }
    this.sync();
  }

  sync() {
    this.syncBubble();
    this.syncSlash();
    this.syncCodeLanguage();
  }

  destroy() {
    this.view.dom.removeEventListener('keydown', this.handleKeyDown);
    this.view.dom.removeEventListener('input', this.handleInput);
    this.codeLanguage.remove();
    this.element.remove();
  }

  private readonly handleInput = () => {
    this.syncSlash();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (this.readOnly || this.slash.hidden) return;

    const visibleItems = this.getVisibleSlashItems();
    if (!visibleItems.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedSlashIndex = (this.selectedSlashIndex + 1) % visibleItems.length;
      this.renderSlashItems();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSlashIndex = (this.selectedSlashIndex - 1 + visibleItems.length) % visibleItems.length;
      this.renderSlashItems();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.slash.hidden = true;
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      void this.applySlashItem(visibleItems[this.selectedSlashIndex] ?? null);
    }
  };

  private bubbleActions: {
    icon: string;
    title: string;
    action: () => unknown;
    isActive: () => boolean;
    context: 'text' | 'image' | 'link';
  }[] = [];

  private renderBubble() {
    this.bubbleActions = [
      { icon: toolbarIcons.bold, title: 'Bold', action: () => run(this.view, toggleBold()), isActive: () => hasMark(this.view.state, 'strong'), context: 'text' },
      { icon: toolbarIcons.italic, title: 'Italic', action: () => run(this.view, toggleItalic()), isActive: () => hasMark(this.view.state, 'em'), context: 'text' },
      { icon: toolbarIcons.underline, title: 'Underline', action: () => run(this.view, toggleUnderline()), isActive: () => hasMark(this.view.state, 'underline'), context: 'text' },
      { icon: toolbarIcons.strike, title: 'Strikethrough', action: () => run(this.view, toggleStrike()), isActive: () => hasMark(this.view.state, 'strike'), context: 'text' },
      { icon: toolbarIcons.inlineCode, title: 'Inline code', action: () => run(this.view, toggleCode()), isActive: () => hasMark(this.view.state, 'code'), context: 'text' },
      { icon: toolbarIcons.link, title: 'Link', action: () => { const href = window.prompt('Enter URL', 'https://'); if (!href) return false; return run(this.view, toggleLink(href)); }, isActive: () => hasMark(this.view.state, 'link'), context: 'text' },
      { icon: toolbarIcons.bulletList, title: 'Bullet list', action: () => run(this.view, toggleBulletList()), isActive: () => isBlockActive(this.view.state, 'bullet_list'), context: 'text' },
      { icon: toolbarIcons.orderedList, title: 'Ordered list', action: () => run(this.view, toggleOrderedList()), isActive: () => isBlockActive(this.view.state, 'ordered_list'), context: 'text' },
      { icon: toolbarIcons.quote, title: 'Blockquote', action: () => run(this.view, toggleBlockquote()), isActive: () => isBlockActive(this.view.state, 'blockquote'), context: 'text' },
      { icon: toolbarIcons.alt, title: 'Edit alt text', action: () => { this.onEditImageAlt?.(); }, isActive: () => false, context: 'image' }
    ];
  }

  private getBubbleContext(): 'text' | 'image' | 'link' {
    if (isImageSelected(this.view.state)) return 'image';
    if (isLinkAtCursor(this.view.state)) return 'link';
    return 'text';
  }

  private rebuildBubble() {
    const context = this.getBubbleContext();
    this.bubble.replaceChildren();

    const visible = this.bubbleActions.filter((a) => {
      if (context === 'image') return a.context === 'image';
      if (context === 'link') return a.context === 'text';
      return a.context === 'text';
    });

    for (const { icon, title, action, isActive } of visible) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'oh-editor__button';
      button.innerHTML = icon;
      button.title = title;
      button.setAttribute('aria-label', title);
      button.dataset.active = isActive() ? 'true' : 'false';
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        if (this.readOnly) return;
        action();
        this.view.focus();
        this.sync();
      });
      this.bubble.append(button);
    }
  }

  private syncBubble() {
    const { selection } = this.view.state;
    const shouldShow = !this.readOnly && !selection.empty && selection.from !== selection.to;
    if (!shouldShow) {
      this.bubble.hidden = true;
      return;
    }

    this.rebuildBubble();

    const start = this.view.coordsAtPos(selection.from);
    const end = this.view.coordsAtPos(selection.to);
    this.bubble.hidden = false;
    this.placeOverlay(this.bubble, {
      left: (start.left + end.right) / 2,
      top: Math.min(start.top, end.top)
    }, {
      centerX: true,
      offsetY: -this.bubble.offsetHeight - 12
    });
  }

  private syncCodeLanguage() {
    if (this.readOnly || !this.isInCodeBlock()) {
      this.codeLanguage.hidden = true;
      return;
    }

    const { $from } = this.view.state.selection;
    for (let depth = $from.depth; depth >= 0; depth -= 1) {
      const node = $from.node(depth);
      if (node.type !== this.view.state.schema.nodes.code_block) continue;

      const coords = this.view.coordsAtPos($from.before(depth + 1));
      this.codeLanguage.hidden = false;
      this.codeLanguage.value = node.attrs.language ?? '';
      this.placeOverlay(this.codeLanguage, coords, {
        offsetY: -this.codeLanguage.offsetHeight - 8
      });
      return;
    }

    this.codeLanguage.hidden = true;
  }

  private isInCodeBlock() {
    const codeBlock = this.view.state.schema.nodes.code_block;
    const { $from } = this.view.state.selection;
    for (let depth = $from.depth; depth >= 0; depth -= 1) {
      if ($from.node(depth).type === codeBlock) return true;
    }
    return false;
  }

  private createSlashItems(options: NotionUiOptions): SlashItem[] {
    const items: SlashItem[] = [
      { icon: toolbarIcons.paragraph, label: 'Text', description: 'Start writing with a plain paragraph', category: 'Basic', keywords: ['paragraph', 'text'], run: () => run(this.view, insertParagraph()) },
      { icon: toolbarIcons.heading1, label: 'Heading 1', description: 'Large section heading', category: 'Basic', keywords: ['h1', 'heading', 'title'], run: () => run(this.view, setHeading(1)) },
      { icon: toolbarIcons.heading2, label: 'Heading 2', description: 'Medium section heading', category: 'Basic', keywords: ['h2', 'heading', 'subtitle'], run: () => run(this.view, setHeading(2)) },
      { icon: toolbarIcons.heading3, label: 'Heading 3', description: 'Small section heading', category: 'Basic', keywords: ['h3', 'heading'], run: () => run(this.view, setHeading(3)) },
      { icon: toolbarIcons.bulletList, label: 'Bullet List', description: 'Create an unordered list', category: 'Basic', keywords: ['list', 'bullet'], run: () => run(this.view, toggleBulletList()) },
      { icon: toolbarIcons.orderedList, label: 'Ordered List', description: 'Create a numbered list', category: 'Basic', keywords: ['list', 'ordered', 'number'], run: () => run(this.view, toggleOrderedList()) },
      { icon: toolbarIcons.quote, label: 'Blockquote', description: 'Highlight a quoted passage', category: 'Basic', keywords: ['quote'], run: () => run(this.view, toggleBlockquote()) },
      { icon: toolbarIcons.codeBlock, label: 'Code Block', description: 'Insert a fenced code block', category: 'Advanced', keywords: ['code', 'snippet'], run: () => run(this.view, insertCodeBlock()) },
      { icon: toolbarIcons.divider, label: 'Divider', description: 'Insert a horizontal divider', category: 'Advanced', keywords: ['hr', 'divider', 'separator'], run: () => run(this.view, insertHR()) }
    ];

    if (options.onPickImage) {
      items.push({ icon: toolbarIcons.image, label: 'Image', description: 'Upload an image from your device', category: 'Media', keywords: ['image', 'upload', 'media'], run: () => options.onPickImage?.() });
    }

    for (const action of options.insertActions ?? []) {
      items.push({
        icon: action.label,
        label: action.title,
        description: action.title,
        category: 'Advanced',
        keywords: [action.title.toLowerCase()],
        run: () => action.run(this.view)
      });
    }
    return items;
  }

  private getVisibleSlashItems() {
    const match = getSlashMatch(this.view.state);
    if (!match || this.readOnly) return [];

    const query = match.query.trim().toLowerCase();
    return this.slashItems.filter((item) => {
      if (!query) return true;
      return item.label.toLowerCase().includes(query) || item.keywords.some((word) => word.includes(query));
    });
  }

  private syncSlash() {
    const match = getSlashMatch(this.view.state);
    const visibleItems = this.getVisibleSlashItems();

    if (!match || !visibleItems.length || this.readOnly) {
      this.slash.hidden = true;
      return;
    }

    const coords = this.view.coordsAtPos(this.view.state.selection.from);
    this.slash.hidden = false;
    this.placeOverlay(this.slash, coords, {
      offsetY: 8
    });
    this.selectedSlashIndex = Math.min(this.selectedSlashIndex, visibleItems.length - 1);
    this.renderSlashItems();
  }

  private renderSlashItems() {
    const visibleItems = this.getVisibleSlashItems();
    this.slashList.replaceChildren();

    let lastCategory = '';

    visibleItems.forEach((item, index) => {
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        const header = document.createElement('div');
        header.className = 'oh-editor__slash-category';
        header.textContent = item.category;
        this.slashList.append(header);
      }

      const button = document.createElement('button');
      const icon = document.createElement('span');
      const copy = document.createElement('span');
      const label = document.createElement('span');
      button.type = 'button';
      button.className = 'oh-editor__slash-item';
      button.dataset.active = index === this.selectedSlashIndex ? 'true' : 'false';
      icon.className = 'oh-editor__slash-item-icon';
      icon.innerHTML = item.icon;
      copy.className = 'oh-editor__slash-item-copy';
      label.className = 'oh-editor__slash-item-label';
      label.textContent = item.label;
      copy.append(label);

      if (item.description) {
        const description = document.createElement('span');
        description.className = 'oh-editor__slash-item-description';
        description.textContent = item.description;
        copy.append(description);
      }

      button.append(icon, copy);
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        void this.applySlashItem(item);
      });
      this.slashList.append(button);
    });
  }

  private async applySlashItem(item: SlashItem | null) {
    if (!item) return;

    const match = getSlashMatch(this.view.state);
    if (match) {
      this.view.dispatch(this.view.state.tr.delete(match.from, match.to));
    }

    await item.run();
    this.view.focus();
    this.slash.hidden = true;
    this.sync();
  }
}
