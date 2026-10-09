/**
 * User-facing strings of the built-in UI (toolbar, Notion-style UI, menus,
 * image upload). Pass a partial override as `options.messages`, or one of the
 * bundled presets (`messagesKo`, `messagesZhCN`).
 *
 * `{name}`-style placeholders are filled by `formatMessage`.
 */
export interface EditorMessages {
  toolbarLabel: string;
  undo: string;
  redo: string;
  blockType: string;
  paragraph: string;
  heading: string; // "Heading {level}"
  codeBlock: string;
  fontSize: string;
  codeLanguage: string;
  codeLanguagePlaceholder: string;
  bold: string;
  italic: string;
  underline: string;
  strikethrough: string;
  inlineCode: string;
  link: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  horizontalRule: string;
  insertImage: string;
  editImageAlt: string;
  imageAltPrompt: string;
  more: string;
  moreActions: string;

  linkDialog: string;
  linkUrl: string;
  linkPlaceholder: string;
  linkApply: string;
  linkCancel: string;
  linkRemove: string;
  linkInvalid: string;

  insertTable: string;
  tablePickerLabel: string;
  tablePickerHint: string;
  tableMenu: string;
  addRowAbove: string;
  addRowBelow: string;
  addColumnLeft: string;
  addColumnRight: string;
  deleteRow: string;
  deleteColumn: string;
  mergeCells: string;
  splitCell: string;

  slashMenu: string;
  slashCategoryBasic: string;
  slashCategoryMedia: string;
  slashCategoryAdvanced: string;
  slashText: string;
  slashTextDescription: string;
  slashHeading1Description: string;
  slashHeading2Description: string;
  slashHeading3Description: string;
  slashBulletListDescription: string;
  slashOrderedListDescription: string;
  slashBlockquoteDescription: string;
  slashCodeBlockDescription: string;
  slashDivider: string;
  slashDividerDescription: string;
  slashImage: string;
  slashImageDescription: string;
  slashTable: string;
  slashTableDescription: string;

  uploadUploading: string; // {name}
  uploadFailed: string; // {name}
  uploadFailedWithReason: string; // {reason}
  uploadUnsupportedType: string; // {type}
  uploadTooLarge: string; // {limit} {name}
  uploadEmptyUrl: string;
  uploadRetry: string;
  uploadDismiss: string;
  resizeImage: string;
}

export const DEFAULT_MESSAGES: EditorMessages = {
  toolbarLabel: 'Text formatting',
  undo: 'Undo',
  redo: 'Redo',
  blockType: 'Block type',
  paragraph: 'Paragraph',
  heading: 'Heading {level}',
  codeBlock: 'Code block',
  fontSize: 'Font size',
  codeLanguage: 'Code block language',
  codeLanguagePlaceholder: 'Language',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  inlineCode: 'Inline code',
  link: 'Insert link',
  bulletList: 'Bullet list',
  orderedList: 'Ordered list',
  blockquote: 'Blockquote',
  horizontalRule: 'Horizontal rule',
  insertImage: 'Upload image',
  editImageAlt: 'Edit image alt text',
  imageAltPrompt: 'Describe the image (alt text)',
  more: 'More',
  moreActions: 'More actions',

  linkDialog: 'Edit link',
  linkUrl: 'Link URL',
  linkPlaceholder: 'example.com',
  linkApply: 'Apply',
  linkCancel: 'Cancel',
  linkRemove: 'Remove',
  linkInvalid: 'Enter a valid URL, e.g. example.com',

  insertTable: 'Insert table',
  tablePickerLabel: 'Insert table: use arrow keys to choose a size, Enter to insert',
  tablePickerHint: 'Select table size',
  tableMenu: 'Table',
  addRowAbove: 'Add row above',
  addRowBelow: 'Add row below',
  addColumnLeft: 'Add column left',
  addColumnRight: 'Add column right',
  deleteRow: 'Delete row',
  deleteColumn: 'Delete column',
  mergeCells: 'Merge cells',
  splitCell: 'Split cell',

  slashMenu: 'Insert block',
  slashCategoryBasic: 'Basic',
  slashCategoryMedia: 'Media',
  slashCategoryAdvanced: 'Advanced',
  slashText: 'Text',
  slashTextDescription: 'Start writing with a plain paragraph',
  slashHeading1Description: 'Large section heading',
  slashHeading2Description: 'Medium section heading',
  slashHeading3Description: 'Small section heading',
  slashBulletListDescription: 'Create an unordered list',
  slashOrderedListDescription: 'Create a numbered list',
  slashBlockquoteDescription: 'Highlight a quoted passage',
  slashCodeBlockDescription: 'Insert a fenced code block',
  slashDivider: 'Divider',
  slashDividerDescription: 'Insert a horizontal divider',
  slashImage: 'Image',
  slashImageDescription: 'Upload an image from your device',
  slashTable: 'Table',
  slashTableDescription: 'Insert a table with custom rows and columns',

  uploadUploading: 'Uploading {name}…',
  uploadFailed: 'Upload failed: {name}',
  uploadFailedWithReason: 'Upload failed: {reason}',
  uploadUnsupportedType: 'Unsupported image type: {type}',
  uploadTooLarge: 'Image exceeds {limit} MB limit: {name}',
  uploadEmptyUrl: 'The upload handler returned no URL',
  uploadRetry: 'Retry',
  uploadDismiss: 'Dismiss',
  resizeImage: 'Resize image'
};

