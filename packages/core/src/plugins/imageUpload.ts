import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

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
  | { type: 'add'; id: string; pos: number; fileName: string; message: string; status: UploadStatus; file?: File; retryable?: boolean }
  | { type: 'update'; id: string; fileName: string; message: string; status: UploadStatus; file?: File; retryable?: boolean }
  | { type: 'remove'; id: string };

type NormalizedImageOptions = Required<Pick<EditorImageOptions, 'upload'>> & {
  maxSize: number;
  accept: string[];
};

export type UploadLifecycle = {
  isAlive: () => boolean;
};

const imageUploadPluginKey = new PluginKey<DecorationSet>('oh-editor-image-upload');

function createPlaceholderElement(spec: PlaceholderSpec, onRetry?: () => void) {
  const element = document.createElement('span');
  element.className = `oh-editor__upload-placeholder oh-editor__upload-placeholder--${spec.status}`;
  element.title = spec.fileName;
  element.setAttribute('aria-label', spec.message);

  const message = document.createElement('span');
  message.className = 'oh-editor__upload-message';
  message.textContent = spec.message;
  element.append(message);

  if (spec.status === 'error' && spec.retryable && onRetry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'oh-editor__upload-retry';
    button.textContent = 'Retry';
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onRetry();
    });
    element.append(button);
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
    accept: options.accept ?? DEFAULT_ACCEPTED_IMAGE_TYPES
  };
}

function validateImageFile(file: File, options: NormalizedImageOptions) {
  if (!options.accept.includes(file.type)) {
    return `Unsupported image type: ${file.type || file.name}`;
  }

  if (file.size > options.maxSize) {
    return `Image exceeds ${Math.round(options.maxSize / 1_000_000)} MB limit: ${file.name}`;
  }

  return null;
}

function nextUploadId() {
  return `upload-${Math.random().toString(36).slice(2, 10)}`;
}

function uploadSingleImage(view: EditorView, file: File, options: NormalizedImageOptions, pos: number, lifecycle: UploadLifecycle) {
  const error = validateImageFile(file, options);
  const id = nextUploadId();

  if (error) {
    dispatchMeta(view, {
      type: 'add',
      id,
      pos,
      fileName: file.name,
      message: error,
      status: 'error',
      file,
      retryable: false
    });
    return;
  }

  dispatchMeta(view, {
    type: 'add',
    id,
    pos,
    fileName: file.name,
    message: `Uploading ${file.name}…`,
    status: 'uploading',
    file,
    retryable: false
  });

  void options.upload(file)
    .then((src) => {
      if (!lifecycle.isAlive()) return;
      const decorations = imageUploadPluginKey.getState(view.state);
      const placeholder = decorations ? getPlaceholderDecoration(decorations, id) : null;
      if (!placeholder || !src) return;

      const tr = view.state.tr
        .insert(placeholder.from, view.state.schema.nodes.image.create({ src, alt: file.name }))
        .setMeta(imageUploadPluginKey, { type: 'remove', id } satisfies UploadPluginMeta);

      view.dispatch(tr.scrollIntoView());
    })
    .catch((error_: unknown) => {
      if (!lifecycle.isAlive()) return;
      dispatchMeta(view, {
        type: 'update',
        id,
        fileName: file.name,
        message: error_ instanceof Error ? `Upload failed: ${error_.message}` : `Upload failed: ${file.name}`,
        status: 'error',
        file,
        retryable: true
      });
    });
}

export function uploadImageFiles(view: EditorView, files: Iterable<File>, options?: EditorImageOptions, pos = view.state.selection.from, lifecycle: UploadLifecycle = { isAlive: () => true }) {
  const normalized = normalizeImageOptions(options);
  if (!normalized) {
    throw new Error('Image upload requires options.image.upload(file).');
  }

  const fileList = Array.from(files);
  for (const file of fileList) {
    uploadSingleImage(view, file, normalized, pos, lifecycle);
  }
}

export function createImageUploadPlugin(options?: EditorImageOptions) {
  const normalized = normalizeImageOptions(options);
  let currentView: EditorView | null = null;
  let alive = true;
  const lifecycle: UploadLifecycle = {
    isAlive: () => alive && currentView !== null
  };

  const createRetryHandler = (spec: PlaceholderSpec, pos: number) => {
    if (!normalized || !spec.file || !spec.retryable || !currentView) {
      return undefined;
    }

    return () => {
      if (!currentView || !spec.file) return;
      dispatchMeta(currentView, {
        type: 'update',
        id: spec.id,
        fileName: spec.fileName,
        message: `Uploading ${spec.fileName}…`,
        status: 'uploading',
        file: spec.file,
        retryable: false
      });
      uploadSingleImage(currentView, spec.file, normalized, pos, lifecycle);
    };
  };

  return new Plugin<DecorationSet>({
    key: imageUploadPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        let next = set.map(tr.mapping, tr.doc);
        const meta = tr.getMeta(imageUploadPluginKey) as UploadPluginMeta | undefined;
        if (!meta) return next;

        if (meta.type === 'remove') {
          const decoration = getPlaceholderDecoration(next, meta.id);
          return decoration ? next.remove([decoration]) : next;
        }

        if (meta.type === 'update') {
          const decoration = getPlaceholderDecoration(next, meta.id);
          if (!decoration) return next;
          next = next.remove([decoration]);
          return next.add(tr.doc, [
            Decoration.widget(decoration.from, () =>
              createPlaceholderElement({
                id: meta.id,
                fileName: meta.fileName,
                message: meta.message,
                status: meta.status,
                file: meta.file,
                retryable: meta.retryable
              }, createRetryHandler({
                id: meta.id,
                fileName: meta.fileName,
                message: meta.message,
                status: meta.status,
                file: meta.file,
                retryable: meta.retryable
              }, decoration.from)) , {
              id: meta.id,
              fileName: meta.fileName,
              message: meta.message,
              status: meta.status,
              file: meta.file,
              retryable: meta.retryable
            })
          ]);
        }

        return next.add(tr.doc, [
          Decoration.widget(meta.pos, () =>
            createPlaceholderElement({
              id: meta.id,
              fileName: meta.fileName,
              message: meta.message,
              status: meta.status,
              file: meta.file,
              retryable: meta.retryable
            }, createRetryHandler({
              id: meta.id,
              fileName: meta.fileName,
              message: meta.message,
              status: meta.status,
              file: meta.file,
              retryable: meta.retryable
            }, meta.pos)), {
            id: meta.id,
            fileName: meta.fileName,
            message: meta.message,
            status: meta.status,
            file: meta.file,
            retryable: meta.retryable
          })
        ]);
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
              const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
              for (const file of files) {
                uploadSingleImage(view, file, normalized, coords?.pos ?? view.state.selection.from, lifecycle);
              }
              return true;
            },
            paste(view, event) {
              const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'));
              if (!files.length) return false;

              event.preventDefault();
              for (const file of files) {
                uploadSingleImage(view, file, normalized, view.state.selection.from, lifecycle);
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
