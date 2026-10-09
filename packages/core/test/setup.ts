import { afterEach } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
});

// jsdom has no layout engine; ProseMirror's coordsAtPos needs these to exist.
const emptyRect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON() {} } as DOMRect;
const emptyRectList = Object.assign([], { item: () => null }) as unknown as DOMRectList;
for (const proto of [Range.prototype, Text.prototype as unknown as Range]) {
  if (!('getClientRects' in proto)) {
    Object.defineProperty(proto, 'getClientRects', { configurable: true, value: () => emptyRectList });
  }
  if (!('getBoundingClientRect' in proto)) {
    Object.defineProperty(proto, 'getBoundingClientRect', { configurable: true, value: () => emptyRect });
  }
}