export const messagesKo: Partial<EditorMessages> = {
  toolbarLabel: '텍스트 서식',
  undo: '실행 취소',
  redo: '다시 실행',
  blockType: '블록 유형',
  paragraph: '본문',
  heading: '제목 {level}',
  codeBlock: '코드 블록',
  fontSize: '글자 크기',
  codeLanguage: '코드 블록 언어',
  codeLanguagePlaceholder: '언어',
  bold: '굵게',
  italic: '기울임',
  underline: '밑줄',
  strikethrough: '취소선',
  inlineCode: '인라인 코드',
  link: '링크 삽입',
  bulletList: '글머리 기호 목록',
  orderedList: '번호 목록',
  blockquote: '인용',
  horizontalRule: '구분선',
  insertImage: '이미지 업로드',
  editImageAlt: '대체 텍스트 편집',
  imageAltPrompt: '이미지 설명(대체 텍스트)',
  more: '더 보기',
  moreActions: '추가 도구',
  linkDialog: '링크 편집',
  linkUrl: '링크 주소',
  linkPlaceholder: 'example.com',
  linkApply: '적용',
  linkCancel: '취소',
  linkRemove: '링크 제거',
  linkInvalid: '올바른 주소를 입력하세요. 예: example.com',
  insertTable: '표 삽입',
  tablePickerLabel: '표 삽입: 방향키로 크기를 고르고 Enter로 삽입',
  tablePickerHint: '표 크기 선택',
  tableMenu: '표',
  addRowAbove: '위에 행 추가',
  addRowBelow: '아래에 행 추가',
  addColumnLeft: '왼쪽에 열 추가',
  addColumnRight: '오른쪽에 열 추가',
  deleteRow: '행 삭제',
  deleteColumn: '열 삭제',
  mergeCells: '셀 병합',
  splitCell: '셀 분할',
  slashMenu: '블록 삽입',
  slashCategoryBasic: '기본',
  slashCategoryMedia: '미디어',
  slashCategoryAdvanced: '고급',
  slashText: '텍스트',
  slashTextDescription: '일반 문단으로 작성',
  slashHeading1Description: '큰 섹션 제목',
  slashHeading2Description: '중간 섹션 제목',
  slashHeading3Description: '작은 섹션 제목',
  slashBulletListDescription: '글머리 기호 목록 만들기',
  slashOrderedListDescription: '번호 목록 만들기',
  slashBlockquoteDescription: '인용문 강조',
  slashCodeBlockDescription: '코드 블록 삽입',
  slashDivider: '구분선',
  slashDividerDescription: '가로 구분선 삽입',
  slashImage: '이미지',
  slashImageDescription: '기기에서 이미지 업로드',
  slashTable: '표',
  slashTableDescription: '행과 열 수를 골라 표 삽입',
  uploadUploading: '{name} 업로드 중…',
  uploadFailed: '업로드 실패: {name}',
  uploadFailedWithReason: '업로드 실패: {reason}',
  uploadUnsupportedType: '지원하지 않는 이미지 형식: {type}',
  uploadTooLarge: '{limit}MB 제한을 넘는 이미지: {name}',
  uploadEmptyUrl: '업로드 함수가 URL을 반환하지 않았습니다',
  uploadRetry: '다시 시도',
  uploadDismiss: '닫기',
  resizeImage: '이미지 크기 조절'
};

