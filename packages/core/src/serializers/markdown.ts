import TurndownService from 'turndown';

import type { EditorDocument } from '../types';
import { serializeHtml } from './html';

function escapeTableCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\r?\n+/g, '<br>').trim();
}

function serializeTable(node: HTMLTableElement) {
  const cells = Array.from(node.querySelectorAll('th, td'));

  if (cells.some((cell) => Number(cell.getAttribute('colspan') ?? '1') > 1 || Number(cell.getAttribute('rowspan') ?? '1') > 1)) {
    return `\n\n${node.outerHTML}\n\n`;
  }

  const rows = Array.from(node.querySelectorAll('tr')).map((row) =>
    Array.from(row.querySelectorAll('th, td')).map((cell) => escapeTableCell(cell.textContent ?? ''))
  );

  if (rows.length === 0 || rows[0]?.length === 0) {
    return `\n\n${node.outerHTML}\n\n`;
  }

  const width = rows[0].length;

  if (rows.some((row) => row.length !== width)) {
    return `\n\n${node.outerHTML}\n\n`;
  }

  const [header, ...body] = rows;
  const separator = Array.from({ length: width }, () => '---');
  const lines = [header, separator, ...body].map((row) => `| ${row.join(' | ')} |`);

  return `\n\n${lines.join('\n')}\n\n`;
}

function createTurndownService() {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    fence: '```',
    bulletListMarker: '-',
    hr: '---',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined'
  });

  service.addRule('codeBlockWithLanguage', {
    filter: 'pre',
    replacement: (_content: string, node: HTMLElement) => {
      const codeNode = node.querySelector('code');
      const language = codeNode?.getAttribute('data-language') ?? node.getAttribute('data-language') ?? '';
      const code = (codeNode?.textContent ?? node.textContent ?? '').replace(/\n+$/, '');
      return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
  });

  // Turndown's default list item rule pads markers to four columns and leaves
  // whitespace-only lines, which turns every list into a "loose" list.
  service.addRule('listItem', {
    filter: 'li',
    replacement: (content: string, node: HTMLElement, options: { bulletListMarker?: string }) => {
      const parent = node.parentNode as HTMLElement | null;
      let prefix = `${options.bulletListMarker ?? '-'} `;
      if (parent?.nodeName === 'OL') {
        const start = Number(parent.getAttribute('start') ?? '1');
        prefix = `${start + Array.prototype.indexOf.call(parent.children, node)}. `;
      }
      const indent = ' '.repeat(prefix.length);
      const body = content
        .replace(/^\n+/, '')
        .replace(/\n+$/, '')
        .replace(/\n/g, `\n${indent}`)
        .replace(/\n[ ]+(?=\n)/g, '\n');
      return prefix + body + (node.nextSibling ? '\n' : '');
    }
  });

  service.addRule('underlineFallback', {
    filter: 'u',
    replacement: (content: string) => `<u>${content}</u>`
  });

  service.addRule('fontSizeFallback', {
    filter: (node: HTMLElement) => node.nodeName === 'SPAN' && node instanceof HTMLElement && Boolean(node.style.fontSize),
    replacement: (content: string, node: HTMLElement) => {
      const size = node instanceof HTMLElement ? node.style.fontSize : '';
      return `<span style="font-size: ${size}">${content}</span>`;
    }
  });

  service.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: (content: string) => `~~${content}~~`
  });

  service.addRule('image', {
    filter: 'img',
    replacement: (_content: string, node: HTMLElement) => {
      const src = node.getAttribute('src');
      if (!src) return '';

      const alt = (node.getAttribute('alt') ?? '').replace(/\]/g, '\\]');
      const title = node.getAttribute('title');
      const titleSuffix = title ? ` \"${title.replace(/\"/g, '\\\"')}\"` : '';
      return `![${alt}](${src}${titleSuffix})`;
    }
  });

  service.addRule('table', {
    filter: 'table',
    replacement: (_content: string, node: HTMLElement) => {
      if (!(node instanceof HTMLTableElement)) {
        return `\n\n${node.outerHTML}\n\n`;
      }

      return serializeTable(node);
    }
  });

  return service;
}

export function serializeMarkdown(doc: EditorDocument) {
  // Use the document's own schema so table (or custom) nodes serialize.
  const html = serializeHtml(doc, doc.type.schema);
  const container = window.document.createElement('div');
  container.innerHTML = html;

  return createTurndownService().turndown(container).trim();
}
