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
import type { DirectEditorProps, EditorView } from 'prosemirror-view';

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

export type EditorDocument = ProseMirrorNode;
export type EditorTransaction = Transaction;
export type EditorPlugin = Plugin;
export type EditorSchema = Schema;
export type EditorViewInstance = EditorView;

export interface EditorImageOptions {
  upload: (file: File) => Promise<string>;
  maxSize?: number;
  accept?: string[];
}

export interface EditorMarkdownSupport {
  parse: (content?: string) => EditorDocument;
  serialize: (doc: EditorDocument) => string;
}

export interface EditorToolbarAction {
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
  createMenu?: (view: EditorView) => EditorMenuController;
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
    insertActions?: EditorToolbarAction[];
    tableActions?: EditorToolbarAction[];
    tableLimits?: { maxRows?: number; maxCols?: number };
  }): EditorToolbarController;
}

export interface EditorOptions {
  initialContent?: string;
  outputFormat?: 'html' | 'markdown';
  markdown?: EditorMarkdownSupport;
  table?: EditorTableSupport;
  toolbar?: EditorToolbarSupport;
  style?: 'toolbar' | 'notion';
  fontSizes?: number[];
  placeholder?: string;
  image?: EditorImageOptions;
  readOnly?: boolean;
  /** Custom ProseMirror plugins to register. */
  plugins?: Plugin[];
  /** Custom ProseMirror schema (overrides table schema and default). */
  schema?: Schema;
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
}