export const messagesZhCN: Partial<EditorMessages> = {
  toolbarLabel: '文本格式',
  undo: '撤销',
  redo: '重做',
  blockType: '块类型',
  paragraph: '正文',
  heading: '标题 {level}',
  codeBlock: '代码块',
  fontSize: '字号',
  codeLanguage: '代码块语言',
  codeLanguagePlaceholder: '语言',
  bold: '加粗',
  italic: '斜体',
  underline: '下划线',
  strikethrough: '删除线',
  inlineCode: '行内代码',
  link: '插入链接',
  bulletList: '无序列表',
  orderedList: '有序列表',
  blockquote: '引用',
  horizontalRule: '分割线',
  insertImage: '上传图片',
  editImageAlt: '编辑替代文本',
  imageAltPrompt: '描述图片（替代文本）',
  more: '更多',
  moreActions: '更多操作',
  linkDialog: '编辑链接',
  linkUrl: '链接地址',
  linkPlaceholder: 'example.com',
  linkApply: '应用',
  linkCancel: '取消',
  linkRemove: '移除链接',
  linkInvalid: '请输入有效的地址，例如 example.com',
  insertTable: '插入表格',
  tablePickerLabel: '插入表格：用方向键选择尺寸，按 Enter 插入',
  tablePickerHint: '选择表格尺寸',
  tableMenu: '表格',
  addRowAbove: '在上方插入行',
  addRowBelow: '在下方插入行',
  addColumnLeft: '在左侧插入列',
  addColumnRight: '在右侧插入列',
  deleteRow: '删除行',
  deleteColumn: '删除列',
  mergeCells: '合并单元格',
  splitCell: '拆分单元格',
  slashMenu: '插入块',
  slashCategoryBasic: '基础',
  slashCategoryMedia: '媒体',
  slashCategoryAdvanced: '高级',
  slashText: '文本',
  slashTextDescription: '以普通段落开始书写',
  slashHeading1Description: '大号章节标题',
  slashHeading2Description: '中号章节标题',
  slashHeading3Description: '小号章节标题',
  slashBulletListDescription: '创建无序列表',
  slashOrderedListDescription: '创建有序列表',
  slashBlockquoteDescription: '突出引用的段落',
  slashCodeBlockDescription: '插入代码块',
  slashDivider: '分割线',
  slashDividerDescription: '插入水平分割线',
  slashImage: '图片',
  slashImageDescription: '从设备上传图片',
  slashTable: '表格',
  slashTableDescription: '按需选择行列数插入表格',
  uploadUploading: '正在上传 {name}…',
  uploadFailed: '上传失败：{name}',
  uploadFailedWithReason: '上传失败：{reason}',
  uploadUnsupportedType: '不支持的图片格式：{type}',
  uploadTooLarge: '图片超过 {limit} MB 限制：{name}',
  uploadEmptyUrl: '上传函数未返回 URL',
  uploadRetry: '重试',
  uploadDismiss: '关闭',
  resizeImage: '调整图片大小'
};

export function resolveMessages(overrides?: Partial<EditorMessages>): EditorMessages {
  return overrides ? { ...DEFAULT_MESSAGES, ...overrides } : DEFAULT_MESSAGES;
}

export function formatMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
