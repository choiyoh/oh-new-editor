import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

import { DEFAULT_MESSAGES, formatMessage, type EditorMessages } from '../i18n';
import type { EditorImageOptions } from '../types';

const DEFAULT_MAX_IMAGE_SIZE = 10_000_000;
const DEFAULT_ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

type UploadStatus = 'uploading' | 'error';

type PlaceholderSpec = {
  id: string;
  fileName: string;
  message: string;
  status: UploadStatus;
  file?: File;
  retryable?: boolean;
};

type UploadPluginMeta =
  | ({ type: 'add'; pos: number } & PlaceholderSpec)
  | ({ type: 'update' } & PlaceholderSpec)
  | { type: 'remove'; id: string };

type NormalizedImageOptions = Required<Pick<EditorImageOptions, 'upload'>> & {
  maxSize: number;
  accept: string[];
  altText?: (file: File) => string;
};

export type UploadLifecycle = {
  isAlive: () => boolean;
};

const imageUploadPluginKey = new PluginKey<DecorationSet>('oh-editor-image-upload');

type PlaceholderActions = {
  onRetry?: () => void;
  onDismiss: () => void;
};

function createPlaceholderElement(spec: PlaceholderSpec, actions: PlaceholderActions, messages: EditorMessages) {
  const element = document.createElement('span');
  element.className = `oh-editor__upload-placeholder oh-editor__upload-placeholder--${spec.status}`;
  element.title = spec.fileName;
  element.setAttribute('role', spec.status === 'error' ? 'alert' : 'status');

  const message = document.createElement('span');
  message.className = 'oh-editor__upload-message';
  message.textContent = spec.message;
  element.append(message);

  const addButton = (className: string, label: string, onClick: () => void) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    element.append(button);
  };

  if (spec.status === 'error') {
    if (spec.retryable && actions.onRetry) {
      addButton('oh-editor__upload-retry', messages.uploadRetry, actions.onRetry);
    }
    addButton('oh-editor__upload-dismiss', messages.uploadDismiss, actions.onDismiss);
  }

  return element;
}

function getPlaceholderDecoration(set: DecorationSet, id: string) {
  return set.find(undefined, undefined, (spec) => spec.id === id)[0] ?? null;
}

function dispatchMeta(view: EditorView, meta: UploadPluginMeta) {
  view.dispatch(view.state.tr.setMeta(imageUploadPluginKey, meta));
}

function normalizeImageOptions(options?: EditorImageOptions): NormalizedImageOptions | null {
  if (!options?.upload) {
    return null;
  }

  return {
    upload: options.upload,
    maxSize: options.maxSize ?? DEFAULT_MAX_IMAGE_SIZE,
    accept: options.accept ?? DEFAULT_ACCEPTED_IMAGE_TYPES,
    altText: options.altText
  };
}

function validateImageFile(file: File, options: NormalizedImageOptions, messages: EditorMessages) {
  if (!options.accept.includes(file.type)) {
    return formatMessage(messages.uploadUnsupportedType, { type: file.type || file.name });
  }

  if (file.size > options.maxSize) {
    return formatMessage(messages.uploadTooLarge, { limit: Math.round(options.maxSize / 1_000_000), name: file.name });
  }

  return null;
}

