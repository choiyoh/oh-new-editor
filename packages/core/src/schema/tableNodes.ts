import type { SchemaSpec } from 'prosemirror-model';
import { tableNodes } from 'prosemirror-tables';

import { nodes as baseNodes } from './nodes';

export const tableEnabledNodes: SchemaSpec<any, any>['nodes'] = (baseNodes as { append: (value: SchemaSpec<any, any>['nodes']) => SchemaSpec<any, any>['nodes'] }).append(
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
