import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePathname } from '../src/hooks/usePathname';
import { siteHref, sitePathname } from '../src/lib/routing';
import { handleSiteLinkClick, navigate } from '../src/lib/utils';

beforeEach(() => {
  vi.stubEnv('BASE_URL', '/oh-new-editor/');
  vi.stubEnv('VITE_ROUTE_MODE', 'hash');
  vi.stubGlobal('scrollTo', vi.fn());
  window.history.replaceState({}, '', '/oh-new-editor/');
});

describe('GitHub Pages navigation', () => {
  it('keeps new-tab links and shared document URLs inside the project directory', () => {
    expect(siteHref('/')).toBe('/oh-new-editor/');
    expect(siteHref('/docs/table')).toBe('/oh-new-editor/#/docs/table');
    expect(siteHref('#demo')).toBe('/oh-new-editor/#demo');
    expect(siteHref('https://npmjs.com')).toBe('https://npmjs.com');

    window.history.replaceState({}, '', siteHref('/docs/table'));
    expect(sitePathname()).toBe('/docs/table');
  });

  it('updates the route for document navigation and browser history events', () => {
    function Location() { return <div>{usePathname()}</div>; }
    const { container } = render(<Location />);
    act(() => navigate('/docs/table'));
    expect(container.textContent).toBe('/docs/table');
    expect(window.location.pathname).toBe('/oh-new-editor/');
    expect(window.location.hash).toBe('#/docs/table');

    act(() => {
      window.history.replaceState({}, '', '/oh-new-editor/#/docs/markdown');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(container.textContent).toBe('/docs/markdown');
    act(() => {
      window.history.replaceState({}, '', '/oh-new-editor/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(container.textContent).toBe('/');
  });

  it('navigates from documents to the landing page demo without leaving the base path', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
    navigate('/docs/table');
    const event = { preventDefault: vi.fn() };
    handleSiteLinkClick(event, '#demo');
    expect(event.preventDefault).toHaveBeenCalled();
    expect(window.location.pathname).toBe('/oh-new-editor/');
    expect(window.location.hash).toBe('#demo');
    expect(sitePathname()).toBe('/');
  });

  it('preserves modified clicks for native new-tab navigation', () => {
    const event = { preventDefault: vi.fn(), ctrlKey: true };
    handleSiteLinkClick(event, '/docs');
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
  });

  it('supports history routes for local and other static deployments', () => {
    vi.stubEnv('VITE_ROUTE_MODE', 'history');
    expect(siteHref('/docs')).toBe('/oh-new-editor/docs');
    navigate('/docs');
    expect(sitePathname()).toBe('/docs');
    vi.stubEnv('BASE_URL', '/');
    window.history.replaceState({}, '', '/docs/table');
    expect(sitePathname()).toBe('/docs/table');
  });
});
