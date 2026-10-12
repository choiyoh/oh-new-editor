/** Keep logical routes separate from the deployment directory. */
export function siteHref(href: string) {
  const base = import.meta.env.BASE_URL;
  if (href.startsWith('#')) return `${base}${href}`;
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (import.meta.env.VITE_ROUTE_MODE === 'hash') {
    if (href === '/') return base;
    if (href.startsWith('/#')) return `${base}${href.slice(1)}`;
    return `${base}#${href}`;
  }
  return `${base}${href.slice(1)}`;
}

export function sitePathname() {
  if (import.meta.env.VITE_ROUTE_MODE === 'hash') {
    const route = window.location.hash.slice(1);
    return route.startsWith('/') ? route.split(/[?#]/)[0] : '/';
  }
  const prefix = import.meta.env.BASE_URL.replace(/\/$/, '');
  const pathname = window.location.pathname;
  if (pathname === prefix) return '/';
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : '/';
}
