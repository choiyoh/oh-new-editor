import type {
  DOMOutputSpec,
  Mark as ProseMirrorMark,
  MarkSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  ParseRule,
  ResolvedPos,
  Schema
} from 'prosemirror-model';
import type { EditorState, Plugin, Transaction } from 'prosemirror-state';
import type { DirectEditorProps, EditorView, NodeViewConstructor } from 'prosemirror-view';

import type { EditorMessages } from './i18n';

export type {
  DOMOutputSpec,
  DirectEditorProps,
  EditorState,
  EditorView,
  MarkSpec,
  NodeSpec,
  ParseRule,
  Plugin,
  ProseMirrorMark,
  ProseMirrorNode,
  ResolvedPos,
  Schema,
  Transaction
};

export type { NodeViewConstructor };
export type EditorDocument = ProseMirrorNode;
export type EditorTransaction = Transaction;
export type EditorPlugin = Plugin;
export type EditorSchema = Schema;
export type EditorViewInstance = EditorView;

export interface EditorImageOptions {
  upload: (file: File) => Promise<string>;
  maxSize?: number;
  accept?: string[];
  /** Alt text for an uploaded image. Defaults to the file name. */
  altText?: (file: File) => string;
}

/** 슬래시 메뉴에 추가하는 항목. `createNotionSupport({ slashItems })`로 전달한다. */
export interface SlashItemSpec {
  /** 아이콘(innerHTML로 렌더링: SVG 문자열 또는 이모지) */
  icon: string;
  label: string;
  description?: string;
  category?: 'basic' | 'media' | 'advanced';
  /** 검색 키워드(한글 초성 검색 포함) */
  keywords: string[];
  run: (view: EditorView) => unknown;
}

export interface EditorMarkdownSupport {
  /** `schema` is the editor's active schema (e.g. with table nodes). */
  parse: (content?: string, schema?: EditorSchema) => EditorDocument;
  serialize: (doc: EditorDocument) => string;
}

export interface EditorToolbarAction {
  /** Stable identifier; built-in UIs use it to look up a translated title. */
  id?: string;
  label: string;
  title: string;
  run: (view: EditorView) => boolean | Promise<boolean>;
  isEnabled?: (state: EditorState) => boolean;
  isActive?: (state: EditorState) => boolean;
}

export interface EditorMenuController {
  element: HTMLElement;
  open(left: number, top: number): void;
  close(): void;
  sync(): void;
  contains(target: EventTarget | null): boolean;
  destroy(): void;
}

export interface EditorTableSupport {
  schema: EditorSchema;
  plugins: EditorPlugin[];
  maxRows?: number;
  maxCols?: number;
  insertActions?: EditorToolbarAction[];
  actions?: EditorToolbarAction[];
  createMenu?: (view: EditorView, messages?: EditorMessages) => EditorMenuController;
}

export interface EditorToolbarController {
  element: HTMLElement;
  setReadOnly(readOnly: boolean): void;
  sync(): void;
  destroy(): void;
}

export interface EditorToolbarSupport {
  createToolbar(view: EditorView, options: {
    fontSizes?: number[];
    readOnly?: boolean;
    canUploadImages?: boolean;
    onPickImage?: () => Promise<void>;
    onEditImageAlt?: () => void;
    onError?: (error: unknown) => void;
    insertActions?: EditorToolbarAction[];
    tableActions?: EditorToolbarAction[];
    tableLimits?: { maxRows?: number; maxCols?: number };
    messages?: EditorMessages;
  }): EditorToolbarController;
}

export type EditorStyle = 'toolbar' | 'notion';

export type EditorStyleMap = Record<EditorStyle, EditorToolbarSupport>;

export interface AIContext {
  documentContent: string;
  selectedText: string;
  textBefore: string;
  textAfter: string;
  cursorOffset: number;
  outputFormat: 'html' | 'markdown';
}

export interface EditorAIOptions {
  onGenerate: (prompt: string, context: AIContext, signal: AbortSignal) => Promise<string>;
  onStream?: (prompt: string, context: AIContext, signal: AbortSignal) => AsyncIterable<string>;
  /** Called when generation fails (not when it is cancelled). Text streamed so far is kept. */
  onError?: (error: unknown) => void;
}

export interface EditorAIController {
  generate(prompt?: string): Promise<void>;
  getContext(): AIContext;
  cancel(): void;
  readonly isGenerating: boolean;
}

export interface EditorOptions {
  initialContent?: string;
  outputFormat?: 'html' | 'markdown';
  markdown?: EditorMarkdownSupport;
  table?: EditorTableSupport;
  toolbar?: EditorToolbarSupport;
  style?: 'toolbar' | 'notion';
  /** Factory map for runtime UI mode switching. e.g. { toolbar: createToolbarSupport(), notion: createNotionSupport() } */
  styles?: EditorStyleMap;
  fontSizes?: number[];
  placeholder?: string;
  image?: EditorImageOptions;
  readOnly?: boolean;
  /** Custom ProseMirror plugins to register. */
  plugins?: Plugin[];
  /** Plugins registered before the built-in keymaps (e.g. custom Enter/Backspace handling). */
  priorityPlugins?: Plugin[];
  /** Maps an image `src` to a loadable URL at render time (e.g. vault-relative path → vault:// URL). */
  resolveImageSrc?: (src: string) => string;
  /** Text prompt used for alt-text editing. Defaults to `window.prompt`, which Electron does not support. */
  prompt?: (message: string, value: string) => Promise<string | null>;
  /** Reports failures from built-in UI actions, including async prompts and slash commands. */
  onError?: (error: unknown) => void;
  /** Extra node views keyed by node type name. */
  nodeViews?: Record<string, NodeViewConstructor>;
  /** Custom ProseMirror schema (overrides table schema and default). */
  schema?: Schema;
  /** AI collaboration hooks. */
  ai?: EditorAIOptions;
  /** Overrides for built-in UI strings, e.g. `messagesKo` from `@oh-new-editor/core`. */
  messages?: Partial<EditorMessages>;
}

export type EditorEventName = 'change' | 'focus' | 'blur' | 'ready';
export type EditorEventHandler = () => void;

export interface Editor {
  getContent(format?: 'html' | 'markdown'): string;
  setContent(content: string, format?: 'html' | 'markdown'): void;
  setOutputFormat(format: 'html' | 'markdown'): void;
  setReadOnly(readOnly: boolean): void;
  focus(): void;
  blur(): void;
  on(event: EditorEventName, handler: EditorEventHandler): void;
  off(event: EditorEventName, handler: EditorEventHandler): void;
  destroy(): void;
  /** The underlying ProseMirror view. */
  getView(): EditorView;
  getDocument(): ProseMirrorNode;
  /**
   * Replace the whole document and reset history. `silent` suppresses the `change` event,
   * which is what you want when loading a document from disk.
   * The document must use this editor's schema and top node type; invalid documents throw.
   */
  setDocument(doc: ProseMirrorNode, options?: { silent?: boolean }): void;
  readonly ai: EditorAIController | null;
  /** Switch editor UI style at runtime without destroying state. */
  setStyle(style: EditorStyle): void;
  /** Current editor UI style. */
  getStyle(): EditorStyle;
}
