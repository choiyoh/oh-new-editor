import type { NodeSpec, SchemaSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';

const baseCodeBlock = basicSchema.spec.nodes.get('code_block');
const baseImage = basicSchema.spec.nodes.get('image');

if (!baseCodeBlock || !baseImage) {
  throw new Error('Expected basicSchema code_block and image nodes to exist');
}

const codeBlock: NodeSpec = {
  ...baseCodeBlock,
  attrs: {
    language: { default: null }
  },
  parseDOM: [
    {
      tag: 'pre',
      preserveWhitespace: 'full',
      getAttrs: (domNode) => {
        if (!(domNode instanceof HTMLElement)) return false;
        const codeNode = domNode.querySelector('code');
        return {
          language:
            codeNode?.getAttribute('data-language') ??
            domNode.getAttribute('data-language') ??
            null
        };
      }
    }
  ],
  toDOM(node) {
    const { language } = node.attrs;
    const codeAttrs = language ? { 'data-language': language } : {};
    const preAttrs = language ? { 'data-language': language } : {};
    return ['pre', preAttrs, ['code', codeAttrs, 0]];
  }
};

const image: NodeSpec = {
  ...baseImage,
  inline: false,
  group: 'block',
  draggable: true,
  attrs: {
    src: {},
    alt: { default: null },
    title: { default: null },
    width: { default: null },
    height: { default: null }
  },
  parseDOM: [
    {
      tag: 'img[src]',
      getAttrs: (domNode) => {
        if (!(domNode instanceof HTMLElement)) return false;
        return {
          src: domNode.getAttribute('src'),
          alt: domNode.getAttribute('alt'),
          title: domNode.getAttribute('title'),
          width: domNode.getAttribute('width'),
          height: domNode.getAttribute('height')
        };
      }
    }
  ],
  toDOM(node) {
    const { src, alt, title, width, height } = node.attrs;
    return [
      'img',
      {
        src,
        alt,
        title,
        width,
        height
      }
    ];
  }
};

export const nodes: SchemaSpec['nodes'] = addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block')
  .update('code_block', codeBlock)
  .update('image', image);