function nextUploadId() {
  return `upload-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Runs the upload for the existing placeholder `id` and swaps the placeholder
 * for the image (or an error state) when it settles.
 */
function startUpload(view: EditorView, id: string, file: File, options: NormalizedImageOptions, lifecycle: UploadLifecycle, messages: EditorMessages) {
  let pending: Promise<string>;
  try {
    pending = options.upload(file);
  } catch (error) {
    pending = Promise.reject(error);
  }
  void pending
    .then((src) => {
      if (!lifecycle.isAlive()) return;
      const decorations = imageUploadPluginKey.getState(view.state);
      const placeholder = decorations ? getPlaceholderDecoration(decorations, id) : null;
      if (!placeholder) return;
      if (!view.editable) {
        dispatchMeta(view, { type: 'remove', id });
        return;
      }
      if (!src) throw new Error(messages.uploadEmptyUrl);

      const image = view.state.schema.nodes.image.create({ src, alt: options.altText ? options.altText(file) : file.name });
      const tr = view.state.tr
        .insert(placeholder.from, image)
        .setMeta(imageUploadPluginKey, { type: 'remove', id } satisfies UploadPluginMeta);
      view.dispatch(tr.scrollIntoView());
    })
    .catch((error: unknown) => {
      if (!lifecycle.isAlive()) return;
      const decorations = imageUploadPluginKey.getState(view.state);
      if (!decorations || !getPlaceholderDecoration(decorations, id)) return;
      if (!view.editable) {
        dispatchMeta(view, { type: 'remove', id });
        return;
      }
      dispatchMeta(view, {
        type: 'update',
        id,
        fileName: file.name,
        message: error instanceof Error && error.message
          ? formatMessage(messages.uploadFailedWithReason, { reason: error.message })
          : formatMessage(messages.uploadFailed, { name: file.name }),
        status: 'error',
        file,
        retryable: true
      });
    });
}

function uploadSingleImage(view: EditorView, file: File, options: NormalizedImageOptions, pos: number, lifecycle: UploadLifecycle, messages: EditorMessages) {
  const error = validateImageFile(file, options, messages);
  const id = nextUploadId();

  if (error) {
    dispatchMeta(view, { type: 'add', id, pos, fileName: file.name, message: error, status: 'error', file, retryable: false });
    return;
  }

  dispatchMeta(view, {
    type: 'add',
    id,
    pos,
    fileName: file.name,
    message: formatMessage(messages.uploadUploading, { name: file.name }),
    status: 'uploading',
    file,
    retryable: false
  });
  startUpload(view, id, file, options, lifecycle, messages);
}

export function uploadImageFiles(
  view: EditorView,
  files: Iterable<File>,
  options?: EditorImageOptions,
  pos = view.state.selection.from,
  lifecycle: UploadLifecycle = { isAlive: () => true },
  messages: EditorMessages = DEFAULT_MESSAGES
) {
  if (!view.editable) return;
  const normalized = normalizeImageOptions(options);
  if (!normalized) {
    throw new Error('Image upload requires options.image.upload(file).');
  }

  for (const file of Array.from(files)) {
    uploadSingleImage(view, file, normalized, pos, lifecycle, messages);
  }
}

function hasTextClipboardContent(data: DataTransfer | null) {
  if (!data) return false;
  return Boolean(data.getData('text/html').trim() || data.getData('text/plain').trim());
}

export function createImageUploadPlugin(options?: EditorImageOptions, messages: EditorMessages = DEFAULT_MESSAGES) {
  const normalized = normalizeImageOptions(options);
  let currentView: EditorView | null = null;
  let alive = true;
  const lifecycle: UploadLifecycle = {
    isAlive: () => alive && currentView !== null
  };

  const createWidget = (pos: number, spec: PlaceholderSpec) =>
    Decoration.widget(
      pos,
      () =>
        createPlaceholderElement(
          spec,
          {
            // Retry reuses the same placeholder, so a failed upload never
            // leaves a stale "Uploading…" chip behind.
            onRetry: normalized && spec.file && spec.retryable
              ? () => {
                  if (!currentView || !currentView.editable || !spec.file) return;
                  dispatchMeta(currentView, {
                    ...spec,
                    type: 'update',
                    message: formatMessage(messages.uploadUploading, { name: spec.fileName }),
                    status: 'uploading',
                    retryable: false
                  });
                  startUpload(currentView, spec.id, spec.file, normalized, lifecycle, messages);
                }
              : undefined,
            onDismiss: () => {
              if (currentView) dispatchMeta(currentView, { type: 'remove', id: spec.id });
            }
          },
          messages
        ),
      { ...spec }
    );

  return new Plugin<DecorationSet>({
    key: imageUploadPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        const next = set.map(tr.mapping, tr.doc);
        const meta = tr.getMeta(imageUploadPluginKey) as UploadPluginMeta | undefined;
        if (!meta) return next;

        const existing = getPlaceholderDecoration(next, meta.id);

        if (meta.type === 'remove') {
          return existing ? next.remove([existing]) : next;
        }

        if (meta.type === 'update') {
          if (!existing) return next;
          const { type: _type, ...spec } = meta;
          return next.remove([existing]).add(tr.doc, [createWidget(existing.from, spec)]);
        }

        const { type: _type, pos, ...spec } = meta;
        return next.add(tr.doc, [createWidget(pos, spec)]);
      }
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
      handleDOMEvents: normalized
        ? {
            drop(view, event) {
              const dataTransfer = event.dataTransfer;
              if (!dataTransfer?.files?.length) return false;

              const files = Array.from(dataTransfer.files).filter((file) => file.type.startsWith('image/'));
              if (!files.length) return false;

              event.preventDefault();
              if (!view.editable) return true;
              const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
              for (const file of files) {
                uploadSingleImage(view, file, normalized, coords?.pos ?? view.state.selection.from, lifecycle, messages);
              }
              return true;
            },
            paste(view, event) {
              if (!view.editable) return false;
              const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'));
              if (!files.length) return false;
              // Office apps put both markup and a rendered image of it on the
              // clipboard; keep the text and let the normal paste run.
              if (hasTextClipboardContent(event.clipboardData)) return false;

              event.preventDefault();
              for (const file of files) {
                uploadSingleImage(view, file, normalized, view.state.selection.from, lifecycle, messages);
              }
              return true;
            }
          }
        : undefined
    },
    view(view) {
      alive = true;
      currentView = view;
      return {
        destroy() {
          alive = false;
          currentView = null;
        }
      };
    }
  });
}

export { DEFAULT_ACCEPTED_IMAGE_TYPES, DEFAULT_MAX_IMAGE_SIZE, imageUploadPluginKey };
