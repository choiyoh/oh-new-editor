import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { EditorView, NodeView } from 'prosemirror-view';

const MIN_WIDTH = 50;

function toPx(value: string | number | null | undefined) {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(numeric) ? numeric : null;
}

export class ImageNodeView implements NodeView {
  readonly dom = document.createElement('div');
  readonly img = document.createElement('img');

  private readonly handle = document.createElement('button');
  private dragging = false;
  private dragCleanup: (() => void) | null = null;
  private dragAbortController: AbortController | null = null;

  constructor(
    private node: ProseMirrorNode,
    private readonly view: EditorView,
    private readonly getPos: (() => number | undefined)
  ) {
    this.dom.className = 'oh-editor__image-node';
    this.dom.contentEditable = 'false';

    this.img.className = 'oh-editor__image';
    this.img.draggable = false;
    this.dom.append(this.img);

    this.handle.type = 'button';
    this.handle.className = 'oh-editor__image-resize-handle';
    this.handle.title = 'Resize image';
    this.handle.setAttribute('aria-label', 'Resize image');
    this.handle.hidden = true;
    this.handle.addEventListener('mousedown', this.handleResizeStart);
    this.dom.append(this.handle);

    this.render(node);
  }

  update(node: ProseMirrorNode) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.render(node);
    return true;
  }

  selectNode() {
    this.dom.dataset.selected = 'true';
    this.handle.hidden = false;
  }

  deselectNode() {
    this.dom.dataset.selected = 'false';
    this.handle.hidden = true;
  }

  stopEvent(event: Event) {
    return this.dragging || event.target === this.handle;
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    this.handle.removeEventListener('mousedown', this.handleResizeStart);
    this.dragCleanup?.();
    this.dragAbortController?.abort();
  }

  private render(node: ProseMirrorNode) {
    const { src, alt, title, width, height } = node.attrs;
    this.img.src = src;
    this.img.alt = alt ?? '';
    this.img.title = title ?? '';
    this.img.style.width = width ? `${toPx(width)}px` : '';
    this.img.style.height = height ? `${toPx(height)}px` : '';
  }

  private readonly handleResizeStart = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = this.img.getBoundingClientRect();
    const naturalWidth = this.img.naturalWidth || rect.width || MIN_WIDTH;
    const naturalHeight = this.img.naturalHeight || rect.height || MIN_WIDTH;
    const startWidth = rect.width || naturalWidth;
    const startHeight = rect.height || naturalHeight;
    const ratio = naturalWidth / naturalHeight || 1;
    this.dragging = true;
    this.dragAbortController?.abort();
    this.dragAbortController = new AbortController();
    const { signal } = this.dragAbortController;

    const onMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - event.clientX;
      const deltaY = moveEvent.clientY - event.clientY;

      let nextWidth = Math.max(MIN_WIDTH, startWidth + deltaX);
      let nextHeight = Math.max(MIN_WIDTH, startHeight + deltaY);

      if (!moveEvent.shiftKey) {
        nextHeight = Math.max(MIN_WIDTH, nextWidth / ratio);
      }

      this.img.style.width = `${nextWidth}px`;
      this.img.style.height = `${nextHeight}px`;
    };

    const onUp = (upEvent: MouseEvent) => {
      const pos = this.getPos();
      this.dragging = false;
      this.dragCleanup?.();
      this.dragCleanup = null;
      this.dragAbortController = null;

      if (pos == null) return;

      const width = Math.max(MIN_WIDTH, this.img.getBoundingClientRect().width);
      const height = Math.max(MIN_WIDTH, this.img.getBoundingClientRect().height);

      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(pos, undefined, {
          ...this.node.attrs,
          width: `${Math.round(width)}`,
          height: upEvent.shiftKey ? `${Math.round(height)}` : `${Math.round(width / ratio)}`
        })
      );
    };

    const onWindowBlur = () => {
      this.dragging = false;
      this.dragCleanup?.();
      this.dragCleanup = null;
      this.dragAbortController = null;
    };

    window.addEventListener('mousemove', onMove, { signal });
    window.addEventListener('mouseup', onUp, { once: true, signal });
    window.addEventListener('blur', onWindowBlur, { once: true, signal });
    this.dragCleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('blur', onWindowBlur);
      this.dragAbortController?.abort();
    };
  };
}

export function createImageNodeView(view: EditorView) {
  return (node: ProseMirrorNode, _view: EditorView, getPos: boolean | (() => number | undefined)) => {
    if (typeof getPos !== 'function') {
      throw new Error('Expected image node position accessor');
    }

    return new ImageNodeView(node, view, getPos);
  };
}
