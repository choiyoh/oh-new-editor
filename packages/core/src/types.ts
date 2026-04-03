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

export interface EditorOptions {
  initialContent?: string;
  outputFormat?: 'html' | 'markdown';
  style?: 'toolbar' | 'notion';
  fontSizes?: number[];
  placeholder?: string;
  readOnly?: boolean;
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
