import { tableNodes } from 'prosemirror-tables';

import { nodes as baseNodes } from './nodes';

export const tableEnabledNodes = (baseNodes as { append: <T>(value: T) => T }).append(
  tableNodes({
    tableGroup: 'block',
    cellContent: 'block+',
    cellAttributes: {
      background: {
        default: null,
        getFromDOM(domNode) {
          return domNode instanceof HTMLElement ? domNode.style.backgroundColor || null : null;
        },
        setDOMAttr(value, attrs) {
          if (value) {
            attrs.style = `${attrs.style ?? ''}background-color: ${value};`;
          }
        }
      }
    }
  })
);
