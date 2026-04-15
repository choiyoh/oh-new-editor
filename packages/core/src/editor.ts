import { EditorState, NodeSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { parseHtml } from './parsers/html';
import { createHistoryPlugin } from './plugins/history';
import {
  DEFAULT_ACCEPTED_IMAGE_TYPES,
  createImageUploadPlugin,
  uploadImageFiles,
  type UploadLifecycle
} from './plugins/imageUpload';
import { createInputRulesPlugin } from './plugins/inputRules';
import { createKeymapPlugin, createBaseKeymapPlugin } from './plugins/keymap';
import { createPastePlugin } from './plugins/paste';
import { createPlaceholderPlugin } from './plugins/placeholder';
import { editorSchema } from './schema';
import { serializeHtml } from './serializers/html';
import type { Editor, EditorEventHandler, EditorEventName, EditorMenuController, EditorOptions, EditorSchema, EditorToolbarController } from './types';
import { createImageNodeView } from './ui/ImageNodeView';

const DEFAULT_OUTPUT_FORMAT = 'html';
const MISSING_MARKDOWN_SUPPORT_ERROR = 'Markdown support is no longer bundled by default. Import createMarkdownSupport from @oh-new-editor/core/markdown and pass it as options.markdown.';

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
    createImageUploadPlugin(options.image),
    createPastePlugin(options.table),
    createKeymapPlugin(),
    createBaseKeymapPlugin(),
    ...(options.table?.plugins ?? []),
    options.placeholder ? createPlaceholderPlugin(options.placeholder) : null
  ].filter((plugin): plugin is Plugin => Boolean(plugin));
}

class ProseMirrorEditor implements Editor {
  private readonly events = createEventStore();
  private readonly host: HTMLElement;
  private readonly content: HTMLElement;
  private readonly options: EditorOptions;
  private readonly schema: EditorSchema;
  private readonly plugins: Plugin[];
  private view: EditorView;
  private toolbar: EditorToolbarController | null = null;
  private menuController: EditorMenuController | null = null;
  private outputFormat: 'html' | 'markdown';
  private readOnly = false;
  private destroyed = false;
  private readonly imageInput = document.createElement('input');
  private readonly uploadLifecycle: UploadLifecycle = {
    isAlive: () => !this.destroyed
  };

  constructor(host: HTMLElement, options: EditorOptions = {}) {
    this.host = host;
    this.options = options;
    this.schema = options.table?.schema ?? editorSchema;
    this.content = document.createElement('div');
    this.content.className = 'oh-editor__content';
    this.plugins = createPlugins(options);
    this.host.classList.add('oh-editor');
    this.host.replaceChildren();
    this.outputFormat = options.outputFormat ?? DEFAULT_OUTPUT_FORMAT;
    this.readOnly = Boolean(options.readOnly);
    this.host.append(this.content);
    this.imageInput.type = 'file';
    this.imageInput.hidden = true;
    this.imageInput.accept = (options.image?.accept ?? DEFAULT_ACCEPTED_IMAGE_TYPES).join(',');
    this.imageInput.addEventListener('change', this.handleImageInputChange);
    this.host.append(this.imageInput);

    this.view = this.createView(this.parseContent(options.initialContent, this.outputFormat));

    if (options.toolbar) {
      this.toolbar = options.toolbar.createToolbar(this.view, {
        fontSizes: options.fontSizes,
        readOnly: this.readOnly,
        canUploadImages: Boolean(options.image?.upload),
        onPickImage: () => this.pickImage(),
        onEditImageAlt: () => this.editSelectedImageAlt(),
        insertActions: options.table?.insertActions,
        tableActions: options.table?.actions,
        tableLimits: options.table ? { maxRows: options.table.maxRows, maxCols: options.table.maxCols } : undefined
      });
      this.host.prepend(this.toolbar.element);
    }

    const menu = options.table?.createMenu?.(this.view);
    if (menu) {
      this.host.append(menu.element);
      this.menuController = menu;
    }

    this.view.dom.addEventListener('focus', this.handleFocus);
    this.view.dom.addEventListener('blur', this.handleBlur);
    this.host.addEventListener('mousedown', this.handleHostMouseDown);
    this.emit('ready');
  }
  getContent(format: 'html' | 'markdown' = this.outputFormat) {
    if (format === 'markdown') {
      return this.getMarkdownSupport().serialize(this.view.state.doc);
    }

    return serializeHtml(this.view.state.doc, this.schema);
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
    this.destroyed = true;
    this.view.dom.removeEventListener('focus', this.handleFocus);
    this.view.dom.removeEventListener('blur', this.handleBlur);
    this.host.removeEventListener('mousedown', this.handleHostMouseDown);
    this.imageInput.removeEventListener('change', this.handleImageInputChange);
    this.toolbar?.destroy();
    this.menuController?.destroy();
    this.view.destroy();
    this.host.replaceChildren();
    this.host.classList.remove('oh-editor');
    this.events.clear();
  }

