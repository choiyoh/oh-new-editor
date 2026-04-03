const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function isSafeHref(value: string | null | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value, 'https://oh-new-editor.local');
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}
