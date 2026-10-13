import { EditorState, NodeSelection, Plugin, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { closeHistory } from 'prosemirror-history';

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
import { resolveMessages, type EditorMessages } from './i18n';
import { serializeHtml } from './serializers/html';
import type { Editor, EditorDocument, EditorAIController, EditorAIOptions, EditorEventHandler, EditorEventName, EditorMenuController, EditorOptions, EditorSchema, EditorStyle, EditorStyleMap, EditorToolbarController, EditorToolbarSupport, AIContext } from './types';
import { aiPluginKey, createAIPlugin } from './plugins/ai';
import { createImageNodeView } from './ui/ImageNodeView';

const DEFAULT_OUTPUT_FORMAT = 'html';
const MISSING_MARKDOWN_SUPPORT_ERROR = 'Markdown support is no longer bundled by default. Import createMarkdownSupport from @oh-new-editor/core/markdown and pass it as options.markdown.';

const EVENT_NAMES: EditorEventName[] = ['change', 'focus', 'blur', 'ready'];

function createEventStore() {
  return new Map<EditorEventName, Set<EditorEventHandler>>(
    EVENT_NAMES.map((eventName) => [eventName, new Set<EditorEventHandler>()])
  );
}

function isSelectionInTableCell(state: EditorState) {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const role = $from.node(depth).type.spec.tableRole;
    if (role === 'cell' || role === 'header_cell') return true;
  }
  return false;
}

function createPlugins(options: EditorOptions, schema: EditorSchema, messages: EditorMessages) {
  return [
    ...(options.priorityPlugins ?? []),
    createHistoryPlugin(),
    createInputRulesPlugin(schema),
    createImageUploadPlugin(options.image, messages),
    createPastePlugin(options.table),
    createKeymapPlugin(schema),
    createBaseKeymapPlugin(),
    ...(options.table?.plugins ?? []),
    ...(options.plugins ?? []),
    options.ai ? createAIPlugin() : null,
    options.placeholder ? createPlaceholderPlugin(options.placeholder) : null
  ].filter((plugin): plugin is Plugin => Boolean(plugin));
}

class ProseMirrorEditor implements Editor {
  private readonly events = createEventStore();
  private readonly host: HTMLElement;
  private readonly content: HTMLElement;
  private readonly options: EditorOptions;
  private readonly schema: EditorSchema;
  private readonly messages: EditorMessages;
  private readonly plugins: Plugin[];
  private view: EditorView;
  private toolbar: EditorToolbarController | null = null;
  private styleFactories: EditorStyleMap | null = null;
  private currentStyle: EditorStyle = 'toolbar';
  private menuController: EditorMenuController | null = null;
  private outputFormat: 'html' | 'markdown';
  private readOnly = false;
  private destroyed = false;
  private replacingDocument = false;
  private readonly imageInput = document.createElement('input');
  private readonly uploadLifecycle: UploadLifecycle = {
    isAlive: () => !this.destroyed
  };

  readonly ai: EditorAIController | null = null;

