import { act, fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../src/i18n';
import { Docs } from '../src/pages/Docs';

let desktop: boolean;
let onMediaChange: (() => void) | undefined;

beforeEach(() => {
  desktop = false;
  onMediaChange = undefined;
  window.history.replaceState({}, '', '/docs');
  vi.stubGlobal('matchMedia', () => ({
    get matches() { return desktop; },
    addEventListener: (_type: string, callback: () => void) => { onMediaChange = callback; },
    removeEventListener: () => { onMediaChange = undefined; },
  }));
});

describe('docs navigation keyboard access', () => {
  it('preserves the chapter in shared section links and scrolls after reload', () => {
    vi.stubEnv('BASE_URL', '/oh-new-editor/');
    vi.stubEnv('VITE_ROUTE_MODE', 'hash');
    const scroll = vi.fn();
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scroll });
    try {
      window.history.replaceState({}, '', '/oh-new-editor/#/docs/overview#section-1');
      const { container, unmount } = render(<Docs />);
      expect(scroll).toHaveBeenCalled();
      const link = container.querySelector('a[href="/oh-new-editor/#/docs/overview#section-1"]') as HTMLAnchorElement;
      expect(link).not.toBeNull();
      container.addEventListener('click', (event) => {
        expect(event.defaultPrevented).toBe(false);
        event.preventDefault(); // jsdom cannot open the native new tab.
      }, { once: true });
      fireEvent.click(link, { ctrlKey: true });
      expect(window.location.hash).toBe('#/docs/overview#section-1');
      unmount();
    } finally {
      if (descriptor) Object.defineProperty(Element.prototype, 'scrollIntoView', descriptor);
      else Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

  it('makes the closed mobile sidebar inert and restores focus after Escape', () => {
    const { container } = render(<Docs />);
    const sidebar = container.querySelector('#docs-sidebar') as HTMLElement;
    const toggle = container.querySelector('[aria-controls="docs-sidebar"]') as HTMLButtonElement;
    expect(sidebar.hasAttribute('inert')).toBe(true);
    expect(sidebar.getAttribute('aria-hidden')).toBe('true');

    fireEvent.click(toggle);
    expect(sidebar.hasAttribute('inert')).toBe(false);
    const items = sidebar.querySelectorAll<HTMLElement>('button, a[href]');
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(items[0], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(items[items.length - 1]);
    fireEvent.keyDown(items[items.length - 1], { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(items[0], { key: 'Escape' });
    expect(sidebar.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(toggle);
  });

  it('keeps the desktop sidebar accessible when the viewport changes', () => {
    const { container } = render(<Docs />);
    const sidebar = container.querySelector('#docs-sidebar') as HTMLElement;
    act(() => {
      desktop = true;
      onMediaChange?.();
    });
    expect(sidebar.hasAttribute('inert')).toBe(false);
    expect(sidebar.hasAttribute('aria-hidden')).toBe(false);

    act(() => {
      desktop = false;
      onMediaChange?.();
    });
    expect(sidebar.hasAttribute('inert')).toBe(true);
  });
});
