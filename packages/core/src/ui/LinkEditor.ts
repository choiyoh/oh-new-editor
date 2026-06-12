export class LinkEditor {
  readonly element = document.createElement('div');
  private readonly urlInput = document.createElement('input');
  private readonly confirmButton = document.createElement('button');
  private readonly cancelButton = document.createElement('button');
  private readonly removeButton = document.createElement('button');
  private cleanups: Array<() => void> = [];

  constructor() {
    this.element.className = 'oh-editor__link-editor';
    this.element.hidden = true;

    this.urlInput.type = 'url';
    this.urlInput.className = 'oh-editor__link-editor-input';
    this.urlInput.placeholder = 'https://...';
    this.urlInput.setAttribute('aria-label', 'Link URL');

    this.confirmButton.type = 'button';
    this.confirmButton.className = 'oh-editor__link-editor-button oh-editor__link-editor-button--confirm';
    this.confirmButton.textContent = 'Apply';
    this.confirmButton.setAttribute('aria-label', 'Apply link');

    this.cancelButton.type = 'button';
    this.cancelButton.className = 'oh-editor__link-editor-button oh-editor__link-editor-button--cancel';
    this.cancelButton.innerHTML =
      '<svg viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1.5 1.5 10.5 10.5M10.5 1.5 1.5 10.5" /></svg>';
    this.cancelButton.setAttribute('aria-label', 'Cancel');

    this.removeButton.type = 'button';
    this.removeButton.className = 'oh-editor__link-editor-button oh-editor__link-editor-button--remove';
    this.removeButton.textContent = 'Remove';
    this.removeButton.setAttribute('aria-label', 'Remove link');

    this.element.append(this.urlInput, this.confirmButton, this.cancelButton, this.removeButton);
  }

  open(options: {
    container: HTMLElement;
    coords: { left: number; top: number };
    anchorHref?: string;
    onConfirm: (href: string) => void;
    onRemove?: () => void;
    onClose: () => void;
  }) {
    this.close();

    this.urlInput.value = options.anchorHref ?? '';
    this.removeButton.hidden = !options.onRemove;

    const rect = options.container.getBoundingClientRect();
    const maxLeft = Math.max(0, rect.width - 300);
    const left = Math.min(Math.max(0, options.coords.left - rect.left), maxLeft);
    const top = options.coords.top - rect.top + 8;

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;

    this.element.hidden = false;
    options.container.append(this.element);

    this.urlInput.focus();
    if (options.anchorHref) {
      this.urlInput.select();
    }

    const onConfirm = (event: Event) => {
      event.preventDefault();
      options.onConfirm(this.urlInput.value.trim() || 'https://');
      this.close();
      options.onClose();
    };

    const onCancel = (event: Event) => {
      event.preventDefault();
      this.close();
      options.onClose();
    };

    const onRemove = (event: Event) => {
      event.preventDefault();
      options.onRemove?.();
      this.close();
      options.onClose();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        options.onClose();
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        options.onConfirm(this.urlInput.value.trim() || 'https://');
        this.close();
        options.onClose();
      }
    };

    this.confirmButton.addEventListener('mousedown', onConfirm);
    this.cancelButton.addEventListener('mousedown', onCancel);
    this.removeButton.addEventListener('mousedown', onRemove);
    this.urlInput.addEventListener('keydown', onKey);

    const onClickOutside = (event: MouseEvent) => {
      if (this.element.hidden) return;
      if (this.element.contains(event.target as Node)) return;
      // Ignore clicks on toolbar/bubble buttons so the link editor
      // stays open when interacting with other editor controls
      const target = event.target as HTMLElement;
      if (target.closest?.('.oh-editor__toolbar-group, .oh-editor__bubble-toolbar')) return;
      this.close();
      options.onClose();
    };

    // Defer with setTimeout so the current mousedown that triggered
    // open() finishes processing before we start listening
    setTimeout(() => {
      document.addEventListener('mousedown', onClickOutside, true);
      this.cleanups.push(() => {
        document.removeEventListener('mousedown', onClickOutside, true);
      });
    }, 0);

    this.cleanups.push(() => {
      this.confirmButton.removeEventListener('mousedown', onConfirm);
      this.cancelButton.removeEventListener('mousedown', onCancel);
      this.removeButton.removeEventListener('mousedown', onRemove);
      this.urlInput.removeEventListener('keydown', onKey);
    });
  }

  close() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
    this.cleanups = [];
    this.element.hidden = true;
    this.element.remove();
  }
}
