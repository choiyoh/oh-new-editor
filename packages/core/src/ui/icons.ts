function icon(parts: string | string[], viewBox = '0 0 24 24', fill?: string) {
  const content = (Array.isArray(parts) ? parts : [parts])
    .map((part) => {
      if (part.trim().startsWith('<')) return part;
      const fillAttr = fill ? ` fill="${fill}"` : '';
      return `<path d="${part}"${fillAttr} />`;
    })
    .join('');

  return `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}

export const toolbarIcons = {
  bold: icon([
    'M7 5.5h6a3.5 3.5 0 0 1 0 7H7z',
    'M7 12.5h7a3.75 3.75 0 0 1 0 7.5H7z'
  ]),
  italic: icon(['M14.5 4.5 10 19.5', 'M8 4.5h9', 'M7 19.5h9']),
  underline: icon(['M8 4.5v7a4 4 0 0 0 8 0v-7', 'M5.5 19.5h13']),
  strike: icon(['M5 12h14', 'M8 6.5a4 4 0 0 1 8 0', 'M16 17.5a4 4 0 0 1-8 0']),
  inlineCode: icon(['M9 18 4 12l5-6', 'M15 6l5 6-5 6']),
  link: icon([
    'M10 13.5 14 9.5',
    'M8.5 15a4 4 0 0 1 0-5.5l2-2a4 4 0 0 1 5.5 5.5l-.5.5',
    'M15.5 9a4 4 0 0 1 0 5.5l-2 2A4 4 0 0 1 8 11l.5-.5'
  ]),
  quote: icon([
    '<path d="M7 10h3V6H6v4.5A4.5 4.5 0 0 1 4.5 14" />',
    '<path d="M17 10h3V6h-4v4.5a4.5 4.5 0 0 1-1.5 3.5" />'
  ]),
  paragraph: icon(['M7 6.5h8', 'M7 11h8', 'M7 15.5h5', 'M5 6.5v13']),
  heading1: icon(['M5 6v12', 'M11 6v12', 'M5 12h6', 'M17 8v10', 'M15.5 18H19']),
  heading2: icon(['M5 6v12', 'M11 6v12', 'M5 12h6', 'M15.5 11.5c.2-1.8 1.3-3 3-3 1.5 0 2.5.9 2.5 2.2 0 1-.5 1.7-1.7 2.6l-1.7 1.3c-.7.5-1.2 1-1.5 1.9H21']),
  heading3: icon([
    'M5 6v12',
    'M11 6v12',
    'M5 12h6',
    'M16 9c.4-1.2 1.4-2 2.7-2 1.4 0 2.3.8 2.3 2s-.8 1.8-2 2c1.3.2 2.2 1.1 2.2 2.2 0 1.4-1.2 2.4-2.8 2.4a3.2 3.2 0 0 1-3.2-2.4'
  ]),
  bulletList: icon([
    '<circle cx="6" cy="7" r="1.25" />',
    '<circle cx="6" cy="12" r="1.25" />',
    '<circle cx="6" cy="17" r="1.25" />',
    'M10 7h10',
    'M10 12h10',
    'M10 17h10'
  ]),
  orderedList: icon([
    'M4.5 7.5h2',
    'M4.5 10V5.5h1.5',
    'M4 17.5l1.5-1c.5-.4.5-.8 0-1.2-.4-.3-1-.2-1.3.2',
    'M11 7h9',
    'M11 12h9',
    'M11 17h9'
  ]),
  codeBlock: icon(['M8 8 4 12l4 4', 'M16 8l4 4-4 4', 'M13 5 11 19']),
  horizontalRule: icon('M4 12h16'),
  divider: icon([
    'M4 12h4.5',
    'M15.5 12H20',
    '<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />'
  ]),
  undo: icon(['M9 9 5 12l4 3', 'M5 12h9a5 5 0 1 1 0 10h-1']),
  redo: icon(['M15 9l4 3-4 3', 'M19 12h-9a5 5 0 1 0 0 10h1'], '0 0 24 24'),
  image: icon([
    '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />',
    '<circle cx="8.5" cy="9.5" r="1.25" />',
    'M5.5 15.5 9 12l3 3 2.5-2.5 3 3'
  ]),
  alt: icon([
    'M4.5 19 9.5 5h1L15.5 19',
    'M6.5 14h7',
    'M18.5 8.5v10',
    'M16 11h5'
  ]),
  table: icon([
    '<rect x="3.5" y="5.5" width="17" height="13" rx="2" />',
    'M3.5 10.5h17',
    'M9.5 5.5v13',
    'M15 5.5v13'
  ]),
  addRow: icon([
    '<rect x="3.5" y="5.5" width="11" height="9" rx="1.5" />',
    'M3.5 9.5h11',
    'M18 13.5v5',
    'M15.5 16h5'
  ]),
  addColumn: icon([
    '<rect x="3.5" y="5.5" width="9" height="13" rx="1.5" />',
    'M8 5.5v13',
    'M17.5 10.5v7',
    'M14 14h7'
  ]),
  removeRow: icon([
    '<rect x="3.5" y="5.5" width="11" height="9" rx="1.5" />',
    'M3.5 9.5h11',
    'M15.5 16h5'
  ]),
  removeColumn: icon([
    '<rect x="3.5" y="5.5" width="9" height="13" rx="1.5" />',
    'M8 5.5v13',
    'M14 14h7'
  ]),
  merge: icon([
    '<rect x="4" y="6" width="4" height="4" rx=".75" />',
    '<rect x="4" y="14" width="4" height="4" rx=".75" />',
    '<rect x="16" y="6" width="4" height="4" rx=".75" />',
    '<rect x="16" y="14" width="4" height="4" rx=".75" />',
    'M9.5 12h5',
    'm12 9.5 2.5 2.5-2.5 2.5'
  ]),
  split: icon([
    '<rect x="4" y="6" width="6" height="12" rx="1" />',
    '<rect x="14" y="6" width="6" height="12" rx="1" />',
    'M10.5 12h3',
    'm12 11 2.5 1-2.5 1',
    'm13.5 11-2.5 1 2.5 1'
  ])
};
