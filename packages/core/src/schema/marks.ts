import type { MarkSpec, SchemaSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';

import { isSafeHref } from '../utils/url';

const underline: MarkSpec = {
  parseDOM: [
    { tag: 'u' },
    {
      style: 'text-decoration',
      getAttrs: (value) => (typeof value === 'string' && value.includes('underline') ? {} : false)
    }
  ],
  toDOM() {
    return ['u', 0];
  }
};

const strike: MarkSpec = {
  parseDOM: [
    { tag: 's' },
    { tag: 'del' },
    {
      style: 'text-decoration',
      getAttrs: (value) => (typeof value === 'string' && value.includes('line-through') ? {} : false)
    }
  ],
  toDOM() {
    return ['s', 0];
  }
};

const fontSize: MarkSpec = {
  attrs: {
    size: {}
  },
  parseDOM: [
    {
      style: 'font-size',
      getAttrs: (value) => {
        if (typeof value !== 'string') return false;
        const numericValue = Number.parseInt(value, 10);
        return Number.isFinite(numericValue) ? { size: numericValue } : false;
      }
    }
  ],
  toDOM(mark) {
    return ['span', { style: `font-size: ${mark.attrs.size}px` }, 0];
  }
};

const baseLink = basicSchema.spec.marks.get('link');

if (!baseLink) {
  throw new Error('Expected basicSchema link mark to exist');
}

const safeLink: MarkSpec = {
  ...baseLink,
  attrs: {
    href: {},
    title: { default: null }
  },
  inclusive: false,
  parseDOM: [
    {
      tag: 'a[href]',
      getAttrs: (domNode) => {
        if (!(domNode instanceof HTMLElement)) return false;
        const href = domNode.getAttribute('href');
        if (!isSafeHref(href)) return false;
        return {
          href,
          title: domNode.getAttribute('title')
        };
      }
    }
  ],
  toDOM(mark) {
    const { href, title } = mark.attrs;
    if (!isSafeHref(href)) {
      return ['span', 0];
    }

    return ['a', { href, title }, 0];
  }
};

export const marks: SchemaSpec['marks'] = basicSchema.spec.marks
  .update('link', safeLink)
  .addToEnd('underline', underline)
  .addToEnd('strike', strike)
  .addToEnd('font_size', fontSize);
