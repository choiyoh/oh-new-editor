import { NodeSelection } from 'prosemirror-state';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

const MOBILE_SHEET_MAX_WIDTH = 768;

function shouldUseBottomSheet() {
  if (typeof window === 'undefined') return false;
  // A coarse primary pointer (phones/tablets) rather than "has a touch screen",
  // so touch-enabled laptops keep the inline popup.
  const coarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return coarsePointer || window.innerWidth < MOBILE_SHEET_MAX_WIDTH;
}

import {
  getActiveLink,
  insertCodeBlock,
  insertHR,
  insertParagraph,
  removeLink,
  setCodeBlockLanguage,
  setHeading,
  setLink,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleCode,
  toggleItalic,
  toggleOrderedList,
  toggleStrike,
  toggleUnderline
} from '../../commands';
import { DEFAULT_MESSAGES, formatMessage, type EditorMessages } from '../../i18n';
import type { EditorToolbarAction, EditorToolbarController } from '../../types';
import { normalizeHref } from '../../utils/url';
import { onPress } from '../dom';
import { toolbarIcons } from '../icons';
import { LinkEditor } from '../LinkEditor';
import { TableGridPicker } from '../menus/TableGridPicker';

type NotionUiOptions = {
  readOnly?: boolean;
  onPickImage?: () => Promise<void>;
  onEditImageAlt?: () => void;
  insertActions?: EditorToolbarAction[];
  tableLimits?: { maxRows?: number; maxCols?: number };
  messages?: EditorMessages;
};

type SlashCategory = 'basic' | 'media' | 'advanced';

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
  // Any run of non-space characters, so Hangul/CJK queries such as "/제목" match.
  const match = /(?:^|\s)\/(?<query>[^\s/]*)$/.exec(textBefore);
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

const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function getChoseong(str: string): string {
  return [...str].map((ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      return CHOSEONG[Math.floor((code - 0xAC00) / 588)];
    }
    return ch;
  }).join('');
}

export class NotionUi implements EditorToolbarController {
  readonly element = document.createElement('div');

  private readonly bubble = document.createElement('div');
  private readonly slash = document.createElement('div');
  private readonly slashList = document.createElement('div');
  private readonly codeLanguage = document.createElement('select');
  private readonly slashItems: SlashItem[];
  private selectedSlashIndex = 0;
  private slashQuery: string | null = null;
  private dismissedSlashFrom: number | null = null;
  private keyTarget: HTMLElement;
  private readOnly = false;
  private readonly onEditImageAlt?: () => void;
  private readonly messages: EditorMessages;
  private bubbleHideHandler: (() => void) | null = null;
  private readonly tableLimits?: { maxRows?: number; maxCols?: number };
  private gridPicker: TableGridPicker | null = null;
  private linkEditor: LinkEditor = new LinkEditor();

  private readonly slashBackdrop = document.createElement('div');
  private readonly slashSheet = document.createElement('div');
  private readonly slashHandle = document.createElement('div');
  private slashSheetOpen = false;

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
    this.messages = options.messages ?? DEFAULT_MESSAGES;
    this.linkEditor.setLabels(this.messages);
    this.readOnly = Boolean(options.readOnly);
    this.onEditImageAlt = options.onEditImageAlt;
    this.tableLimits = options.tableLimits;
    this.element.className = 'oh-editor__notion-ui';

    this.bubble.className = 'oh-editor__bubble-toolbar';
    this.bubble.hidden = true;
    this.renderBubble();
    this.ensureBubbleDom();

    this.slash.className = 'oh-editor__slash-menu';
    this.slash.hidden = true;
    this.slashList.className = 'oh-editor__slash-list';
    this.slashList.id = `oh-editor-slash-${Math.random().toString(36).slice(2, 9)}`;
    this.slashList.setAttribute('role', 'listbox');
    this.slashList.setAttribute('aria-label', this.messages.slashMenu);
    this.slash.append(this.slashList);