  constructor(host: HTMLElement, options: EditorOptions = {}) {
    this.host = host;
    this.options = options;
    this.schema = options.schema ?? options.table?.schema ?? editorSchema;
    this.content = document.createElement('div');
    this.content.className = 'oh-editor__content';
    this.messages = resolveMessages(options.messages);
    this.plugins = createPlugins(options, this.schema, this.messages);
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

    if (options.styles) {
      this.styleFactories = options.styles;
      const initial: EditorStyle = (options.style as EditorStyle) ?? 'toolbar';
      // setStyle expects currentStyle !== style to actually do work, so set currentStyle first to trigger it
      this.currentStyle = initial === 'toolbar' ? 'notion' : 'toolbar';
      this.setStyle(initial);
    } else if (options.toolbar) {
      this.toolbar = options.toolbar.createToolbar(this.view, this.getToolbarContext());
      this.host.prepend(this.toolbar.element);
      this.currentStyle = 'toolbar';
    }

    const menu = options.table?.createMenu?.(this.view, this.messages);
    if (menu) {
      this.host.append(menu.element);
      this.menuController = menu;
    }

    if (options.ai) {
      this.ai = this.createAIController(options.ai);
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
    this.replaceDocument(this.parseContent(content, format));
  }

  getView() {
    return this.view;
  }

  getDocument() {
    return this.view.state.doc;
  }

  setDocument(doc: EditorDocument, options: { silent?: boolean } = {}) {
    if (doc.type.schema !== this.schema || doc.type !== this.schema.topNodeType) {
      throw new RangeError('Expected a document from this editor\'s schema');
    }
    doc.check();
    this.replaceDocument(doc, options.silent);
  }

  private replaceDocument(doc: EditorDocument, silent = false) {
    this.replacingDocument = true;
    try {
      this.ai?.cancel();
      this.view.updateState(this.createState(doc));
    } finally {
      this.replacingDocument = false;
    }
    this.toolbar?.sync();
    if (!silent) this.emit('change');
  }

  setOutputFormat(format: 'html' | 'markdown') {
    this.outputFormat = format;
  }

  setReadOnly(readOnly: boolean) {
    this.readOnly = readOnly;

    this.view.setProps({
      editable: () => this.isEditable()
    });
    this.toolbar?.setReadOnly(readOnly);
  }

  setStyle(style: EditorStyle): void {
    if (this.destroyed) throw new Error('Editor is destroyed');
    if (!this.styleFactories?.[style]) {
      const registered = Object.keys(this.styleFactories ?? {}).join(', ');
      throw new Error(`Unknown editor style: "${style}". Registered: ${registered}`);
    }
    if (style === this.currentStyle) return;

    this.toolbar?.destroy();
    this.toolbar = null;

    this.toolbar = this.styleFactories[style].createToolbar(this.view, this.getToolbarContext());
    this.host.prepend(this.toolbar.element);
    this.currentStyle = style;
  }

  getStyle(): EditorStyle {
    return this.currentStyle;
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
    this.ai?.cancel();
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

  private readonly handleBlur = (event: FocusEvent) => {
    this.toolbar?.sync();
    // Moving focus into the table menu (keyboard navigation) keeps it open.
    if (!this.menuController?.contains(event.relatedTarget)) {
      this.menuController?.close();
    }
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
    return format === 'markdown' ? this.getMarkdownSupport().parse(content, this.schema) : parseHtml(content, this.schema);
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
    uploadImageFiles(this.view, files, this.options.image, this.view.state.selection.from, this.uploadLifecycle, this.messages);
  }

  private async editSelectedImageAlt() {
    if (this.readOnly || this.destroyed) return;
    const selection = this.view.state.selection;
    if (!(selection instanceof NodeSelection) || selection.node.type !== this.view.state.schema.nodes.image) {
      return;
    }

    const currentAlt = selection.node.attrs.alt ?? '';
    const ask = this.options.prompt ?? (async (message: string, value: string) => window.prompt(message, value));
    let nextAlt: string | null;
    try {
      nextAlt = await ask(this.messages.imageAltPrompt, currentAlt);
    } catch (error) {
      if (!this.destroyed) {
        if (this.options.onError) this.options.onError(error);
        else console.error('[oh-new-editor] Image alt prompt failed', error);
      }
      return;
    }
    if (nextAlt === null || this.destroyed || this.readOnly) {
      return;
    }

    // The prompt is async, so re-read the selection: it may have moved while the dialog was open.
    const current = this.view.state.selection;
    if (!(current instanceof NodeSelection) || current.from !== selection.from || current.node !== selection.node) {
      return;
    }

    this.view.dispatch(
      this.view.state.tr
        .setNodeMarkup(current.from, undefined, {
          ...current.node.attrs,
          alt: nextAlt.trim() || null
        })
        .scrollIntoView()
    );
  }

  private getToolbarContext(): Parameters<EditorToolbarSupport['createToolbar']>[1] {
    return {
      fontSizes: this.options.fontSizes,
      readOnly: this.readOnly,
      canUploadImages: Boolean(this.options.image?.upload),
      onPickImage: () => this.pickImage(),
      onEditImageAlt: () => this.editSelectedImageAlt(),
      onError: this.options.onError,
      insertActions: this.options.table?.insertActions,
      tableActions: this.options.table?.actions,
      tableLimits: this.options.table ? { maxRows: this.options.table.maxRows, maxCols: this.options.table.maxCols } : undefined,
      messages: this.messages
    };
  }

  private createView(doc = parseHtml(undefined, this.schema)) {
    return new EditorView(this.content, {
      state: this.createState(doc),
      editable: () => this.isEditable(),
      nodeViews: {
        image: (node, view, getPos) => {
          if (typeof getPos !== 'function') {
            throw new Error('Expected image node position accessor');
          }

          return createImageNodeView(view, this.messages, this.options.resolveImageSrc)(node, view, getPos);
        },
        ...(this.options.nodeViews ?? {})
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
          const clickedCell = target instanceof HTMLElement ? target.closest('td, th') : null;
          // Keyboard-initiated context menus (Shift+F10, Menu key) target the
          // editor itself; open the menu at the cursor when it sits in a cell.
          const fromKeyboard = !clickedCell && target === view.dom && isSelectionInTableCell(view.state);
          if (!clickedCell && !fromKeyboard) {
            this.menuController.close();
            return false;
          }

          let left = event.clientX;
          let top = event.clientY;
          if (fromKeyboard) {
            const coords = view.coordsAtPos(view.state.selection.from);
            left = coords.left;
            top = coords.bottom;
          } else {
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!coords) {
              return false;
            }

            // Keep an existing (cell) selection that already covers the clicked
            // position so "Merge cells" stays available; otherwise move the
            // cursor into the clicked cell.
            const { from, to } = view.state.selection;
            if (coords.pos < from || coords.pos > to) {
              view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(coords.pos))));
            }
          }

          event.preventDefault();
          const hostRect = this.host.getBoundingClientRect();
          this.menuController.open(left - hostRect.left, top - hostRect.top);
          return true;
        }
      },
      dispatchTransaction: (transaction) => {
        const nextState = this.view.state.apply(transaction);
        this.view.updateState(nextState);
        this.toolbar?.sync();
        this.menuController?.sync();
        if (transaction.docChanged && !this.replacingDocument) {
          this.emit('change');
        }
      }
    });
  }

  private isEditable() {
    return !this.readOnly && !this.ai?.isGenerating;
  }

  private getAIContext(): AIContext {
    const doc = this.view.state.doc;
    const { from, to } = this.view.state.selection;
    const outputFormat = this.outputFormat;

    let documentContent: string;
    if (outputFormat === 'markdown') {
      documentContent = this.getMarkdownSupport().serialize(doc);
    } else {
      documentContent = serializeHtml(doc, this.schema);
    }

    const selectedText = doc.textBetween(from, to);
    const textBefore = doc.textBetween(0, from, '\n');
    const textAfter = doc.textBetween(to, doc.content.size, '\n');
    const cursorOffset = from;

    return {
      documentContent,
      selectedText,
      textBefore,
      textAfter,
      cursorOffset,
      outputFormat
    };
  }

  private createAIController(aiOptions: EditorAIOptions): EditorAIController {
    let abortController: AbortController | null = null;
    let isGenerating = false;

    const controller: EditorAIController = {
      get isGenerating() {
        return isGenerating;
      },

      getContext: () => this.getAIContext(),

      generate: async (prompt?: string) => {
        if (!prompt || this.readOnly || this.destroyed) return;

        controller.cancel();
        isGenerating = true;
        const request = new AbortController();
        abortController = request;
        const signal = request.signal;

        // Lock editor as non-editable during active streaming
        this.view.setProps({ editable: () => false });

        const context = this.getAIContext();
        const cursorPos = this.view.state.selection.from;

        // Initialize AI streaming state in plugin
        this.view.dispatch(
          closeHistory(this.view.state.tr).setMeta(aiPluginKey, {
            active: true,
            startPos: cursorPos,
            currentPos: cursorPos,
            endPos: cursorPos
          })
        );

        try {
          if (aiOptions.onStream) {
            for await (const chunk of aiOptions.onStream(prompt, context, signal)) {
              if (signal.aborted) break;
              if (!chunk) continue;

              const aiState = aiPluginKey.getState(this.view.state);
              if (!aiState?.active) break;

              const pos = aiState.currentPos;
              const tr = this.view.state.tr.insertText(chunk, pos);
              let insertedFrom = pos;
              let insertedTo = pos;
              tr.mapping.maps[0]?.forEach((_from, _to, newFrom, newTo) => {
                insertedFrom = newFrom;
                insertedTo = newTo;
              });
              const firstChunk = aiState.endPos === aiState.startPos;
              tr.setMeta('addToHistory', false);
              tr.setMeta(aiPluginKey, {
                startPos: firstChunk ? insertedFrom : aiState.startPos,
                // Inserting at a block boundary may create a paragraph around the text.
                currentPos: TextSelection.near(tr.doc.resolve(insertedTo), -1).from,
                endPos: firstChunk ? insertedTo : tr.mapping.map(aiState.endPos, 1)
              });
              this.view.dispatch(tr);
            }
          } else {
            const result = await aiOptions.onGenerate(prompt, context, signal);
            if (!signal.aborted && result) {
              const tr = this.view.state.tr.insertText(result, cursorPos);
              this.view.dispatch(tr);
            }
          }
        } catch (err) {
          // On abort, let cancel() handle cleanup
          if (signal.aborted || (err as Error)?.name === 'AbortError') return;
          // On other errors, keep any text streamed so far and report it.
          if (aiOptions.onError) {
            aiOptions.onError(err);
          } else {
            console.error('[oh-new-editor] AI generation failed', err);
          }
        } finally {
          // A cancelled request may settle after a replacement request or document.
          if (abortController === request && !this.destroyed) {
            const currentState = aiPluginKey.getState(this.view.state);
            if (currentState?.active) {
              if (aiOptions.onStream && currentState.endPos > currentState.startPos) {
                // Stream previews bypass history. Reapply the completed range as one undoable edit.
                const { startPos, endPos } = currentState;
                const slice = this.view.state.doc.slice(startPos, endPos);
                const selection = this.view.state.selection.getBookmark();
                this.replacingDocument = true;
                try {
                  this.view.dispatch(this.view.state.tr.delete(startPos, endPos).setMeta('addToHistory', false));
                  const tr = closeHistory(this.view.state.tr.replace(startPos, startPos, slice));
                  tr.setSelection(selection.resolve(tr.doc));
                  this.view.dispatch(tr);
                } finally {
                  this.replacingDocument = false;
                }
              }
              this.view.dispatch(
                closeHistory(this.view.state.tr).setMeta(aiPluginKey, { active: false })
              );
            }

            abortController = null;
            isGenerating = false;
            this.view.setProps({ editable: () => this.isEditable() });
          }
        }
      },

      cancel: () => {
        if (!abortController) return;
        abortController.abort();

        const aiState = aiPluginKey.getState(this.view.state);
        if (aiState?.active) {
          const { startPos, endPos } = aiState;
          const tr = this.view.state.tr;
          if (endPos > startPos) {
            tr.delete(startPos, endPos);
          }
          tr.setMeta('addToHistory', false);
          tr.setMeta(aiPluginKey, { active: false });
          this.view.dispatch(tr);
        }

        abortController = null;
        isGenerating = false;
        this.view.setProps({ editable: () => this.isEditable() });
      }
    };

    return controller;
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
