const KEYWORDS = new Set([
  'const', 'let', 'var', 'import', 'export', 'from', 'default', 'function', 'interface', 'class', 'return',
  'type', 'as', 'await', 'async', 'new', 'if', 'else', 'throw', 'try', 'catch', 'readonly', 'extends'
]);

const TYPES = new Set([
  'string', 'boolean', 'void', 'number', 'HTMLElement', 'Editor', 'EditorOptions', 'EditorMarkdownSupport',
  'EditorTableSupport', 'EditorToolbarSupport', 'EditorAIOptions', 'EditorAIController', 'File', 'Promise',
  'Schema', 'Plugin', 'OhNewEditorRef'
]);

const APIS = new Set([
  'createEditor', 'createMarkdownSupport', 'createTableSupport', 'createToolbarSupport', 'createNotionSupport',
  'createEditorSchema', 'getContent', 'setContent', 'setOutputFormat', 'setReadOnly', 'setStyle', 'getStyle', 'on',
  'off', 'destroy', 'focus', 'blur', 'insertTable', 'setHeading', 'toggleBold', 'toggleItalic', 'toggleUnderline',
  'toggleStrike', 'toggleCode', 'insertCodeBlock', 'toggleBlockquote', 'toggleBulletList', 'toggleOrderedList',
  'insertHR', 'insertParagraph', 'toggleLink', 'setLink', 'removeLink', 'insertImage', 'liftCurrentListItem',
  'sinkCurrentListItem', 'sanitizeHtml', 'isSafeHref', 'normalizeHref', 'OhNewEditor', 'uploadImageFiles',
  'generate', 'cancel', 'getContext'
]);

const CLASSES = {
  comment: 'text-zinc-400 dark:text-zinc-500',
  string: 'text-rose-600 dark:text-amber-400',
  keyword: 'text-brand-600 dark:text-brand-400 font-semibold',
  type: 'text-indigo-600 dark:text-indigo-300',
  api: 'text-emerald-600 dark:text-emerald-400 font-medium'
} as const;

// One pass over the source: comments, then strings, then identifiers. Matching
// them together keeps e.g. `//` inside a URL string from being read as a
// comment, and never runs a pattern over HTML we already generated.
const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|([A-Za-z_$][\w$]*)/g;

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(kind: keyof typeof CLASSES, value: string) {
  return `<span class="${CLASSES[kind]}">${escapeHtml(value)}</span>`;
}

/** Returns escaped HTML with lightweight syntax colouring for the docs snippets. */
export function highlightCode(code: string) {
  let html = '';
  let last = 0;

  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    html += escapeHtml(code.slice(last, index));
    last = index + match[0].length;

    const [token, comment, string, word] = match;
    if (comment) html += wrap('comment', comment);
    else if (string) html += wrap('string', string);
    else if (word && KEYWORDS.has(word)) html += wrap('keyword', word);
    else if (word && TYPES.has(word)) html += wrap('type', word);
    else if (word && APIS.has(word)) html += wrap('api', word);
    else html += escapeHtml(token);
  }

  return html + escapeHtml(code.slice(last));
}
