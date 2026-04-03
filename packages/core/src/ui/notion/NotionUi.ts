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
  toggleItalic,
  toggleLink,
  toggleOrderedList,
  toggleStrike,
  toggleUnderline
} from '../../commands';
import type { EditorToolbarAction, EditorToolbarController } from '../../types';

type NotionUiOptions = {
  readOnly?: boolean;
  onPickImage?: () => Promise<void>;
  insertActions?: EditorToolbarAction[];
};

type SlashItem = {
  label: string;
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

export class NotionUi implements EditorToolbarController {
  readonly element = document.createElement('div');

  private readonly bubble = document.createElement('div');
  private readonly slash = document.createElement('div');
  private readonly slashList = document.createElement('div');
  private readonly codeLanguage = document.createElement('select');
  private readonly slashItems: SlashItem[];
  private selectedSlashIndex = 0;
  private readOnly = false;

  constructor(
    private readonly view: EditorView,
    options: NotionUiOptions = {}
  ) {
    this.readOnly = Boolean(options.readOnly);
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

  private renderBubble() {
    const actions = [
      ['B', 'Bold', () => run(this.view, toggleBold())],
      ['I', 'Italic', () => run(this.view, toggleItalic())],
      ['U', 'Underline', () => run(this.view, toggleUnderline())],
      ['S', 'Strike', () => run(this.view, toggleStrike())],
      ['Link', 'Link', () => {
        const href = window.prompt('Enter URL', 'https://');
        if (!href) return false;
        return run(this.view, toggleLink(href));
      }]
    ] as const;

    for (const [label, title, action] of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'oh-editor__button';
      button.textContent = label;
      button.title = title;
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

    const start = this.view.coordsAtPos(selection.from);
    const end = this.view.coordsAtPos(selection.to);
    this.bubble.hidden = false;
    this.bubble.style.left = `${(start.left + end.right) / 2}px`;
    this.bubble.style.top = `${Math.min(start.top, end.top) - 12}px`;
    this.bubble.style.transform = 'translate(-50%, -100%)';
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
      this.codeLanguage.style.left = `${coords.left}px`;
      this.codeLanguage.style.top = `${coords.top - 36}px`;
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
      { label: 'Text', keywords: ['paragraph', 'text'], run: () => run(this.view, insertParagraph()) },
      { label: 'Heading 1', keywords: ['h1', 'heading'], run: () => run(this.view, setHeading(1)) },
      { label: 'Heading 2', keywords: ['h2', 'heading'], run: () => run(this.view, setHeading(2)) },
      { label: 'Heading 3', keywords: ['h3', 'heading'], run: () => run(this.view, setHeading(3)) },
      { label: 'Bullet List', keywords: ['list', 'bullet'], run: () => run(this.view, toggleBulletList()) },
      { label: 'Ordered List', keywords: ['list', 'ordered', 'number'], run: () => run(this.view, toggleOrderedList()) },
      { label: 'Blockquote', keywords: ['quote'], run: () => run(this.view, toggleBlockquote()) },
      { label: 'Code Block', keywords: ['code'], run: () => run(this.view, insertCodeBlock()) },
      { label: 'Divider', keywords: ['hr', 'divider'], run: () => run(this.view, insertHR()) }
    ];

    if (options.onPickImage) {
      items.push({ label: 'Image', keywords: ['image', 'upload'], run: () => options.onPickImage?.() });
    }

    for (const action of options.insertActions ?? []) {
      items.push({
        label: action.label,
        keywords: [action.label.toLowerCase(), action.title.toLowerCase()],
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
    this.slash.style.left = `${coords.left}px`;
    this.slash.style.top = `${coords.bottom + 8}px`;
    this.selectedSlashIndex = Math.min(this.selectedSlashIndex, visibleItems.length - 1);
    this.renderSlashItems();
  }

  private renderSlashItems() {
    const visibleItems = this.getVisibleSlashItems();
    this.slashList.replaceChildren();

    visibleItems.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'oh-editor__slash-item';
      button.dataset.active = index === this.selectedSlashIndex ? 'true' : 'false';
      button.textContent = item.label;
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
