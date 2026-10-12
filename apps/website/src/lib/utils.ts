import { siteHref, sitePathname } from './routing';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function navigate(to: string) {
  window.history.pushState({}, '', siteHref(to));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Click handler for in-site links: client-side routes for `/paths`, and
 * `#section` links that also work from other pages (e.g. the docs).
 */
export function handleSiteLinkClick(event: { preventDefault(): void; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; button?: number }, href: string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button !== undefined && event.button !== 0)) return;

  if (href.startsWith('/')) {
    event.preventDefault();
    navigate(href);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    return;
  }

  if (href.startsWith('#') && sitePathname() !== '/') {
    event.preventDefault();
    navigate(`/${href}`);
    // Wait for the landing page to render before scrolling to the section.
    requestAnimationFrame(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  }
}
