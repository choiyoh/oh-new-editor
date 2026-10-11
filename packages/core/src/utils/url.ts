const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;
const HOST_PATTERN = /^(?:localhost|[^\s/?#.]+(?:\.[^\s/?#.]+)+)(?::\d+)?(?:[/?#]|$)/i;

export function isSafeHref(value: string | null | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value, 'https://oh-new-editor.local');
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Turns what a person types into a link field into a safe absolute href.
 *
 * `example.com/docs` becomes `https://example.com/docs`, a bare e-mail address
 * becomes a `mailto:` link, and explicit relative paths (`/`, `#`, `?`) are
 * kept. Returns `null` when the value is empty, malformed or uses a protocol
 * outside the allowlist.
 */
export function normalizeHref(input: string | null | undefined): string | null {
  const value = input?.trim();
  if (!value) return null;

  let href: string;
  const scheme = SCHEME_PATTERN.exec(value)?.[0].toLowerCase();
  // `localhost:3000` looks like a scheme but is a host with a port.
  const isScheme = Boolean(scheme) && (ALLOWED_LINK_PROTOCOLS.has(scheme!) || !/^\d/.test(value.slice(scheme!.length)));
  if (isScheme) {
    href = value;
  } else if (value.startsWith('//')) {
    href = `https:${value}`;
  } else if (/^[/#?]/.test(value)) {
    return isSafeHref(value) ? value : null;
  } else if (EMAIL_PATTERN.test(value)) {
    href = `mailto:${value}`;
  } else if (HOST_PATTERN.test(value)) {
    href = `https://${value}`;
  } else {
    return null;
  }

  try {
    const url = new URL(href);
    if (!ALLOWED_LINK_PROTOCOLS.has(url.protocol)) return null;
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname) return null;
    return href;
  } catch {
    return null;
  }
}