    this.codeLanguage.className = 'oh-editor__code-language-chip';
    this.codeLanguage.hidden = true;
    this.codeLanguage.title = this.messages.codeLanguage;
    this.codeLanguage.setAttribute('aria-label', this.messages.codeLanguage);
    for (const language of ['', 'plaintext', 'javascript', 'typescript', 'tsx', 'jsx', 'json', 'html', 'css', 'bash', 'markdown']) {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language || this.messages.codeLanguagePlaceholder;
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

    // Capture on the content wrapper so the slash menu sees Enter/arrows before
    // ProseMirror's own keydown handling (which would split the block).
    this.keyTarget = this.view.dom.parentElement ?? this.view.dom;
    this.keyTarget.addEventListener('keydown', this.handleKeyDown, true);
    this.view.dom.addEventListener('input', this.handleInput);

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleVisualViewportResize);
    }

    this.sync();
  }

  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly;
    if (readOnly) {
      this.hideSlashMenu();
      this.cancelBubbleHide();
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
    this.keyTarget.removeEventListener('keydown', this.handleKeyDown, true);
    this.view.dom.removeEventListener('input', this.handleInput);
    this.view.dom.removeAttribute('aria-expanded');
    this.view.dom.removeAttribute('aria-controls');
    this.view.dom.removeAttribute('aria-activedescendant');

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleVisualViewportResize);
    }

    this.closeGridPicker();
    this.linkEditor.close();
    this.hideSlashMenu();
    this.codeLanguage.remove();
    this.slashBackdrop.remove();
    this.slashSheet.remove();
    this.element.remove();
  }

  private openGridPicker() {
    this.closeGridPicker();

    this.gridPicker = new TableGridPicker(this.view, this.tableLimits, this.messages);

    const coords = this.view.coordsAtPos(this.view.state.selection.from);
    const editorRect = this.element.getBoundingClientRect();
    // Attach before opening so the picker can take focus for keyboard use.
    this.element.append(this.gridPicker.element);
    this.gridPicker.open(coords.left - editorRect.left, coords.bottom - editorRect.top + 8);
  }

  private closeGridPicker() {
    if (this.gridPicker) {
      this.gridPicker.destroy();
      this.gridPicker = null;
    }
  }

  private openLinkEditor() {
    const container = this.element;
    const coords = this.view.coordsAtPos(this.view.state.selection.from);
    const existing = getActiveLink(this.view.state);

    this.linkEditor.open({
      container,
      coords: { left: coords.left, top: coords.bottom + 4 },
      anchorHref: existing?.href,
      onConfirm: (value) => {
        const href = normalizeHref(value);
        if (!href) return false;
        run(this.view, setLink(href));
        return true;
      },
      onRemove: existing ? () => run(this.view, removeLink()) : undefined,
      onClose: () => {
        this.view.focus();
        this.sync();
      }
    });
  }

  private readonly handleInput = () => {
    this.syncSlash();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (this.readOnly || !this.isSlashOpen()) return;
    if (!(event.target instanceof Node) || !this.view.dom.contains(event.target)) return;
    // Let the IME finish composing (e.g. Korean) before handling Enter/arrows.
    if (event.isComposing || event.keyCode === 229) return;
    if (!['ArrowDown', 'ArrowUp', 'Escape', 'Enter', 'Tab'].includes(event.key)) return;

    const visibleItems = this.getVisibleSlashItems();
    if (!visibleItems.length) return;

    // Handled here only: keep ProseMirror from also acting on the key.
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'ArrowDown') {
      this.selectedSlashIndex = (this.selectedSlashIndex + 1) % visibleItems.length;
      this.renderSlashItems();
    } else if (event.key === 'ArrowUp') {
      this.selectedSlashIndex = (this.selectedSlashIndex - 1 + visibleItems.length) % visibleItems.length;
      this.renderSlashItems();
    } else if (event.key === 'Escape') {
      // Remember the dismissed "/" so typing more does not reopen the menu.
      this.dismissedSlashFrom = getSlashMatch(this.view.state)?.from ?? null;
      this.hideSlashMenu();
    } else {
      void this.applySlashItem(visibleItems[this.selectedSlashIndex] ?? null);
    }
  };

  private bubbleActions: {
    icon: string;
    title: string;
    action: () => unknown;
    isActive: () => boolean;
    context: 'text' | 'image';
  }[] = [];

  private bubbleButtons: HTMLButtonElement[] = [];
  private bubbleInitialized = false;

  private renderBubble() {
    const m = this.messages;
    this.bubbleActions = [
      { icon: toolbarIcons.bold, title: m.bold, action: () => run(this.view, toggleBold()), isActive: () => hasMark(this.view.state, 'strong'), context: 'text' },
      { icon: toolbarIcons.italic, title: m.italic, action: () => run(this.view, toggleItalic()), isActive: () => hasMark(this.view.state, 'em'), context: 'text' },
      { icon: toolbarIcons.underline, title: m.underline, action: () => run(this.view, toggleUnderline()), isActive: () => hasMark(this.view.state, 'underline'), context: 'text' },
      { icon: toolbarIcons.strike, title: m.strikethrough, action: () => run(this.view, toggleStrike()), isActive: () => hasMark(this.view.state, 'strike'), context: 'text' },
      { icon: toolbarIcons.inlineCode, title: m.inlineCode, action: () => run(this.view, toggleCode()), isActive: () => hasMark(this.view.state, 'code'), context: 'text' },
      { icon: toolbarIcons.link, title: m.link, action: () => { this.openLinkEditor(); }, isActive: () => hasMark(this.view.state, 'link'), context: 'text' },
      { icon: toolbarIcons.bulletList, title: m.bulletList, action: () => run(this.view, toggleBulletList()), isActive: () => isBlockActive(this.view.state, 'bullet_list'), context: 'text' },
      { icon: toolbarIcons.orderedList, title: m.orderedList, action: () => run(this.view, toggleOrderedList()), isActive: () => isBlockActive(this.view.state, 'ordered_list'), context: 'text' },
      { icon: toolbarIcons.quote, title: m.blockquote, action: () => run(this.view, toggleBlockquote()), isActive: () => isBlockActive(this.view.state, 'blockquote'), context: 'text' },
      { icon: toolbarIcons.alt, title: m.editImageAlt, action: () => { this.onEditImageAlt?.(); }, isActive: () => false, context: 'image' }
    ];
  }

  private ensureBubbleDom() {
    if (this.bubbleInitialized) return;
    this.bubbleInitialized = true;

    for (const { icon, title, action, isActive } of this.bubbleActions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'oh-editor__button';
      button.innerHTML = icon;
      button.title = title;
      button.setAttribute('aria-label', title);
      onPress(button, () => {
        if (this.readOnly) return;
        action();
        if (!this.linkEditor.isOpen) this.view.focus();
        this.sync();
      });
      this.bubbleButtons.push(button);
      this.bubble.append(button);
    }
  }

  private getBubbleContext(): 'text' | 'image' {
    if (isImageSelected(this.view.state)) return 'image';
    return 'text';
  }

  private syncBubble() {
    const { selection } = this.view.state;
    const shouldShow = !this.readOnly && !selection.empty && selection.from !== selection.to;

    // Exit animation when hiding. Only one pending hide handler at a time,
    // and it is cancelled if the bubble is shown again before it fires —
    // otherwise the next *enter* animation's `animationend` would hide it.
    if (!shouldShow) {
      if (!this.bubble.hidden && !this.bubbleHideHandler) {
        this.bubble.classList.add('oh-editor__bubble-toolbar--exit');
        const onAnimationEnd = () => {
          this.cancelBubbleHide();
          this.bubble.hidden = true;
        };
        this.bubbleHideHandler = onAnimationEnd;
        this.bubble.addEventListener('animationend', onAnimationEnd);
        // Without animations (reduced motion, hidden tab) animationend may not fire.
        if (typeof getComputedStyle === 'function' && ['', 'none'].includes(getComputedStyle(this.bubble).animationName)) {
          onAnimationEnd();
        }
      }
      return;
    }

    this.cancelBubbleHide();

    this.ensureBubbleDom();
    const context = this.getBubbleContext();

    // Update each button's visibility and active state
    for (let i = 0; i < this.bubbleActions.length; i++) {
      const action = this.bubbleActions[i];
      const button = this.bubbleButtons[i];

      const visible = action.context === context;

      button.hidden = !visible;
      if (visible) {
        button.disabled = this.readOnly;
        button.dataset.active = action.isActive() ? 'true' : 'false';
      }
    }

    this.bubble.hidden = false;
    const start = this.view.coordsAtPos(selection.from);
    const end = this.view.coordsAtPos(selection.to);
    this.placeOverlay(this.bubble, {
      left: (start.left + end.right) / 2,
      top: Math.min(start.top, end.top)
    }, {
      centerX: true,
      offsetY: -this.bubble.offsetHeight - 12
    });
  }

  private cancelBubbleHide() {
    if (this.bubbleHideHandler) {
      this.bubble.removeEventListener('animationend', this.bubbleHideHandler);
      this.bubbleHideHandler = null;
    }
    this.bubble.classList.remove('oh-editor__bubble-toolbar--exit');
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

      // Enforce minimum top offset to avoid overlapping toolbar
      const minTop = 56;
      const currentTop = parseFloat(this.codeLanguage.style.top) || 0;
      if (currentTop < minTop) {
        this.codeLanguage.style.top = `${minTop}px`;
      }
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
    const m = this.messages;
    const heading = (level: 1 | 2 | 3) => formatMessage(m.heading, { level });
    // Keywords stay multilingual so `/제목`, `/标题` and `/heading` all work
    // regardless of the UI language; labels follow `messages`.
    const items: SlashItem[] = [
      { icon: toolbarIcons.paragraph, label: m.slashText, description: m.slashTextDescription, category: 'basic', keywords: ['paragraph', 'text', '텍스트', '본문', '문단', '文本', '段落'], run: () => run(this.view, insertParagraph()) },
      { icon: toolbarIcons.heading1, label: heading(1), description: m.slashHeading1Description, category: 'basic', keywords: ['h1', 'heading', 'title', '제목', '제목1', '큰제목', '표제', '标题', '标题1'], run: () => run(this.view, setHeading(1)) },
      { icon: toolbarIcons.heading2, label: heading(2), description: m.slashHeading2Description, category: 'basic', keywords: ['h2', 'heading', 'subtitle', '제목', '제목2', '중제목', '부제목', '标题', '标题2'], run: () => run(this.view, setHeading(2)) },
      { icon: toolbarIcons.heading3, label: heading(3), description: m.slashHeading3Description, category: 'basic', keywords: ['h3', 'heading', '제목', '제목3', '소제목', '标题', '标题3'], run: () => run(this.view, setHeading(3)) },
      { icon: toolbarIcons.bulletList, label: m.bulletList, description: m.slashBulletListDescription, category: 'basic', keywords: ['list', 'bullet', 'ul', '리스트', '목록', '글머리', '列表', '无序'], run: () => run(this.view, toggleBulletList()) },
      { icon: toolbarIcons.orderedList, label: m.orderedList, description: m.slashOrderedListDescription, category: 'basic', keywords: ['list', 'ordered', 'number', 'ol', '번호', '숫자목록', '순서', '列表', '有序', '编号'], run: () => run(this.view, toggleOrderedList()) },
      { icon: toolbarIcons.quote, label: m.blockquote, description: m.slashBlockquoteDescription, category: 'basic', keywords: ['quote', 'blockquote', '인용', '인용구', '블록인용', '引用'], run: () => run(this.view, toggleBlockquote()) },
      { icon: toolbarIcons.codeBlock, label: m.codeBlock, description: m.slashCodeBlockDescription, category: 'advanced', keywords: ['code', 'snippet', '코드', '코드블록', '소스', '代码'], run: () => run(this.view, insertCodeBlock()) },
      { icon: toolbarIcons.divider, label: m.slashDivider, description: m.slashDividerDescription, category: 'advanced', keywords: ['hr', 'divider', 'separator', '구분선', '가로줄', '분할', '分割线', '分隔'], run: () => run(this.view, insertHR()) }
    ];

    if (options.onPickImage) {
      items.push({ icon: toolbarIcons.image, label: m.slashImage, description: m.slashImageDescription, category: 'media', keywords: ['image', 'upload', 'media', 'picture', '이미지', '사진', '그림', '업로드', '图片', '上传'], run: () => options.onPickImage?.() });
    }

    // If insertActions include a table insert action, show a Table slash item
    // that opens the grid picker instead of inserting 3×3 directly.
    const tableInsertAction = options.insertActions?.[0];
    if (tableInsertAction) {
      items.push({
        icon: toolbarIcons.table,
        label: m.slashTable,
        description: m.slashTableDescription,
        category: 'advanced',
        keywords: ['table', 'grid', 'rows', 'columns', '표', '테이블', '그리드', '행', '열', '表格'],
        run: () => this.openGridPicker()
      });
    }

    for (let i = 1; i < (options.insertActions?.length ?? 0); i++) {
      const action = options.insertActions![i];
      items.push({
        icon: action.label,
        label: action.title,
        description: action.title,
        category: 'advanced',
        keywords: [action.title.toLowerCase()],
        run: () => action.run(this.view)
      });
    }

    // Group by category so each heading is rendered once.
    const order: SlashCategory[] = ['basic', 'media', 'advanced'];
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => order.indexOf(a.item.category) - order.indexOf(b.item.category) || a.index - b.index)
      .map(({ item }) => item);
  }

  private categoryLabel(category: SlashCategory) {
    const m = this.messages;
    return category === 'basic' ? m.slashCategoryBasic : category === 'media' ? m.slashCategoryMedia : m.slashCategoryAdvanced;
  }

  private getVisibleSlashItems() {
    const match = getSlashMatch(this.view.state);
    if (!match || this.readOnly) return [];

    const query = match.query.trim().toLowerCase();
    // Initial-consonant search ("ㅈㅁ" -> "제목") only for queries made of jamo.
    const isChoseongQuery = /^[ㄱ-ㅎ]+$/.test(query);
    return this.slashItems.filter((item) => {
      if (!query) return true;
      return item.label.toLowerCase().includes(query)
        || item.keywords.some((word) => word.includes(query))
        || (isChoseongQuery && item.keywords.some((word) => getChoseong(word).includes(query)));
    });
  }

  private isSlashOpen() {
    return !this.slash.hidden;
  }

  private syncSlash() {
    const match = getSlashMatch(this.view.state);
    const visibleItems = this.getVisibleSlashItems();

    if (match?.from !== this.dismissedSlashFrom) {
      this.dismissedSlashFrom = null;
    }

    if (!match || !visibleItems.length || this.readOnly || this.dismissedSlashFrom !== null) {
      this.hideSlashMenu();
      return;
    }

    // Start from the first item whenever the menu opens or the query changes.
    if (!this.isSlashOpen() || match.query !== this.slashQuery) {
      this.selectedSlashIndex = 0;
    }
    this.slashQuery = match.query;

    if (shouldUseBottomSheet()) {
      this.openSlashSheet();
    } else {
      this.closeSlashSheet();
      this.attachSlashToPopup();
      this.slash.hidden = false;
      const coords = this.view.coordsAtPos(this.view.state.selection.from);
      this.placeOverlay(this.slash, coords, {
        offsetY: 8
      });
    }

    this.selectedSlashIndex = Math.min(this.selectedSlashIndex, visibleItems.length - 1);
    this.renderSlashItems();
    this.view.dom.setAttribute('aria-controls', this.slashList.id);
    this.view.dom.setAttribute('aria-expanded', 'true');
  }

  private renderSlashItems() {
    const visibleItems = this.getVisibleSlashItems();
    this.slashList.replaceChildren();

    const match = getSlashMatch(this.view.state);
    const query = match?.query.trim().toLowerCase() ?? '';
    let lastCategory = '';
    let activeButton: HTMLButtonElement | null = null;

    visibleItems.forEach((item, index) => {
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        const header = document.createElement('div');
        header.className = 'oh-editor__slash-category';
        header.setAttribute('role', 'presentation');
        header.textContent = this.categoryLabel(item.category);
        this.slashList.append(header);
      }

      const active = index === this.selectedSlashIndex;
      const button = document.createElement('button');
      const icon = document.createElement('span');
      const copy = document.createElement('span');
      const label = document.createElement('span');
      button.type = 'button';
      button.tabIndex = -1;
      button.id = `${this.slashList.id}-${index}`;
      button.className = 'oh-editor__slash-item';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(active));
      button.dataset.active = active ? 'true' : 'false';
      icon.className = 'oh-editor__slash-item-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = item.icon;
      copy.className = 'oh-editor__slash-item-copy';
      label.className = 'oh-editor__slash-item-label';
      copy.append(label);

      const matchIndex = query ? item.label.toLowerCase().indexOf(query) : -1;
      if (matchIndex >= 0) {
        const highlight = document.createElement('mark');
        highlight.className = 'oh-editor__slash-item-highlight';
        highlight.textContent = item.label.slice(matchIndex, matchIndex + query.length);
        label.append(item.label.slice(0, matchIndex), highlight, item.label.slice(matchIndex + query.length));
      } else {
        label.textContent = item.label;
      }

      if (item.description) {
        const description = document.createElement('span');
        description.className = 'oh-editor__slash-item-description';
        description.textContent = item.description;
        copy.append(description);
      }

      button.append(icon, copy);
      onPress(button, () => {
        void this.applySlashItem(item);
      });
      this.slashList.append(button);
      if (active) activeButton = button;
    });

    if (activeButton) {
      this.view.dom.setAttribute('aria-activedescendant', (activeButton as HTMLButtonElement).id);
      (activeButton as HTMLButtonElement).scrollIntoView?.({ block: 'nearest' });
    }
  }

  private async applySlashItem(item: SlashItem | null) {
    if (!item) return;

    const match = getSlashMatch(this.view.state);
    if (match) {
      this.view.dispatch(this.view.state.tr.delete(match.from, match.to));
    }

    this.hideSlashMenu();
    await item.run();
    // The table grid picker takes focus for keyboard selection; leave it there.
    if (!this.gridPicker) this.view.focus();
    this.sync();
  }

  private hideSlashMenu() {
    this.slash.hidden = true;
    this.slashQuery = null;
    this.view.dom.removeAttribute('aria-activedescendant');
    this.view.dom.removeAttribute('aria-controls');
    this.view.dom.setAttribute('aria-expanded', 'false');
    this.closeSlashSheet();
    this.attachSlashToPopup();
  }

  private attachSlashToPopup() {
    if (this.slash.parentElement !== this.element) {
      this.slash.classList.remove('oh-editor__slash-menu--mobile');
      this.element.append(this.slash);
    }
  }

  private ensureSlashSheetElements() {
    if (this.slashSheet.isConnected) return;

    this.slashBackdrop.className = 'oh-editor__slash-backdrop';
    this.slashBackdrop.setAttribute('aria-hidden', 'true');
    this.slashBackdrop.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.hideSlashMenu();
      this.view.focus();
    });

    this.slashSheet.className = 'oh-editor__slash-bottom-sheet';
    this.slashSheet.setAttribute('role', 'dialog');
    this.slashSheet.setAttribute('aria-label', 'Slash commands');
    this.slashSheet.setAttribute('aria-hidden', 'true');

    this.slashHandle.className = 'oh-editor__slash-bottom-sheet-handle';
    this.slashHandle.setAttribute('aria-hidden', 'true');

    this.slashSheet.append(this.slashHandle);
    document.body.append(this.slashBackdrop, this.slashSheet);
  }

  private openSlashSheet() {
    this.ensureSlashSheetElements();

    // The sheet lives on <body>; carry over a theme set on an ancestor of the
    // editor (e.g. a demo container with data-theme="dark").
    const theme = this.view.dom.closest('[data-theme]')?.getAttribute('data-theme');
    for (const element of [this.slashSheet, this.slashBackdrop]) {
      if (theme) element.dataset.theme = theme;
      else delete element.dataset.theme;
    }

    if (this.slash.parentElement !== this.slashSheet) {
      this.slash.classList.add('oh-editor__slash-menu--mobile');
      this.slashSheet.append(this.slash);
    }

    this.slash.hidden = false;
    this.slashBackdrop.classList.add('is-open');
    this.slashSheet.classList.add('is-open');
    this.slashBackdrop.setAttribute('aria-hidden', 'false');
    this.slashSheet.setAttribute('aria-hidden', 'false');
    this.slashSheetOpen = true;
    this.updateSlashSheetPosition();
  }

  private closeSlashSheet() {
    if (!this.slashSheetOpen && !this.slashSheet.isConnected) return;

    this.slashBackdrop.classList.remove('is-open');
    this.slashSheet.classList.remove('is-open');
    this.slashBackdrop.setAttribute('aria-hidden', 'true');
    this.slashSheet.setAttribute('aria-hidden', 'true');
    this.slashSheetOpen = false;
  }

  private readonly handleVisualViewportResize = () => {
    if (this.slashSheetOpen) {
      this.updateSlashSheetPosition();
    }
  };

  private updateSlashSheetPosition() {
    if (!window.visualViewport) return;

    const keyboardHeight = Math.max(
      0,
      window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
    );
    this.slashSheet.style.bottom = `${keyboardHeight}px`;
  }
}
