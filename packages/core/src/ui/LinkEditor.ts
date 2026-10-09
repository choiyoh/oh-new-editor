import type { EditorMessages } from '../i18n';
import { onPress } from './dom';

export type LinkEditorOptions = {
  container: HTMLElement;
  coords: { left: number; top: number };
  anchorHref?: string;
  /** Return `false` to keep the editor open and flag the value as invalid. */
  onConfirm: (value: string) => boolean;
  onRemove?: () => void;
  onClose: () => void;
};

export class LinkEditor {
  readonly element = document.createElement('div');
  private readonly urlInput = document.createElement('input');
  private readonly confirmButton = document.createElement('button');
  private readonly cancelButton = document.createElement('button');
  private readonly removeButton = document.createElement('button');
  private readonly error = document.createElement('div');
  private cleanups: Array<() => void> = [];

  constructor() {
    const errorId = `oh-editor-link-error-${Math.random().toString(36).slice(2, 9)}`;

    this.element.className = 'oh-editor__link-editor';
    this.element.hidden = true;
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-label', 'Edit link');

    this.urlInput.type = 'text';
    this.urlInput.inputMode = 'url';
    this.urlInput.autocomplete = 'off';
    this.urlInput.spellcheck = false;
    this.urlInput.className = 'oh-editor__link-editor-input';
    this.urlInput.placeholder = 'example.com';
    this.urlInput.setAttribute('aria-label', 'Link URL');
    this.urlInput.setAttribute('aria-describedby', errorId);

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

    this.error.id = errorId;
    this.error.className = 'oh-editor__link-editor-error';
    this.error.setAttribute('role', 'alert');
    this.error.hidden = true;

    this.element.append(this.urlInput, this.confirmButton, this.cancelButton, this.removeButton, this.error);
  }

  get isOpen() {
    return !this.element.hidden;
  }

  setLabels(messages: EditorMessages) {
    this.confirmButton.textContent = messages.linkApply;
    this.confirmButton.setAttribute('aria-label', messages.linkApply);
    this.cancelButton.setAttribute('aria-label', messages.linkCancel);
    this.removeButton.textContent = messages.linkRemove;
    this.removeButton.setAttribute('aria-label', messages.linkRemove);
    this.urlInput.placeholder = messages.linkPlaceholder;
    this.urlInput.setAttribute('aria-label', messages.linkUrl);
    this.element.setAttribute('aria-label', messages.linkDialog);
    this.error.dataset.message = messages.linkInvalid;
  }

  open(options: LinkEditorOptions) {
    this.close();

    this.urlInput.value = options.anchorHref ?? '';
    this.removeButton.hidden = !options.onRemove;
    this.setInvalid(false);

    const rect = options.container.getBoundingClientRect();
    const maxLeft = Math.max(0, rect.width - 320);
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

    const finish = () => {
      this.close();
      options.onClose();
    };

    const confirm = () => {
      if (options.onConfirm(this.urlInput.value)) {
        finish();
      } else {
        this.setInvalid(true);
        this.urlInput.focus();
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        finish();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        confirm();
      }
    };

    const onInput = () => this.setInvalid(false);

    const onClickOutside = (event: MouseEvent) => {
      if (this.element.hidden) return;
      if (this.element.contains(event.target as Node)) return;
      // Ignore clicks on toolbar/bubble buttons so the link editor
      // stays open when interacting with other editor controls
      const target = event.target as HTMLElement;
      if (target.closest?.('.oh-editor__toolbar-group, .oh-editor__bubble-toolbar')) return;
      finish();
    };

    this.cleanups.push(
      onPress(this.confirmButton, confirm),
      onPress(this.cancelButton, finish),
      onPress(this.removeButton, () => {
        options.onRemove?.();
        finish();
      })
    );
    this.element.addEventListener('keydown', onKey);
    this.urlInput.addEventListener('input', onInput);

    // Defer with setTimeout so the current mousedown that triggered
    // open() finishes processing before we start listening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', onClickOutside, true);
    }, 0);

    this.cleanups.push(() => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onClickOutside, true);
      this.element.removeEventListener('keydown', onKey);
      this.urlInput.removeEventListener('input', onInput);
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

  private setInvalid(invalid: boolean) {
    this.urlInput.setAttribute('aria-invalid', String(invalid));
    this.error.hidden = !invalid;
    this.error.textContent = invalid ? this.error.dataset.message ?? 'Enter a valid URL, e.g. example.com' : '';
  }
}
