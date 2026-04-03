import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { parseHtml } from './parsers/html';
import { parseMarkdown } from './parsers/markdown';
import { createHistoryPlugin } from './plugins/history';
import { createInputRulesPlugin } from './plugins/inputRules';
import { createKeymapPlugin, createBaseKeymapPlugin } from './plugins/keymap';
import { createPastePlugin } from './plugins/paste';
import { createPlaceholderPlugin } from './plugins/placeholder';
import { editorSchema } from './schema';
import { serializeHtml } from './serializers/html';
import { serializeMarkdown } from './serializers/markdown';
import type { Editor, EditorEventHandler, EditorEventName, EditorOptions } from './types';
import { Toolbar } from './ui/toolbar/Toolbar';

const DEFAULT_OUTPUT_FORMAT = 'html';
const DEFAULT_STYLE = 'toolbar';

const EVENT_NAMES: EditorEventName[] = ['change', 'focus', 'blur', 'ready'];

function createEventStore() {
  return new Map<EditorEventName, Set<EditorEventHandler>>(
    EVENT_NAMES.map((eventName) => [eventName, new Set<EditorEventHandler>()])
  );
}

function createPlugins(options: EditorOptions) {
  return [
    createHistoryPlugin(),
    createInputRulesPlugin(),
    createPastePlugin(),
    createKeymapPlugin(),
    createBaseKeymapPlugin(),
    options.placeholder ? createPlaceholderPlugin(options.placeholder) : null
  ].filter((plugin): plugin is Plugin => Boolean(plugin));
}

class ProseMirrorEditor implements Editor {
  private readonly events = createEventStore();
  private readonly host: HTMLElement;
  private readonly content: HTMLElement;
  private readonly plugins: Plugin[];
  private view: EditorView;
  private toolbar: Toolbar | null = null;
  private outputFormat: 'html' | 'markdown';
  private readOnly = false;

  constructor(host: HTMLElement, options: EditorOptions = {}) {
    this.host = host;
    this.content = document.createElement('div');
    this.content.className = 'oh-editor__content';
    this.plugins = createPlugins(options);
    this.host.classList.add('oh-editor');
    this.host.replaceChildren();
    this.outputFormat = options.outputFormat ?? DEFAULT_OUTPUT_FORMAT;
    this.readOnly = Boolean(options.readOnly);
    this.host.append(this.content);

    this.view = this.createView(this.parseContent(options.initialContent, this.outputFormat));

    if ((options.style ?? DEFAULT_STYLE) === 'toolbar') {
      this.toolbar = new Toolbar(this.view, {
        fontSizes: options.fontSizes,
        readOnly: this.readOnly
      });
      this.host.prepend(this.toolbar.element);
    }

    this.view.dom.addEventListener('focus', this.handleFocus);
    this.view.dom.addEventListener('blur', this.handleBlur);
    this.emit('ready');
  }

  getContent(format: 'html' | 'markdown' = this.outputFormat) {
    if (format === 'markdown') {
      return serializeMarkdown(this.view.state.doc);
    }

    return serializeHtml(this.view.state.doc);
  }

  setContent(content: string, format: 'html' | 'markdown' = 'html') {
    this.view.updateState(this.createState(this.parseContent(content, format)));
    this.toolbar?.sync();
    this.emit('change');
  }

  setOutputFormat(format: 'html' | 'markdown') {
    this.outputFormat = format;
  }

  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly;

    this.view.setProps({
      editable: () => !this.readOnly
    });
    this.toolbar?.setReadOnly(readOnly);
  }

  focus() {
    this.view.focus();
  }

  blur() {
    this.view.dom.blur();
  }

  on(event: EditorEventName, handler: EditorEventHandler) {
    this.events.get(event)?.add(handler);
  }

  off(event: EditorEventName, handler: EditorEventHandler) {
    this.events.get(event)?.delete(handler);
  }

  destroy() {
    this.view.dom.removeEventListener('focus', this.handleFocus);
    this.view.dom.removeEventListener('blur', this.handleBlur);
    this.toolbar?.destroy();
    this.view.destroy();
    this.host.classList.remove('oh-editor');
    this.events.clear();
  }

  private readonly handleFocus = () => {
    this.toolbar?.sync();
    this.emit('focus');
  };

  private readonly handleBlur = () => {
    this.toolbar?.sync();
    this.emit('blur');
  };

  private createState(doc = parseHtml()) {
    return EditorState.create({
      schema: editorSchema,
      doc,
      plugins: this.plugins
    });
  }

  private parseContent(content: string | undefined, format: 'html' | 'markdown') {
    return format === 'markdown' ? parseMarkdown(content) : parseHtml(content);
  }

  private createView(doc = parseHtml()) {
    return new EditorView(this.content, {
      state: this.createState(doc),
      editable: () => !this.readOnly,
      dispatchTransaction: (transaction) => {
        const nextState = this.view.state.apply(transaction);
        this.view.updateState(nextState);
        this.toolbar?.sync();
        this.emit('change');
      }
    });
  }

  private emit(event: EditorEventName) {
    for (const handler of this.events.get(event) ?? []) {
      handler();
    }
  }
}

export function createEditor(element: HTMLElement, options: EditorOptions = {}): Editor {
  return new ProseMirrorEditor(element, options);
}

export { editorSchema };
