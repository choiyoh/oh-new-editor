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
    replacement: (_content, node) => {
      const codeNode = node.querySelector('code');
      const language = codeNode?.getAttribute('data-language') ?? node.getAttribute('data-language') ?? '';
      const code = (codeNode?.textContent ?? node.textContent ?? '').replace(/\n+$/, '');
      return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
  });

  service.addRule('underlineFallback', {
    filter: 'u',
    replacement: (content) => `<u>${content}</u>`
  });

  service.addRule('fontSizeFallback', {
    filter: (node) => node.nodeName === 'SPAN' && node instanceof HTMLElement && Boolean(node.style.fontSize),
    replacement: (content, node) => {
      const size = node instanceof HTMLElement ? node.style.fontSize : '';
      return `<span style="font-size: ${size}">${content}</span>`;
    }
  });

  service.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: (content) => `~~${content}~~`
  });

  service.addRule('image', {
    filter: 'img',
    replacement: (_content, node) => {
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
    replacement: (_content, node) => {
      if (!(node instanceof HTMLTableElement)) {
        return `\n\n${node.outerHTML}\n\n`;
      }

      return serializeTable(node);
    }
  });

  return service;
}

export function serializeMarkdown(doc: EditorDocument) {
  const html = serializeHtml(doc);
  const container = window.document.createElement('div');
  container.innerHTML = html;

  return createTurndownService().turndown(container).trim();
}