  private readonly handleFocus = () => {
    this.toolbar?.sync();
    this.emit('focus');
  };

  private readonly handleBlur = () => {
    this.toolbar?.sync();
    this.menuController?.close();
    this.emit('blur');
  };

  private readonly handleHostMouseDown = (event: MouseEvent) => {
    if (this.menuController?.contains(event.target)) {
      return;
    }

    this.menuController?.close();
  };

  private readonly handleImageInputChange = () => {
    const files = this.imageInput.files ? Array.from(this.imageInput.files) : [];
    this.imageInput.value = '';
    if (!files.length) return;
    this.uploadImages(files);
  };

  private createState(doc = parseHtml(undefined, this.schema)) {
    return EditorState.create({
      schema: this.schema,
      doc,
      plugins: this.plugins
    });
  }

  private parseContent(content: string | undefined, format: 'html' | 'markdown') {
    return format === 'markdown' ? this.getMarkdownSupport().parse(content) : parseHtml(content, this.schema);
  }

  private getMarkdownSupport() {
    if (!this.options.markdown) {
      throw new Error(MISSING_MARKDOWN_SUPPORT_ERROR);
    }

    return this.options.markdown;
  }

  private async pickImage() {
    if (this.readOnly || !this.options.image?.upload) return;
    this.imageInput.accept = (this.options.image.accept ?? DEFAULT_ACCEPTED_IMAGE_TYPES).join(',');
    this.imageInput.click();
  }

  private uploadImages(files: File[]) {
    uploadImageFiles(this.view, files, this.options.image, this.view.state.selection.from, this.uploadLifecycle);
  }

  private editSelectedImageAlt() {
    const selection = this.view.state.selection;
    if (!(selection instanceof NodeSelection) || selection.node.type !== this.view.state.schema.nodes.image) {
      return;
    }

    const currentAlt = selection.node.attrs.alt ?? '';
    const nextAlt = window.prompt('Enter image alt text', currentAlt);
    if (nextAlt === null) {
      return;
    }

    this.view.dispatch(
      this.view.state.tr
        .setNodeMarkup(selection.from, undefined, {
          ...selection.node.attrs,
          alt: nextAlt.trim() || null
        })
        .scrollIntoView()
    );
  }

  private createView(doc = parseHtml(undefined, this.schema)) {
    return new EditorView(this.content, {
      state: this.createState(doc),
      editable: () => !this.readOnly,
      nodeViews: {
        image: (node, view, getPos) => {
          if (typeof getPos !== 'function') {
            throw new Error('Expected image node position accessor');
          }

          return createImageNodeView(view)(node, view, getPos);
        }
      },
      handleDoubleClickOn: (_view, pos, node) => {
        if (this.readOnly || node.type !== this.view.state.schema.nodes.image) {
          return false;
        }

        this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
        this.editSelectedImageAlt();
        return true;
      },
      handleDOMEvents: {
        contextmenu: (view, event) => {
          if (!this.menuController) {
            return false;
          }

          const target = event.target;
          if (!(target instanceof HTMLElement) || !target.closest('td, th')) {
            this.menuController.close();
            return false;
          }

          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!coords) {
            return false;
          }

          event.preventDefault();
          view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, coords.pos)));
          this.menuController.open(event.clientX, event.clientY);
          return true;
        }
      },
      dispatchTransaction: (transaction) => {
        const nextState = this.view.state.apply(transaction);
        this.view.updateState(nextState);
        this.toolbar?.sync();
        this.menuController?.sync();
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
