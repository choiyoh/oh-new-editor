export interface DocSection {
  title: string;
  description?: string;
  code?: string;
  codes?: {
    vanilla: string;
    react: string;
    vue: string;
    svelte: string;
  };
  tip?: string;
  warning?: string;
}

export interface DocChapter {
  id: string;
  title: string;
  description: string;
  sections: Array<DocSection>;
}

export interface DocsData {
  ko: Array<DocChapter>;
  en: Array<DocChapter>;
  'zh-CN': Array<DocChapter>;
}

export const docsData: DocsData = {
  ko: [
    {
      id: 'overview',
      title: '에디터 개요',
      description:
        'Oh New Editor는 강력하고 고도로 커스터마이징 가능한 프레임워크 독립형(Framework-Agnostic) 헤드리스 리치 텍스트 에디터 툴킷입니다.',
      sections: [
        {
          title: '왜 Oh New Editor인가?',
          description:
            '기존 에디터들은 특정 UI에 종속되어 브랜드 고유의 웹 디자인에 맞추어 스타일링하기 매우 까다로웠습니다. Oh New Editor는 헤드리스(Headless) 디자인을 취합니다. 즉, 마크업이나 스타일을 강제하지 않고 오직 에디터의 상태와 이벤트, 코어 에디팅 논리만을 정교하게 제어합니다. 디자이너가 구상한 어떤 아름다운 인터페이스든 자유롭게 얹을 수 있습니다.',
          tip: '헤드리스 구조 덕분에 CSS 변수, Tailwind, CSS Module, Emotion 등 어떤 스타일링 기술과도 충돌 없이 아름답게 결합됩니다.',
        },
        {
          title: '작동 원리 (How It Works)',
          description:
            '에디터는 내부적으로 신뢰성 높은 ProseMirror 코어 엔진 위에 설계되어 작동합니다. ProseMirror는 문서를 HTML 문자열이 아닌 정교한 스키마 트리 구조(JSON 트리와 유사)로 다루어, 텍스트가 엉키거나 유효하지 않은 HTML 코드가 인입되는 것을 엄격하게 차단합니다. Oh New Editor는 ProseMirror의 어렵고 장황한 복잡성을 세련되고 직관적인 한 줄짜리 API로 얇게 래핑하여 제공합니다.',
          warning:
            '에디터 외부의 불순한 코드가 입력될 경우, 화이트리스트 기반의 Sanitizer가 작동하여 XSS(크로스 사이트 스크립팅) 보안 위험 요소를 사전에 완벽히 차단하고 정제합니다.',
        },
        {
          title: '패키지 설치하기',
          description: '현재 다국어로 기획된 어댑터 패키지를 자신의 주력 프레임워크에 맞게 설치합니다.',
          codes: {
            vanilla: 'pnpm add @oh-new-editor/core',
            react: 'pnpm add @oh-new-editor/core @oh-new-editor/react',
            vue: 'pnpm add @oh-new-editor/core @oh-new-editor/vue',
            svelte: 'pnpm add @oh-new-editor/core @oh-new-editor/svelte',
          },
        },
        {
          title: '빠른 시작',
          description: '각 프레임워크에서 지원하는 바인딩을 사용하여 단 몇 줄로 에디터를 탑재할 수 있습니다.',
          codes: {
            vanilla: `import { createEditor } from '@oh-new-editor/core';
import '@oh-new-editor/core/style.css';

const editor = createEditor(
  document.querySelector('#editor')!,
  {
    initialContent: '<p>Hello, Vanilla JS!</p>',
    placeholder: 'Start typing…',
  }
);

editor.on('change', () => {
  console.log(editor.getContent('html'));
});`,
            react: `import { useRef } from 'react';
import { OhNewEditor, type OhNewEditorRef } from '@oh-new-editor/react';
import '@oh-new-editor/core/style.css';

export default function App() {
  const editorRef = useRef<OhNewEditorRef>(null);

  return (
    <OhNewEditor
      ref={editorRef}
      options={{ placeholder: 'Start typing…' }}
      value="<p>Hello, React!</p>"
      onChange={(html) => console.log(html)}
    />
  );
}`,
            vue: `<template>
  <OhNewEditor
    v-model="content"
    :options="{ placeholder: 'Start typing…' }"
  />
</template>

<script setup>
import { ref } from 'vue';
import { OhNewEditor } from '@oh-new-editor/vue';
import '@oh-new-editor/core/style.css';

const content = ref('<p>Hello, Vue 3!</p>');
</script>`,
            svelte: `<script>
  import { OhNewEditor } from '@oh-new-editor/svelte';
  import '@oh-new-editor/core/style.css';

  let content = '<p>Hello, Svelte!</p>';
</script>

<OhNewEditor
  bind:value={content}
  options={{ placeholder: 'Start typing…' }}
  on:change={(e) => console.log(e.detail)}
/>`,
          },
        },
      ],
    },
    {
      id: 'core-api',
      title: '코어 API: createEditor',
      description: 'EditorOptions와 Editor 인터페이스의 전체 레퍼런스입니다.',
      sections: [
        {
          title: 'EditorOptions 레퍼런스',
          description: 'createEditor에 전달하는 모든 옵션입니다.',
          code: `interface EditorOptions {
  initialContent?: string;
  outputFormat?: 'html' | 'markdown';
  markdown?: EditorMarkdownSupport;
  table?: EditorTableSupport;
  toolbar?: EditorToolbarSupport;
  style?: 'toolbar' | 'notion';
  styles?: Record<'toolbar' | 'notion', EditorToolbarSupport>;
  fontSizes?: number[];
  placeholder?: string;
  image?: { upload: (file: File) => Promise<string>; maxSize?: number; accept?: string[] };
  readOnly?: boolean;
  plugins?: Plugin[];
  schema?: Schema;
  ai?: EditorAIOptions;
}`,
        },
        {
          title: 'Editor 인터페이스',
          description: '에디터 인스턴스가 제공하는 메서드와 속성입니다.',
          code: `// Content
editor.getContent(format?: 'html' | 'markdown'): string;
editor.setContent(content: string, format?: 'html' | 'markdown'): void;
editor.setOutputFormat(format: 'html' | 'markdown'): void;

// State
editor.setReadOnly(bool: boolean): void;
editor.focus(): void;
editor.blur(): void;

// Events
editor.on(event: string, handler: (...args: any[]) => void): void;
editor.off(event: string, handler: (...args: any[]) => void): void;

// Style
editor.setStyle(style: 'toolbar' | 'notion'): void;
editor.getStyle(): 'toolbar' | 'notion';

// AI
editor.ai?: { generate(prompt: string): Promise<void>; cancel(): void };

// Lifecycle
editor.destroy(): void;`,
        },
        {
          title: '이벤트',
          description: '에디터는 네 가지 이벤트를 제공합니다.',
          code: `editor.on('ready', () => console.log('Editor mounted'));
editor.on('change', () => save(editor.getContent('html')));
editor.on('focus', () => setActive(true));
editor.on('blur', () => setActive(false));`,
          tip: '이벤트 핸들러는 `.on()` / `.off()` 패턴을 사용하며, 옵션 콜백이 아닙니다.',
        },
      ],
    },
    {
      id: 'commands',
      title: '명령어',
      description: '포매팅 명령어를 프로그래밍 방식으로 사용하는 방법입니다.',
      sections: [
        {
          title: '명령어 임포트',
          description: '명령어는 @oh-new-editor/core에서 임포트합니다.',
          code: `import { toggleBold, setHeading, insertTable } from '@oh-new-editor/core';`,
          warning:
            'Editor 인스턴스에는 commands 네임스페이스가 없습니다. 명령어는 독립형 함수로 임포트하여 사용합니다.',
        },
        {
          title: '마크 토글',
          description: '텍스트 스타일을 토글하는 명령어입니다.',
          code: `toggleBold();
toggleItalic();
toggleUnderline();
toggleStrike();
toggleCode();`,
        },
        {
          title: '블록 변환',
          description: '블록 타입을 변경하는 명령어입니다.',
          code: `setHeading(1 | 2 | 3 | 4 | 5 | 6);
toggleBlockquote();
toggleBulletList();
toggleOrderedList();
insertCodeBlock(language?: string);
insertHR();
insertParagraph();`,
        },
        {
          title: '링크와 이미지',
          description: '링크와 이미지를 삽입하거나 편집합니다.',
          code: `toggleLink(href: string); // 안전한 href만 허용
insertImage({ src, alt, title, width, height });`,
        },
        {
          title: '테이블과 리스트',
          description: '테이블과 리스트 항목을 제어합니다.',
          code: `insertTable(rows?: number, cols?: number);
liftCurrentListItem();
sinkCurrentListItem();`,
        },
        {
          title: '명령어 디스패치',
          description:
            '명령어는 ProseMirror의 (state, dispatch, view) 시그니처를 따릅니다. 에디터 내부에서 자동으로 디스패치되며, 수동 호출 시 view가 필요합니다.',
          code: `editor.on('change', () => {
  // 툴바 동기화 로직
});

// 명령어를 수동으로 디스패치하려면 view가 필요합니다:
// toggleBold()(state, dispatch, view);`,
        },
      ],
    },
    {
      id: 'schema',
      title: '스키마 레퍼런스',
      description: '문서 모델 — 노드, 마크, 커스텀 스키마입니다.',
      sections: [
        {
          title: '내장 노드',
          description: '기본 제공되는 노드 타입 목록입니다.',
          code: `doc         // 루트 문서 노드
paragraph   // 일반 단락
heading     // 제목 1-6 (level 속성)
blockquote  // 인용 블록
code_block  // 코드 블록 (language 속성)
horizontal_rule  // 구분선
bullet_list      // 글머리기호 목록
ordered_list     // 번호 목록
list_item        // 목록 항목
image            // 이미지 (src, alt, title, width, height)
text             // 텍스트 노드`,
        },
        {
          title: '내장 마크',
          description: '기본 제공되는 마크 타입 목록입니다.',
          code: `em         // 이탤릭 (기울임)
strong     // 볼드 (굵게)
link       // 링크 (href, title)
underline  // 밑줄
strike     // 취소선
code       // 인라인 코드
font_size  // 글꼴 크기`,
        },
        {
          title: '테이블 스키마',
          description: '@oh-new-editor/core/table에서 tableSchema를 임포트할 수 있습니다. options.table이 설정되면 자동으로 교체됩니다.',
          code: `import { tableSchema } from '@oh-new-editor/core/table';`,
        },
        {
          title: '커스텀 스키마',
          description: 'createEditorSchema(customNodes)를 사용하거나 options.schema로 직접 전달합니다.',
          code: `import { createEditorSchema } from '@oh-new-editor/core';

const customSchema = createEditorSchema({
  // 커스텀 노드 추가
});

const editor = createEditor(element, {
  schema: customSchema,
});`,
          tip: '기존 노드를 확장하려면 스키마를 직접 구성한 뒤 options.schema로 전달하세요.',
        },
      ],
    },
    {
      id: 'html-markdown-io',
      title: 'HTML & 마크다운 입출력',
      description: '에디터 콘텐츠를 읽고 쓰는 방법입니다.',
      sections: [
        {
          title: '콘텐츠 가져오기',
          description: 'editor.getContent()를 호출하여 현재 문서를 가져옵니다.',
          code: `// HTML 반환 (기본값)
const html = editor.getContent('html');

// 마크다운 반환
const md = editor.getContent('markdown');

// outputFormat을 설정하면 포맷 생략 가능
editor.setOutputFormat('markdown');
const content = editor.getContent(); // outputFormat을 따름`,
        },
        {
          title: '콘텐츠 설정하기',
          description: 'editor.setContent()로 문서를 교체합니다.',
          code: `// HTML로 설정
editor.setContent('<p>Hello</p>', 'html');

// 마크다운으로 설정
editor.setContent('# Hello', 'markdown');`,
        },
        {
          title: '살균 (Sanitization)',
          description:
            'DOMPurify가 파싱과 직렬화 양쪽에서 실행됩니다. 허용된 태그와 속성만 남기고 모두 제거됩니다.',
          warning:
            '마크다운 I/O를 사용하려면 options.markdown을 설정해야 합니다. 설정하지 않으면 getContent(\'markdown\') 호출 시 MISSING_MARKDOWN_SUPPORT_ERROR가 발생합니다.',
        },
        {
          title: '초기 콘텐츠',
          description:
            'options.initialContent (content 아님)로 초기 문서를 설정합니다. outputFormat에 따라 파싱됩니다.',
          code: `const editor = createEditor(element, {
  initialContent: '<p>시작 콘텐츠</p>',
});`,
        },
      ],
    },
    {
      id: 'markdown',
      title: '마크다운 지원',
      description: '옵트인 방식의 마크다운 파싱 및 직렬화입니다.',
      sections: [
        {
          title: '마크다운 활성화',
          description: 'createMarkdownSupport()를 사용하여 마크다운 기능을 추가합니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';

const editor = createEditor(element, {
  markdown: createMarkdownSupport(),
  outputFormat: 'markdown',
});`,
        },
        {
          title: '마크다운 파싱',
          description: 'editor.setContent()에 \'markdown\' 포맷을 지정합니다.',
          code: `editor.setContent('# Hello\\n\\nWorld', 'markdown');`,
        },
        {
          title: '마크다운 직렬화',
          description: 'editor.getContent(\'markdown\')으로 마크다운을 추출합니다.',
          code: `const md = editor.getContent('markdown');
console.log(md); // "# Hello\\n\\nWorld"`,
        },
        {
          title: '마크다운 정확도',
          description:
            '밑줄과 글꼴 크기는 인라인 HTML로 유지됩니다. 테이블은 GFM 파이프 또는 원시 HTML로 변환됩니다.',
          tip: '자세한 내용은 MARKDOWN_LOSS.md를 참고하세요.',
        },
      ],
    },
    {
      id: 'table',
      title: '표 지원',
      description: '옵트인 방식의 표 편집 기능과 그리드 피커입니다.',
      sections: [
        {
          title: '표 활성화',
          description: 'createTableSupport()를 사용하여 표 편집 기능을 추가합니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createTableSupport } from '@oh-new-editor/core/table';

const editor = createEditor(element, {
  table: createTableSupport({ maxRows: 12, maxCols: 8 }),
});`,
        },
        {
          title: '표 삽입',
          description: 'insertTable 명령어를 사용하거나 툴바의 그리드 피커로 표를 삽입합니다.',
          code: `import { insertTable } from '@oh-new-editor/core';`,
        },
        {
          title: '표 작업',
          description:
            '행/열 추가 및 삭제, 셀 병합/분할, 우클릭 컨텍스트 메뉴를 지원합니다.',
        },
        {
          title: '표 제한',
          description: 'maxRows/maxCols로 표 크기를 제한하며, 붙여넣기 및 삽입 시 자동으로 클램핑됩니다.',
        },
        {
          title: '테이블 스키마',
          description: 'tableSchema를 임포트할 수 있으며, 에디터에서 자동으로 교체됩니다.',
          code: `import { tableSchema } from '@oh-new-editor/core/table';`,
        },
      ],
    },
    {
      id: 'toolbar-ui',
      title: '툴바 UI',
      description: '클래식 고정 포맷팅 툴바입니다.',
      sections: [
        {
          title: '툴바 활성화',
          description: 'createToolbarSupport()를 사용하여 고정 툴바를 추가합니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import { createNotionSupport } from '@oh-new-editor/core/notion';

const editor = createEditor(element, {
  style: 'toolbar',
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport(),
  },
});`,
        },
        {
          title: '툴바 기능',
          description:
            '볼드/이탤릭/밑줄/취소선/코드, 제목 1-6, 리스트, 인용 블록, 코드 블록, 글꼴 크기 드롭다운, 링크 편집기, 이미지 업로드, 표 작업, 코드 언어 선택기를 제공합니다.',
        },
        {
          title: '글꼴 크기',
          description:
            'options.fontSizes 배열로 글꼴 크기 목록을 지정합니다. 기본값: [10,12,14,16,18,20,24,28,32,36,48,64,72]',
          code: `const editor = createEditor(element, {
  fontSizes: [12, 14, 16, 18, 20, 24, 36],
});`,
        },
        {
          title: '읽기 전용 툴바',
          description: 'editor.setReadOnly(true) 호출 시 툴바가 자동으로 비활성화됩니다.',
        },
      ],
    },
    {
      id: 'notion-ui',
      title: 'Notion 스타일 UI',
      description: '슬래시 명령어와 버블 툴바입니다.',
      sections: [
        {
          title: 'Notion UI 활성화',
          description: 'createNotionSupport()로 슬래시 명령어와 버블 툴바를 추가합니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';

const editor = createEditor(element, {
  style: 'notion',
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport(),
  },
});`,
        },
        {
          title: '런타임 전환',
          description: 'editor.setStyle()으로 toolbar와 notion 스타일을 런타임에 전환할 수 있습니다.',
          code: `editor.setStyle('notion');  // notion 스타일로 전환
editor.setStyle('toolbar'); // 클래식 툴바로 전환

const current = editor.getStyle(); // 'toolbar' | 'notion'`,
        },
        {
          title: '슬래시 명령어',
          description: '빈 줄에서 /를 입력하면 명령 메뉴가 열리고, 타이핑하여 필터링할 수 있습니다.',
        },
        {
          title: '버블 툴바',
          description: '텍스트를 선택하면 선택 영역 위에 포맷팅 툴바가 나타납니다.',
        },
        {
          title: '두 UI 모두 사용',
          description: 'styles 맵에 toolbar와 notion을 모두 제공하면 런타임 전환이 가능합니다.',
          code: `editor.setStyle('toolbar'); // 클래식으로 전환
editor.setStyle('notion');  // notion으로 전환`,
        },
      ],
    },
    {
      id: 'keyboard-shortcuts',
      title: '키보드 단축키 & 입력 규칙',
      description: '내장 키바인딩과 마크다운 스타일 단축키입니다.',
      sections: [
        {
          title: '키바인딩 표',
          description: '기본 키보드 단축키 목록입니다.',
          code: `Mod-b: Bold                  Mod-i: Italic
Mod-u: Underline            Shift-Mod-5: Strike
Mod-\`: Code                  Mod-Alt-1/2/3: H1/H2/H3
Mod-Shift-7: Ordered List   Mod-Shift-8: Bullet List
Mod-Alt-0: Blockquote       Mod-Alt--: Horizontal Rule
Shift-Ctrl-\\: Code Block    Mod-z: Undo
Shift-Mod-z / Mod-y: Redo
Tab: List indent            Shift-Tab: List outdent
Enter: New paragraph (exits code block first)`,
          tip: 'Mod는 macOS에서 Cmd, Windows/Linux에서 Ctrl입니다.',
        },
        {
          title: '입력 규칙',
          description: '마크다운 스타일 자동 변환 규칙입니다.',
          code: `**text** → bold       *text* → italic
~~text~~ → strike     \`code\` → inline code
[text](url) → link

# → H1    ## → H2   ### → H3   (######까지)
> → blockquote       - → bullet list
* → bullet list      1. → ordered list
--- → HR             \`\`\` → code block`,
        },
      ],
    },
    {
      id: 'image-upload',
      title: '이미지 업로드',
      description: '드래그, 붙여넣기, 선택을 통한 이미지 업로드 흐름입니다.',
      sections: [
        {
          title: '업로드 설정',
          description: 'options.image로 업로드 핸들러와 제한을 구성합니다.',
          code: `const editor = createEditor(element, {
  image: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await res.json();
      return url;
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  },
});`,
        },
        {
          title: '업로드 트리거',
          description: '드래그 & 드롭, 클립보드 붙여넣기, 툴바 이미지 버튼으로 업로드할 수 있습니다.',
        },
        {
          title: '업로드 UX',
          description:
            '업로드 중에는 "Uploading filename…" 플레이스홀더가 표시되고, 실패 시 재시도 버튼이 나타나며, 더블클릭 시 alt 텍스트를 입력할 수 있습니다.',
        },
        {
          title: '이미지 노드',
          description: '이미지 노드는 src, alt, title, width, height 속성을 지원합니다.',
        },
      ],
    },
    {
      id: 'ai',
      title: 'AI 통합',
      description: 'AI 기반 텍스트 생성 및 스트리밍입니다.',
      sections: [
        {
          title: '기본 AI 설정',
          description: 'options.ai.onGenerate로 AI 생성 함수를 등록합니다.',
          code: `const editor = createEditor(element, {
  ai: {
    onGenerate: async (prompt, context, signal) => {
      const res = await fetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify({ prompt, context }),
        signal,
      });
      return (await res.json()).text;
    },
  },
});

// 생성 트리거
await editor.ai?.generate('Write a summary');`,
        },
        {
          title: '스트리밍',
          description:
            'onStream이 AsyncIterable<string>을 반환하면 청크가 하나씩 삽입되며, 생성 중에는 에디터가 잠깁니다.',
        },
        {
          title: 'AI 컨텍스트',
          description:
            'AIContext는 documentContent, selectedText, textBefore, textAfter, cursorOffset, outputFormat을 포함합니다.',
        },
        {
          title: '취소와 실행 취소',
          description:
            'editor.ai?.cancel()로 스트리밍 범위를 삭제할 수 있으며, 완료 시 히스토리 경계가 생성됩니다.',
          warning: 'AI 생성 중에는 에디터가 읽기 전용이 됩니다. 취소하면 편집이 복원됩니다.',
        },
      ],
    },
    {
      id: 'theming',
      title: '테마 & 스타일링',
      description: '다크 모드, CSS 커스텀 프로퍼티, 클래스 훅입니다.',
      sections: [
        {
          title: '다크 모드',
          description:
            '컨테이너에 data-theme="dark" 속성을 설정하면 CSS 커스텀 프로퍼티가 반응합니다.',
          code: `<!-- 다크 모드 활성화 -->
<div data-theme="dark">
  <div id="editor"></div>
</div>`,
          tip: '웹사이트 데모에서는 data-theme을 Tailwind의 dark 클래스와 동기화합니다.',
        },
        {
          title: 'CSS 클래스 훅',
          description: '에디터가 제공하는 CSS 클래스 목록입니다.',
          code: `.oh-editor              — 에디터 루트
.oh-editor__content     — 콘텐츠 영역
.oh-editor__placeholder — 빈 상태 텍스트
.oh-editor__upload-placeholder--uploading  — 업로드 진행 중
.oh-editor__upload-placeholder--error      — 업로드 실패`,
        },
        {
          title: '스타일 임포트',
          description: '에디터의 기본 스타일을 임포트합니다.',
          code: `import '@oh-new-editor/core/style.css';`,
        },
        {
          title: '커스텀 스타일링',
          description: 'CSS 커스텀 프로퍼티를 재정의하거나 고유한 클래스를 추가하여 스타일링할 수 있습니다.',
        },
      ],
    },
    {
      id: 'sanitization',
      title: '살균 & 보안',
      description: 'XSS 방지, HTML 화이트리스트, 안전한 링크입니다.',
      sections: [
        {
          title: '살균 파이프라인',
          description:
            '파싱: 입력 → sanitizeHtml → DOM 파싱 → 문서; 직렬화: 문서 → DOM → sanitizeHtml → 출력. DOMPurify가 엄격한 허용 목록으로 실행됩니다.',
        },
        {
          title: '허용 태그',
          description: '화이트리스트에 포함된 HTML 태그 목록입니다.',
          code: `a, blockquote, br, code, del, em, h1-h6, hr, img,
li, ol, p, pre, s, span, strong, table, tbody,
td, th, thead, tr, u, ul`,
        },
        {
          title: '허용 속성',
          description: '화이트리스트에 포함된 HTML 속성 목록입니다.',
          code: `alt, colspan, data-language, height, href,
rowspan, src, style, title, width`,
        },
        {
          title: '안전한 링크',
          description: 'isSafeHref가 http:, https:, mailto:, tel: 프로토콜만 허용합니다.',
        },
        {
          title: 'CSS 속성 필터링',
          description: '인라인 스타일 중 font-size와 background-color만 허용됩니다.',
        },
      ],
    },
    {
      id: 'framework-adapters',
      title: '프레임워크 어댑터',
      description: 'React, Vue, Svelte 컴포넌트 API입니다.',
      sections: [
        {
          title: 'React',
          description:
            'OhNewEditor는 forwardRef 컴포넌트로, value, onChange, options props를 받고 ref로 Editor를 노출합니다.',
          code: `import { useRef } from 'react';
import { OhNewEditor, type OhNewEditorRef } from '@oh-new-editor/react';

function App() {
  const editorRef = useRef<OhNewEditorRef>(null);

  return (
    <OhNewEditor
      ref={editorRef}
      value="<p>Hello</p>"
      onChange={(html) => console.log(html)}
      options={{ placeholder: 'Start typing…' }}
    />
  );
}`,
        },
        {
          title: 'Vue 3',
          description:
            'OhNewEditor는 defineComponent로, modelValue와 options props를 받고 update:modelValue와 change를 emit하며 editor를 expose합니다.',
          code: `<template>
  <OhNewEditor
    v-model="content"
    :options="{ placeholder: 'Start typing…' }"
  />
</template>

<script setup>
import { ref } from 'vue';
import { OhNewEditor } from '@oh-new-editor/vue';

const content = ref('<p>Hello</p>');
</script>`,
        },
        {
          title: 'Svelte',
          description:
            'OhNewEditor.svelte는 value와 options props를 받고 change 이벤트를 발생시킵니다 (detail: HTML 문자열).',
          code: `<script>
  import { OhNewEditor } from '@oh-new-editor/svelte';

  let content = '<p>Hello</p>';
</script>

<OhNewEditor
  bind:value={content}
  options={{ placeholder: 'Start typing…' }}
  on:change={(e) => console.log(e.detail)}
/>`,
        },
        {
          title: '제어 패턴',
          description:
            'React는 value/onChange, Vue는 v-model, Svelte는 bind:value를 사용합니다. 포커스 중에는 콘텐츠 동기화를 건너뜁니다.',
          tip: '모든 어댑터는 createEditor의 얇은 래퍼입니다. Editor 인스턴스는 항상 접근 가능합니다.',
        },
      ],
    },
    {
      id: 'advanced',
      title: '고급: 플러그인 & 커스텀 스키마',
      description: '커스텀 ProseMirror 플러그인과 스키마로 에디터 확장하기.',
      sections: [
        {
          title: '커스텀 플러그인',
          description: 'options.plugins 배열에 ProseMirror 플러그인을 추가합니다. 내장 플러그인 뒤에 추가됩니다.',
          code: `import { Plugin } from 'prosemirror-state';

const myPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.key === 'Enter') {
        console.log('Enter pressed');
        return false; // 기본 동작 유지
      }
      return false;
    },
  },
});

const editor = createEditor(element, {
  plugins: [myPlugin],
});`,
        },
        {
          title: '커스텀 스키마',
          description: 'createEditorSchema와 options.schema로 노드와 마크를 추가/확장합니다.',
          code: `import { createEditorSchema } from '@oh-new-editor/core';
import { Schema } from 'prosemirror-model';

const customSchema = createEditorSchema({
  // 추가 노드 정의
});

const editor = createEditor(element, {
  schema: customSchema,
});`,
        },
        {
          title: '피처 팩토리',
          description: '자신만의 기능을 만들 때 createXSupport() 패턴을 따르세요.',
          tip: '코어 패키지의 플러그인 파일(imageUpload.ts, inputRules.ts 등)을 참고하여 패턴을 익히세요.',
        },
      ],
    },
  ],
  en: [
    {
      id: 'overview',
      title: 'Overview',
      description:
        'Oh New Editor is a powerful, highly customizable, and framework-agnostic headless rich-text editor toolkit.',
      sections: [
        {
          title: 'Why Oh New Editor?',
          description:
            'Traditional editors force a pre-defined UI, making it extremely tedious to match your brand\'s custom design. Oh New Editor adopts a headless architecture. It avoids enforcing any markup or stylesheet, giving you precise control over state, events, and editing logic. This allows you to construct any beautiful interface designed by your team.',
          tip: 'Due to its headless design, it seamlessly integrates with any styling method such as CSS custom properties, Tailwind CSS, CSS Modules, or CSS-in-JS libraries.',
        },
        {
          title: 'How It Works',
          description:
            'Internally, the editor runs on the robust ProseMirror engine. ProseMirror represents documents as a structured tree schema (like a JSON tree) rather than a raw HTML string. This strictly prevents malformed HTML and sanitizes pasting inputs. Oh New Editor wraps ProseMirror\'s verbose API into a sleek, intuitive, and thin wrapper.',
          warning:
            'When suspicious inputs enter the editor, a whitelist-based sanitizer filters malicious code to block cross-site scripting (XSS) risks automatically.',
        },
        {
          title: 'Package Installation',
          description: 'Install the core editor and framework adapter of your choice.',
          codes: {
            vanilla: 'pnpm add @oh-new-editor/core',
            react: 'pnpm add @oh-new-editor/core @oh-new-editor/react',
            vue: 'pnpm add @oh-new-editor/core @oh-new-editor/vue',
            svelte: 'pnpm add @oh-new-editor/core @oh-new-editor/svelte',
          },
        },
        {
          title: 'Quick Start',
          description: 'Mount the editor in just a few lines using the framework binding of your choice.',
          codes: {
            vanilla: `import { createEditor } from '@oh-new-editor/core';
import '@oh-new-editor/core/style.css';

const editor = createEditor(
  document.querySelector('#editor')!,
  {
    initialContent: '<p>Hello, Vanilla JS!</p>',
    placeholder: 'Start typing…',
  }
);

editor.on('change', () => {
  console.log(editor.getContent('html'));
});`,
            react: `import { useRef } from 'react';
import { OhNewEditor, type OhNewEditorRef } from '@oh-new-editor/react';
import '@oh-new-editor/core/style.css';

export default function App() {
  const editorRef = useRef<OhNewEditorRef>(null);

  return (
    <OhNewEditor
      ref={editorRef}
      options={{ placeholder: 'Start typing…' }}
      value="<p>Hello, React!</p>"
      onChange={(html) => console.log(html)}
    />
  );
}`,
            vue: `<template>
  <OhNewEditor
    v-model="content"
    :options="{ placeholder: 'Start typing…' }"
  />
</template>

<script setup>
import { ref } from 'vue';
import { OhNewEditor } from '@oh-new-editor/vue';
import '@oh-new-editor/core/style.css';

const content = ref('<p>Hello, Vue 3!</p>');
</script>`,
            svelte: `<script>
  import { OhNewEditor } from '@oh-new-editor/svelte';
  import '@oh-new-editor/core/style.css';

  let content = '<p>Hello, Svelte!</p>';
</script>

<OhNewEditor
  bind:value={content}
  options={{ placeholder: 'Start typing…' }}
  on:change={(e) => console.log(e.detail)}
/>`,
          },
        },
      ],
    },
    {
      id: 'core-api',
      title: 'Core API: createEditor',
      description: 'Full reference for EditorOptions and the Editor interface.',
      sections: [
        {
          title: 'EditorOptions Reference',
          description: 'All options accepted by createEditor.',
          code: `interface EditorOptions {
  initialContent?: string;
  outputFormat?: 'html' | 'markdown';
  markdown?: EditorMarkdownSupport;
  table?: EditorTableSupport;
  toolbar?: EditorToolbarSupport;
  style?: 'toolbar' | 'notion';
  styles?: Record<'toolbar' | 'notion', EditorToolbarSupport>;
  fontSizes?: number[];
  placeholder?: string;
  image?: { upload: (file: File) => Promise<string>; maxSize?: number; accept?: string[] };
  readOnly?: boolean;
  plugins?: Plugin[];
  schema?: Schema;
  ai?: EditorAIOptions;
}`,
        },
        {
          title: 'Editor Interface',
          description: 'Methods and properties available on the editor instance.',
          code: `// Content
editor.getContent(format?: 'html' | 'markdown'): string;
editor.setContent(content: string, format?: 'html' | 'markdown'): void;
editor.setOutputFormat(format: 'html' | 'markdown'): void;

// State
editor.setReadOnly(bool: boolean): void;
editor.focus(): void;
editor.blur(): void;

// Events
editor.on(event: string, handler: (...args: any[]) => void): void;
editor.off(event: string, handler: (...args: any[]) => void): void;

// Style
editor.setStyle(style: 'toolbar' | 'notion'): void;
editor.getStyle(): 'toolbar' | 'notion';

// AI
editor.ai?: { generate(prompt: string): Promise<void>; cancel(): void };

// Lifecycle
editor.destroy(): void;`,
        },
        {
          title: 'Events',
          description: 'The editor provides four lifecycle and interaction events.',
          code: `editor.on('ready', () => console.log('Editor mounted'));
editor.on('change', () => save(editor.getContent('html')));
editor.on('focus', () => setActive(true));
editor.on('blur', () => setActive(false));`,
          tip: 'Event handlers use the `.on()` / `.off()` pattern, not option callbacks.',
        },
      ],
    },
    {
      id: 'commands',
      title: 'Commands',
      description: 'How to use formatting commands programmatically.',
      sections: [
        {
          title: 'Importing Commands',
          description: 'Commands are imported from @oh-new-editor/core.',
          code: `import { toggleBold, setHeading, insertTable } from '@oh-new-editor/core';`,
          warning:
            'The Editor instance does NOT have a commands namespace. Commands are imported as standalone functions.',
        },
        {
          title: 'Mark Toggles',
          description: 'Commands for toggling text style marks.',
          code: `toggleBold();
toggleItalic();
toggleUnderline();
toggleStrike();
toggleCode();`,
        },
        {
          title: 'Block Transforms',
          description: 'Commands for changing block node types.',
          code: `setHeading(1 | 2 | 3 | 4 | 5 | 6);
toggleBlockquote();
toggleBulletList();
toggleOrderedList();
insertCodeBlock(language?: string);
insertHR();
insertParagraph();`,
        },
        {
          title: 'Links & Images',
          description: 'Insert and edit links and images.',
          code: `toggleLink(href: string); // Only safe hrefs allowed
insertImage({ src, alt, title, width, height });`,
        },
        {
          title: 'Tables & Lists',
          description: 'Control tables and list items.',
          code: `insertTable(rows?: number, cols?: number);
liftCurrentListItem();
sinkCurrentListItem();`,
        },
        {
          title: 'Dispatching Commands',
          description:
            'Commands follow ProseMirror\'s (state, dispatch, view) signature. They are dispatched internally; direct invocation requires the view.',
          code: `editor.on('change', () => {
  // Toolbar sync logic
});

// To dispatch manually, you need the view reference:
// toggleBold()(state, dispatch, view);`,
        },
      ],
    },
    {
      id: 'schema',
      title: 'Schema Reference',
      description: 'Document model — nodes, marks, and custom schemas.',
      sections: [
        {
          title: 'Built-in Nodes',
          description: 'Default node types provided by the editor.',
          code: `doc         // Root document node
paragraph   // Plain paragraph
heading     // Heading 1-6 (level attribute)
blockquote  // Block quote
code_block  // Code block (language attribute)
horizontal_rule  // Horizontal rule
bullet_list      // Bullet list
ordered_list     // Ordered list
list_item        // List item
image            // Image (src, alt, title, width, height)
text             // Text node`,
        },
        {
          title: 'Built-in Marks',
          description: 'Default mark types provided by the editor.',
          code: `em         // Italic
strong     // Bold
link       // Link (href, title)
underline  // Underline
strike     // Strikethrough
code       // Inline code
font_size  // Font size`,
        },
        {
          title: 'Table Schema',
          description:
            'tableSchema is exported from @oh-new-editor/core/table. It is swapped automatically when options.table is set.',
          code: `import { tableSchema } from '@oh-new-editor/core/table';`,
        },
        {
          title: 'Custom Schema',
          description:
            'Use createEditorSchema(customNodes) or pass directly via options.schema.',
          code: `import { createEditorSchema } from '@oh-new-editor/core';

const customSchema = createEditorSchema({
  // Add custom nodes
});

const editor = createEditor(element, {
  schema: customSchema,
});`,
          tip: 'To extend existing nodes, compose your schema manually and pass it via options.schema.',
        },
      ],
    },
    {
      id: 'html-markdown-io',
      title: 'HTML & Markdown I/O',
      description: 'Reading and writing editor content.',
      sections: [
        {
          title: 'Getting Content',
          description: 'Call editor.getContent() to retrieve the current document.',
          code: `// Returns HTML (default)
const html = editor.getContent('html');

// Returns Markdown
const md = editor.getContent('markdown');

// Set outputFormat to omit the format argument
editor.setOutputFormat('markdown');
const content = editor.getContent(); // respects outputFormat`,
        },
        {
          title: 'Setting Content',
          description: 'Replace the document with editor.setContent().',
          code: `// Set HTML
editor.setContent('<p>Hello</p>', 'html');

// Set Markdown
editor.setContent('# Hello', 'markdown');`,
        },
        {
          title: 'Sanitization',
          description:
            'DOMPurify runs on both parse and serialize passes. Only allowed tags and attributes are preserved.',
          warning:
            'Setting options.markdown is required for markdown I/O. Without it, getContent(\'markdown\') throws MISSING_MARKDOWN_SUPPORT_ERROR.',
        },
        {
          title: 'Initial Content',
          description:
            'Use options.initialContent (not content) to set the initial document. It is parsed according to outputFormat.',
          code: `const editor = createEditor(element, {
  initialContent: '<p>Initial content</p>',
});`,
        },
      ],
    },
    {
      id: 'markdown',
      title: 'Markdown Support',
      description: 'Opt-in markdown parsing and serialization.',
      sections: [
        {
          title: 'Enabling Markdown',
          description: 'Add markdown support using createMarkdownSupport().',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';

const editor = createEditor(element, {
  markdown: createMarkdownSupport(),
  outputFormat: 'markdown',
});`,
        },
        {
          title: 'Parsing Markdown',
          description: 'Pass \'markdown\' format to editor.setContent().',
          code: `editor.setContent('# Hello\\n\\nWorld', 'markdown');`,
        },
        {
          title: 'Serializing to Markdown',
          description: 'Call editor.getContent(\'markdown\') to extract markdown.',
          code: `const md = editor.getContent('markdown');
console.log(md); // "# Hello\\n\\nWorld"`,
        },
        {
          title: 'Markdown Fidelity',
          description:
            'Underline and font-size are preserved as inline HTML. Tables serialize as GFM pipes or raw HTML.',
          tip: 'Refer to MARKDOWN_LOSS.md for detailed fidelity notes.',
        },
      ],
    },
    {
      id: 'table',
      title: 'Table Support',
      description: 'Opt-in table editing with a grid picker and cell actions.',
      sections: [
        {
          title: 'Enabling Tables',
          description: 'Add table support using createTableSupport().',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createTableSupport } from '@oh-new-editor/core/table';

const editor = createEditor(element, {
  table: createTableSupport({ maxRows: 12, maxCols: 8 }),
});`,
        },
        {
          title: 'Inserting Tables',
          description: 'Use the insertTable command or the grid picker in the toolbar.',
          code: `import { insertTable } from '@oh-new-editor/core';`,
        },
        {
          title: 'Table Actions',
          description:
            'Add/delete rows and columns, merge/split cells, and a right-click context menu.',
        },
        {
          title: 'Table Limits',
          description:
            'maxRows/maxCols clamp table dimensions on paste and insert operations.',
        },
        {
          title: 'Table Schema',
          description:
            'tableSchema is exported and automatically swapped when table support is enabled.',
          code: `import { tableSchema } from '@oh-new-editor/core/table';`,
        },
      ],
    },
    {
      id: 'toolbar-ui',
      title: 'Toolbar UI',
      description: 'Classic fixed formatting toolbar.',
      sections: [
        {
          title: 'Enabling Toolbar',
          description: 'Add the fixed toolbar using createToolbarSupport().',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import { createNotionSupport } from '@oh-new-editor/core/notion';

const editor = createEditor(element, {
  style: 'toolbar',
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport(),
  },
});`,
        },
        {
          title: 'Toolbar Features',
          description:
            'Bold/italic/underline/strike/code, headings 1-6, lists, blockquote, code block, font size dropdown, link editor, image upload, table actions, and code language selector.',
        },
        {
          title: 'Font Sizes',
          description:
            'Configure font sizes via options.fontSizes. Default: [10,12,14,16,18,20,24,28,32,36,48,64,72]',
          code: `const editor = createEditor(element, {
  fontSizes: [12, 14, 16, 18, 20, 24, 36],
});`,
        },
        {
          title: 'Read-Only Toolbar',
          description:
            'The toolbar adapts automatically when editor.setReadOnly(true) is called.',
        },
      ],
    },
    {
      id: 'notion-ui',
      title: 'Notion-Style UI',
      description: 'Slash commands and bubble toolbar.',
      sections: [
        {
          title: 'Enabling Notion UI',
          description: 'Add slash commands and bubble toolbar using createNotionSupport().',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';

const editor = createEditor(element, {
  style: 'notion',
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport(),
  },
});`,
        },
        {
          title: 'Runtime Switching',
          description:
            'Switch between toolbar and notion style at runtime using editor.setStyle().',
          code: `editor.setStyle('notion');  // switch to notion
editor.setStyle('toolbar'); // switch to classic

const current = editor.getStyle(); // 'toolbar' | 'notion'`,
        },
        {
          title: 'Slash Commands',
          description:
            'Type / on an empty line to open the command menu. Filter commands by typing.',
        },
        {
          title: 'Bubble Toolbar',
          description:
            'Select text to show a floating formatting toolbar above the selection.',
        },
        {
          title: 'Both UIs',
          description:
            'Provide both in the styles map to enable runtime switching between toolbar and notion.',
          code: `editor.setStyle('toolbar'); // switch to classic
editor.setStyle('notion');  // switch to notion`,
        },
      ],
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts & Input Rules',
      description: 'Built-in keybindings and markdown-like shortcuts.',
      sections: [
        {
          title: 'Keybindings Table',
          description: 'Default keyboard shortcuts.',
          code: `Mod-b: Bold                  Mod-i: Italic
Mod-u: Underline            Shift-Mod-5: Strike
Mod-\`: Code                  Mod-Alt-1/2/3: H1/H2/H3
Mod-Shift-7: Ordered List   Mod-Shift-8: Bullet List
Mod-Alt-0: Blockquote       Mod-Alt--: Horizontal Rule
Shift-Ctrl-\\: Code Block    Mod-z: Undo
Shift-Mod-z / Mod-y: Redo
Tab: List indent            Shift-Tab: List outdent
Enter: New paragraph (exits code block first)`,
          tip: 'Mod is Cmd on macOS, Ctrl on Windows/Linux.',
        },
        {
          title: 'Input Rules',
          description: 'Markdown-like auto-conversion rules.',
          code: `**text** → bold       *text* → italic
~~text~~ → strike     \`code\` → inline code
[text](url) → link

# → H1    ## → H2   ### → H3   (up to ######)
> → blockquote       - → bullet list
* → bullet list      1. → ordered list
--- → HR             \`\`\` → code block`,
        },
      ],
    },
    {
      id: 'image-upload',
      title: 'Image Upload',
      description: 'Drag, paste, and pick image upload flow.',
      sections: [
        {
          title: 'Configuring Upload',
          description: 'Configure upload handler and limits via options.image.',
          code: `const editor = createEditor(element, {
  image: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await res.json();
      return url;
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  },
});`,
        },
        {
          title: 'Upload Triggers',
          description:
            'Drag & drop, paste from clipboard, and the toolbar image button all trigger uploads.',
        },
        {
          title: 'Upload UX',
          description:
            'A placeholder shows "Uploading filename…" during upload. A retry button appears on failure. Double-click an image to set alt text.',
        },
        {
          title: 'Image Node',
          description:
            'The image node supports src, alt, title, width, and height attributes.',
        },
      ],
    },
    {
      id: 'ai',
      title: 'AI Integration',
      description: 'AI-powered text generation and streaming.',
      sections: [
        {
          title: 'Basic AI Setup',
          description: 'Register an AI generation function via options.ai.onGenerate.',
          code: `const editor = createEditor(element, {
  ai: {
    onGenerate: async (prompt, context, signal) => {
      const res = await fetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify({ prompt, context }),
        signal,
      });
      return (await res.json()).text;
    },
  },
});

// Trigger generation
await editor.ai?.generate('Write a summary');`,
        },
        {
          title: 'Streaming',
          description:
            'When onStream returns an AsyncIterable<string>, chunks are inserted one by one. The editor is locked during generation.',
        },
        {
          title: 'AI Context',
          description:
            'AIContext includes documentContent, selectedText, textBefore, textAfter, cursorOffset, and outputFormat.',
        },
        {
          title: 'Cancel & Undo',
          description:
            'Call editor.ai?.cancel() to delete the streamed range. A history boundary is created on completion.',
          warning:
            'The editor becomes read-only during AI generation. Cancel to restore editing.',
        },
      ],
    },
    {
      id: 'theming',
      title: 'Theming & Styling',
      description: 'Dark mode, CSS custom properties, and class hooks.',
      sections: [
        {
          title: 'Dark Mode',
          description:
            'Set data-theme="dark" on the container element. CSS custom properties respond accordingly.',
          code: `<!-- Enable dark mode -->
<div data-theme="dark">
  <div id="editor"></div>
</div>`,
          tip: 'In the website demo, we sync data-theme with Tailwind\'s dark class.',
        },
        {
          title: 'CSS Class Hooks',
          description: 'CSS classes exposed by the editor.',
          code: `.oh-editor              — editor root
.oh-editor__content     — content area
.oh-editor__placeholder — empty-state placeholder text
.oh-editor__upload-placeholder--uploading  — upload in progress
.oh-editor__upload-placeholder--error      — upload failed`,
        },
        {
          title: 'Style Import',
          description: 'Import the editor base styles.',
          code: `import '@oh-new-editor/core/style.css';`,
        },
        {
          title: 'Custom Styling',
          description:
            'Override CSS custom properties or add your own CSS classes for full customization.',
        },
      ],
    },
    {
      id: 'sanitization',
      title: 'Sanitization & Security',
      description: 'XSS prevention, HTML whitelist, and safe links.',
      sections: [
        {
          title: 'Sanitization Pipeline',
          description:
            'Parse: input → sanitizeHtml → DOM parse → doc. Serialize: doc → DOM → sanitizeHtml → output. DOMPurify runs with a strict allowlist.',
        },
        {
          title: 'Allowed Tags',
          description: 'HTML tags permitted by the whitelist.',
          code: `a, blockquote, br, code, del, em, h1-h6, hr, img,
li, ol, p, pre, s, span, strong, table, tbody,
td, th, thead, tr, u, ul`,
        },
        {
          title: 'Allowed Attributes',
          description: 'HTML attributes permitted by the whitelist.',
          code: `alt, colspan, data-language, height, href,
rowspan, src, style, title, width`,
        },
        {
          title: 'Safe Links',
          description:
            'isSafeHref only allows http:, https:, mailto:, and tel: protocols.',
        },
        {
          title: 'CSS Property Filtering',
          description:
            'Only font-size and background-color are allowed in inline styles.',
        },
      ],
    },
    {
      id: 'framework-adapters',
      title: 'Framework Adapters',
      description: 'React, Vue, and Svelte component APIs.',
      sections: [
        {
          title: 'React',
          description:
            'OhNewEditor is a forwardRef component. Props: value, onChange, options. The ref exposes the Editor instance.',
          code: `import { useRef } from 'react';
import { OhNewEditor, type OhNewEditorRef } from '@oh-new-editor/react';

function App() {
  const editorRef = useRef<OhNewEditorRef>(null);

  return (
    <OhNewEditor
      ref={editorRef}
      value="<p>Hello</p>"
      onChange={(html) => console.log(html)}
      options={{ placeholder: 'Start typing…' }}
    />
  );
}`,
        },
        {
          title: 'Vue 3',
          description:
            'OhNewEditor is a defineComponent. Props: modelValue, options. Emits: update:modelValue, change. Exposes: { editor }.',
          code: `<template>
  <OhNewEditor
    v-model="content"
    :options="{ placeholder: 'Start typing…' }"
  />
</template>

<script setup>
import { ref } from 'vue';
import { OhNewEditor } from '@oh-new-editor/vue';

const content = ref('<p>Hello</p>');
</script>`,
        },
        {
          title: 'Svelte',
          description:
            'OhNewEditor.svelte accepts value and options props, and dispatches a change event with the HTML string as detail.',
          code: `<script>
  import { OhNewEditor } from '@oh-new-editor/svelte';

  let content = '<p>Hello</p>';
</script>

<OhNewEditor
  bind:value={content}
  options={{ placeholder: 'Start typing…' }}
  on:change={(e) => console.log(e.detail)}
/>`,
        },
        {
          title: 'Controlled Pattern',
          description:
            'React uses value/onChange, Vue uses v-model, Svelte uses bind:value. Content sync is skipped while the editor is focused.',
          tip: 'All adapters are thin wrappers around createEditor. The underlying Editor instance is always accessible.',
        },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced: Plugins & Custom Schema',
      description: 'Extending the editor with custom ProseMirror plugins and schema.',
      sections: [
        {
          title: 'Custom Plugins',
          description:
            'Pass ProseMirror plugins via options.plugins. They are appended after built-in plugins.',
          code: `import { Plugin } from 'prosemirror-state';

const myPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.key === 'Enter') {
        console.log('Enter pressed');
        return false; // preserve default behavior
      }
      return false;
    },
  },
});

const editor = createEditor(element, {
  plugins: [myPlugin],
});`,
        },
        {
          title: 'Custom Schema',
          description:
            'Use createEditorSchema and options.schema to add or extend nodes and marks.',
          code: `import { createEditorSchema } from '@oh-new-editor/core';
import { Schema } from 'prosemirror-model';

const customSchema = createEditorSchema({
  // Custom node definitions
});

const editor = createEditor(element, {
  schema: customSchema,
});`,
        },
        {
          title: 'Feature Factories',
          description:
            'Follow the createXSupport() pattern when building your own features.',
          tip: 'Refer to the core package\'s plugin files (imageUpload.ts, inputRules.ts, etc.) for implementation patterns.',
        },
      ],
    },
  ],
  'zh-CN': [
    {
      id: 'overview',
      title: '编辑器概述',
      description:
        'Oh New Editor 是一个强大、高度可定制、框架无关的无头富文本编辑器工具包。',
      sections: [
        {
          title: '为什么选择 Oh New Editor？',
          description:
            '传统编辑器强制使用预定义的 UI，使得自定义品牌设计变得非常繁琐。Oh New Editor 采用无头架构，不强制任何标记或样式，只精细控制编辑器的状态、事件和核心编辑逻辑。您可以自由构建设计师构思的任何精美界面。',
          tip: '由于无头设计，它可以与 CSS 变量、Tailwind、CSS Module、Emotion 等任何样式技术无缝结合。',
        },
        {
          title: '工作原理',
          description:
            '编辑器内部基于可靠的 ProseMirror 核心引擎构建。ProseMirror 将文档视为结构化的模式树（类似于 JSON 树），而非原始 HTML 字符串，严格防止格式错误的 HTML 并净化粘贴内容。Oh New Editor 将 ProseMirror 繁琐的复杂性封装为简洁直观的 API。',
          warning:
            '当外部可疑代码输入时，基于白名单的净化器会自动过滤恶意代码，阻止跨站脚本（XSS）安全风险。',
        },
        {
          title: '安装包',
          description: '根据您的主框架安装核心包和适配器包。',
          codes: {
            vanilla: 'pnpm add @oh-new-editor/core',
            react: 'pnpm add @oh-new-editor/core @oh-new-editor/react',
            vue: 'pnpm add @oh-new-editor/core @oh-new-editor/vue',
            svelte: 'pnpm add @oh-new-editor/core @oh-new-editor/svelte',
          },
        },
        {
          title: '快速开始',
          description: '使用框架绑定，只需几行代码即可挂载编辑器。',
          codes: {
            vanilla: `import { createEditor } from '@oh-new-editor/core';
import '@oh-new-editor/core/style.css';

const editor = createEditor(
  document.querySelector('#editor')!,
  {
    initialContent: '<p>Hello, Vanilla JS!</p>',
    placeholder: 'Start typing…',
  }
);

editor.on('change', () => {
  console.log(editor.getContent('html'));
});`,
            react: `import { useRef } from 'react';
import { OhNewEditor, type OhNewEditorRef } from '@oh-new-editor/react';
import '@oh-new-editor/core/style.css';

export default function App() {
  const editorRef = useRef<OhNewEditorRef>(null);

  return (
    <OhNewEditor
      ref={editorRef}
      options={{ placeholder: 'Start typing…' }}
      value="<p>Hello, React!</p>"
      onChange={(html) => console.log(html)}
    />
  );
}`,
            vue: `<template>
  <OhNewEditor
    v-model="content"
    :options="{ placeholder: 'Start typing…' }"
  />
</template>

<script setup>
import { ref } from 'vue';
import { OhNewEditor } from '@oh-new-editor/vue';
import '@oh-new-editor/core/style.css';

const content = ref('<p>Hello, Vue 3!</p>');
</script>`,
            svelte: `<script>
  import { OhNewEditor } from '@oh-new-editor/svelte';
  import '@oh-new-editor/core/style.css';

  let content = '<p>Hello, Svelte!</p>';
</script>

<OhNewEditor
  bind:value={content}
  options={{ placeholder: 'Start typing…' }}
  on:change={(e) => console.log(e.detail)}
/>`,
          },
        },
      ],
    },
    {
      id: 'core-api',
      title: '核心 API：createEditor',
      description: 'EditorOptions 和 Editor 接口的完整参考。',
      sections: [
        {
          title: 'EditorOptions 参考',
          description: 'createEditor 接受的所有选项。',
          code: `interface EditorOptions {
  initialContent?: string;
  outputFormat?: 'html' | 'markdown';
  markdown?: EditorMarkdownSupport;
  table?: EditorTableSupport;
  toolbar?: EditorToolbarSupport;
  style?: 'toolbar' | 'notion';
  styles?: Record<'toolbar' | 'notion', EditorToolbarSupport>;
  fontSizes?: number[];
  placeholder?: string;
  image?: { upload: (file: File) => Promise<string>; maxSize?: number; accept?: string[] };
  readOnly?: boolean;
  plugins?: Plugin[];
  schema?: Schema;
  ai?: EditorAIOptions;
}`,
        },
        {
          title: 'Editor 接口',
          description: '编辑器实例上可用的方法和属性。',
          code: `// Content
editor.getContent(format?: 'html' | 'markdown'): string;
editor.setContent(content: string, format?: 'html' | 'markdown'): void;
editor.setOutputFormat(format: 'html' | 'markdown'): void;

// State
editor.setReadOnly(bool: boolean): void;
editor.focus(): void;
editor.blur(): void;

// Events
editor.on(event: string, handler: (...args: any[]) => void): void;
editor.off(event: string, handler: (...args: any[]) => void): void;

// Style
editor.setStyle(style: 'toolbar' | 'notion'): void;
editor.getStyle(): 'toolbar' | 'notion';

// AI
editor.ai?: { generate(prompt: string): Promise<void>; cancel(): void };

// Lifecycle
editor.destroy(): void;`,
        },
        {
          title: '事件',
          description: '编辑器提供四个生命周期和交互事件。',
          code: `editor.on('ready', () => console.log('Editor mounted'));
editor.on('change', () => save(editor.getContent('html')));
editor.on('focus', () => setActive(true));
editor.on('blur', () => setActive(false));`,
          tip: '事件处理使用 .on() / .off() 模式，而非选项回调。',
        },
      ],
    },
    {
      id: 'commands',
      title: '命令',
      description: '如何以编程方式使用格式化命令。',
      sections: [
        {
          title: '导入命令',
          description: '从 @oh-new-editor/core 导入命令。',
          code: `import { toggleBold, setHeading, insertTable } from '@oh-new-editor/core';`,
          warning:
            'Editor 实例没有 commands 命名空间。命令作为独立函数导入。',
        },
        {
          title: '标记切换',
          description: '切换文本样式标记的命令。',
          code: `toggleBold();
toggleItalic();
toggleUnderline();
toggleStrike();
toggleCode();`,
        },
        {
          title: '块级变换',
          description: '更改块级节点类型的命令。',
          code: `setHeading(1 | 2 | 3 | 4 | 5 | 6);
toggleBlockquote();
toggleBulletList();
toggleOrderedList();
insertCodeBlock(language?: string);
insertHR();
insertParagraph();`,
        },
        {
          title: '链接和图片',
          description: '插入和编辑链接及图片。',
          code: `toggleLink(href: string); // 仅允许安全的 href
insertImage({ src, alt, title, width, height });`,
        },
        {
          title: '表格和列表',
          description: '控制表格和列表项。',
          code: `insertTable(rows?: number, cols?: number);
liftCurrentListItem();
sinkCurrentListItem();`,
        },
        {
          title: '派发命令',
          description:
            '命令遵循 ProseMirror 的 (state, dispatch, view) 签名。编辑器内部自动派发；手动调用需要 view。',
          code: `editor.on('change', () => {
  // 工具栏同步逻辑
});

// 要手动派发命令，需要 view 引用：
// toggleBold()(state, dispatch, view);`,
        },
      ],
    },
    {
      id: 'schema',
      title: 'Schema 参考',
      description: '文档模型 — 节点、标记和自定义 Schema。',
      sections: [
        {
          title: '内置节点',
          description: '编辑器提供的默认节点类型。',
          code: `doc         // 根文档节点
paragraph   // 普通段落
heading     // 标题 1-6（level 属性）
blockquote  // 块引用
code_block  // 代码块（language 属性）
horizontal_rule  // 水平线
bullet_list      // 无序列表
ordered_list     // 有序列表
list_item        // 列表项
image            // 图片（src, alt, title, width, height）
text             // 文本节点`,
        },
        {
          title: '内置标记',
          description: '编辑器提供的默认标记类型。',
          code: `em         // 斜体
strong     // 粗体
link       // 链接（href, title）
underline  // 下划线
strike     // 删除线
code       // 行内代码
font_size  // 字体大小`,
        },
        {
          title: '表格 Schema',
          description:
            '可从 @oh-new-editor/core/table 导入 tableSchema。设置 options.table 时会自动替换。',
          code: `import { tableSchema } from '@oh-new-editor/core/table';`,
        },
        {
          title: '自定义 Schema',
          description:
            '使用 createEditorSchema(customNodes) 或通过 options.schema 直接传递。',
          code: `import { createEditorSchema } from '@oh-new-editor/core';

const customSchema = createEditorSchema({
  // 添加自定义节点
});

const editor = createEditor(element, {
  schema: customSchema,
});`,
          tip: '要扩展现有节点，请手动组合 Schema 并通过 options.schema 传递。',
        },
      ],
    },
    {
      id: 'html-markdown-io',
      title: 'HTML 和 Markdown 输入输出',
      description: '读取和写入编辑器内容。',
      sections: [
        {
          title: '获取内容',
          description: '调用 editor.getContent() 获取当前文档。',
          code: `// 返回 HTML（默认）
const html = editor.getContent('html');

// 返回 Markdown
const md = editor.getContent('markdown');

// 设置 outputFormat 后可以省略格式参数
editor.setOutputFormat('markdown');
const content = editor.getContent(); // 遵循 outputFormat`,
        },
        {
          title: '设置内容',
          description: '使用 editor.setContent() 替换文档。',
          code: `// 设置 HTML
editor.setContent('<p>Hello</p>', 'html');

// 设置 Markdown
editor.setContent('# Hello', 'markdown');`,
        },
        {
          title: '净化处理',
          description:
            'DOMPurify 在解析和序列化两个阶段都运行。只保留允许的标签和属性。',
          warning:
            '使用 Markdown I/O 需要设置 options.markdown。否则 getContent(\'markdown\') 将抛出 MISSING_MARKDOWN_SUPPORT_ERROR。',
        },
        {
          title: '初始内容',
          description:
            '使用 options.initialContent（而非 content）设置初始文档。根据 outputFormat 解析。',
          code: `const editor = createEditor(element, {
  initialContent: '<p>初始内容</p>',
});`,
        },
      ],
    },
    {
      id: 'markdown',
      title: 'Markdown 支持',
      description: '选择加入的 Markdown 解析和序列化。',
      sections: [
        {
          title: '启用 Markdown',
          description: '使用 createMarkdownSupport() 添加 Markdown 支持。',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';

const editor = createEditor(element, {
  markdown: createMarkdownSupport(),
  outputFormat: 'markdown',
});`,
        },
        {
          title: '解析 Markdown',
          description: '在 editor.setContent() 中指定 \'markdown\' 格式。',
          code: `editor.setContent('# Hello\\n\\nWorld', 'markdown');`,
        },
        {
          title: '序列化为 Markdown',
          description: '调用 editor.getContent(\'markdown\') 提取 Markdown。',
          code: `const md = editor.getContent('markdown');
console.log(md); // "# Hello\\n\\nWorld"`,
        },
        {
          title: 'Markdown 保真度',
          description:
            '下划线和字体大小会保留为内联 HTML。表格序列化为 GFM 管道或原始 HTML。',
          tip: '详细保真度说明请参考 MARKDOWN_LOSS.md。',
        },
      ],
    },
    {
      id: 'table',
      title: '表格支持',
      description: '选择加入的表格编辑功能，带网格选择器和单元格操作。',
      sections: [
        {
          title: '启用表格',
          description: '使用 createTableSupport() 添加表格支持。',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createTableSupport } from '@oh-new-editor/core/table';

const editor = createEditor(element, {
  table: createTableSupport({ maxRows: 12, maxCols: 8 }),
});`,
        },
        {
          title: '插入表格',
          description: '使用 insertTable 命令或工具栏中的网格选择器。',
          code: `import { insertTable } from '@oh-new-editor/core';`,
        },
        {
          title: '表格操作',
          description: '添加/删除行和列、合并/拆分单元格、右键上下文菜单。',
        },
        {
          title: '表格限制',
          description:
            'maxRows/maxCols 在粘贴和插入时限制表格尺寸。',
        },
        {
          title: '表格 Schema',
          description:
            'tableSchema 可导出，启用表格支持时自动替换。',
          code: `import { tableSchema } from '@oh-new-editor/core/table';`,
        },
      ],
    },
    {
      id: 'toolbar-ui',
      title: '工具栏 UI',
      description: '经典固定格式工具栏。',
      sections: [
        {
          title: '启用工具栏',
          description: '使用 createToolbarSupport() 添加固定工具栏。',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import { createNotionSupport } from '@oh-new-editor/core/notion';

const editor = createEditor(element, {
  style: 'toolbar',
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport(),
  },
});`,
        },
        {
          title: '工具栏功能',
          description:
            '粗体/斜体/下划线/删除线/代码、标题 1-6、列表、块引用、代码块、字体大小下拉菜单、链接编辑器、图片上传、表格操作和代码语言选择器。',
        },
        {
          title: '字体大小',
          description:
            '通过 options.fontSizes 配置字体大小列表。默认值：[10,12,14,16,18,20,24,28,32,36,48,64,72]',
          code: `const editor = createEditor(element, {
  fontSizes: [12, 14, 16, 18, 20, 24, 36],
});`,
        },
        {
          title: '只读工具栏',
          description:
            '调用 editor.setReadOnly(true) 时工具栏会自动适应。',
        },
      ],
    },
    {
      id: 'notion-ui',
      title: 'Notion 风格 UI',
      description: '斜杠命令和气泡工具栏。',
      sections: [
        {
          title: '启用 Notion UI',
          description: '使用 createNotionSupport() 添加斜杠命令和气泡工具栏。',
          code: `import { createEditor } from '@oh-new-editor/core';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';

const editor = createEditor(element, {
  style: 'notion',
  styles: {
    toolbar: createToolbarSupport(),
    notion: createNotionSupport(),
  },
});`,
        },
        {
          title: '运行时切换',
          description:
            '运行时使用 editor.setStyle() 在工具栏和 Notion 风格之间切换。',
          code: `editor.setStyle('notion');  // 切换到 Notion 风格
editor.setStyle('toolbar'); // 切换到经典工具栏

const current = editor.getStyle(); // 'toolbar' | 'notion'`,
        },
        {
          title: '斜杠命令',
          description:
            '在空行上输入 / 打开命令菜单，继续输入可过滤命令。',
        },
        {
          title: '气泡工具栏',
          description:
            '选择文本时在选区上方显示浮动格式工具栏。',
        },
        {
          title: '同时使用两种 UI',
          description:
            '在 styles 中同时提供 toolbar 和 notion 以启用运行时切换。',
          code: `editor.setStyle('toolbar'); // 切换到经典
editor.setStyle('notion');  // 切换到 Notion`,
        },
      ],
    },
    {
      id: 'keyboard-shortcuts',
      title: '键盘快捷键和输入规则',
      description: '内置键位绑定和类似 Markdown 的快捷输入。',
      sections: [
        {
          title: '键位绑定表',
          description: '默认键盘快捷键。',
          code: `Mod-b: 粗体                Mod-i: 斜体
Mod-u: 下划线              Shift-Mod-5: 删除线
Mod-\`: 行内代码            Mod-Alt-1/2/3: H1/H2/H3
Mod-Shift-7: 有序列表      Mod-Shift-8: 无序列表
Mod-Alt-0: 块引用          Mod-Alt--: 水平线
Shift-Ctrl-\\: 代码块      Mod-z: 撤销
Shift-Mod-z / Mod-y: 重做
Tab: 列表缩进              Shift-Tab: 列表减少缩进
Enter: 新段落（优先退出代码块）`,
          tip: 'Mod 在 macOS 上是 Cmd，在 Windows/Linux 上是 Ctrl。',
        },
        {
          title: '输入规则',
          description: '类似 Markdown 的自动转换规则。',
          code: `**text** → 粗体       *text* → 斜体
~~text~~ → 删除线     \`code\` → 行内代码
[text](url) → 链接

# → H1    ## → H2   ### → H3   （直到 ######）
> → 块引用       - → 无序列表
* → 无序列表      1. → 有序列表
--- → 水平线     \`\`\` → 代码块`,
        },
      ],
    },
    {
      id: 'image-upload',
      title: '图片上传',
      description: '拖放、粘贴和选择图片上传流程。',
      sections: [
        {
          title: '配置上传',
          description: '通过 options.image 配置上传处理器和限制。',
          code: `const editor = createEditor(element, {
  image: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await res.json();
      return url;
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  },
});`,
        },
        {
          title: '上传触发方式',
          description:
            '拖放、从剪贴板粘贴以及工具栏图片按钮均可触发上传。',
        },
        {
          title: '上传体验',
          description:
            '上传中显示 "正在上传 filename…" 占位符，失败时显示重试按钮，双击图片可设置替代文本。',
        },
        {
          title: '图片节点',
          description:
            '图片节点支持 src、alt、title、width 和 height 属性。',
        },
      ],
    },
    {
      id: 'ai',
      title: 'AI 集成',
      description: 'AI 驱动的文本生成和流式输出。',
      sections: [
        {
          title: '基本 AI 设置',
          description: '通过 options.ai.onGenerate 注册 AI 生成函数。',
          code: `const editor = createEditor(element, {
  ai: {
    onGenerate: async (prompt, context, signal) => {
      const res = await fetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify({ prompt, context }),
        signal,
      });
      return (await res.json()).text;
    },
  },
});

// 触发生成
await editor.ai?.generate('Write a summary');`,
        },
        {
          title: '流式输出',
          description:
            '当 onStream 返回 AsyncIterable<string> 时，内容块会逐个插入，生成过程中编辑器锁定。',
        },
        {
          title: 'AI 上下文',
          description:
            'AIContext 包含 documentContent、selectedText、textBefore、textAfter、cursorOffset 和 outputFormat。',
        },
        {
          title: '取消与撤销',
          description:
            '调用 editor.ai?.cancel() 删除流式生成的范围。完成时创建历史记录边界。',
          warning:
            'AI 生成期间编辑器变为只读模式。取消后可恢复编辑。',
        },
      ],
    },
    {
      id: 'theming',
      title: '主题和样式',
      description: '深色模式、CSS 自定义属性和类钩子。',
      sections: [
        {
          title: '深色模式',
          description:
            '在容器元素上设置 data-theme="dark" 属性，CSS 自定义属性会相应响应。',
          code: `<!-- 启用深色模式 -->
<div data-theme="dark">
  <div id="editor"></div>
</div>`,
          tip: '在网站演示中，我们将 data-theme 与 Tailwind 的 dark 类同步。',
        },
        {
          title: 'CSS 类钩子',
          description: '编辑器暴露的 CSS 类。',
          code: `.oh-editor              — 编辑器根元素
.oh-editor__content     — 内容区域
.oh-editor__placeholder — 空状态占位文本
.oh-editor__upload-placeholder--uploading  — 上传中
.oh-editor__upload-placeholder--error      — 上传失败`,
        },
        {
          title: '样式导入',
          description: '导入编辑器基础样式。',
          code: `import '@oh-new-editor/core/style.css';`,
        },
        {
          title: '自定义样式',
          description:
            '覆盖 CSS 自定义属性或添加自定义 CSS 类以进行完全自定义。',
        },
      ],
    },
    {
      id: 'sanitization',
      title: '消毒和安全',
      description: 'XSS 防护、HTML 白名单和安全链接。',
      sections: [
        {
          title: '消毒流程',
          description:
            '解析：输入 → sanitizeHtml → DOM 解析 → 文档。序列化：文档 → DOM → sanitizeHtml → 输出。DOMPurify 使用严格白名单运行。',
        },
        {
          title: '允许的标签',
          description: '白名单中允许的 HTML 标签。',
          code: `a, blockquote, br, code, del, em, h1-h6, hr, img,
li, ol, p, pre, s, span, strong, table, tbody,
td, th, thead, tr, u, ul`,
        },
        {
          title: '允许的属性',
          description: '白名单中允许的 HTML 属性。',
          code: `alt, colspan, data-language, height, href,
rowspan, src, style, title, width`,
        },
        {
          title: '安全链接',
          description:
            'isSafeHref 只允许 http:、https:、mailto: 和 tel: 协议。',
        },
        {
          title: 'CSS 属性过滤',
          description:
            '内联样式中只允许 font-size 和 background-color。',
        },
      ],
    },
    {
      id: 'framework-adapters',
      title: '框架适配器',
      description: 'React、Vue 和 Svelte 组件 API。',
      sections: [
        {
          title: 'React',
          description:
            'OhNewEditor 是一个 forwardRef 组件。属性：value、onChange、options。ref 暴露 Editor 实例。',
          code: `import { useRef } from 'react';
import { OhNewEditor, type OhNewEditorRef } from '@oh-new-editor/react';

function App() {
  const editorRef = useRef<OhNewEditorRef>(null);

  return (
    <OhNewEditor
      ref={editorRef}
      value="<p>Hello</p>"
      onChange={(html) => console.log(html)}
      options={{ placeholder: 'Start typing…' }}
    />
  );
}`,
        },
        {
          title: 'Vue 3',
          description:
            'OhNewEditor 是一个 defineComponent。属性：modelValue、options。触发事件：update:modelValue、change。暴露：{ editor }。',
          code: `<template>
  <OhNewEditor
    v-model="content"
    :options="{ placeholder: 'Start typing…' }"
  />
</template>

<script setup>
import { ref } from 'vue';
import { OhNewEditor } from '@oh-new-editor/vue';

const content = ref('<p>Hello</p>');
</script>`,
        },
        {
          title: 'Svelte',
          description:
            'OhNewEditor.svelte 接收 value 和 options 属性，并派发 change 事件（detail 为 HTML 字符串）。',
          code: `<script>
  import { OhNewEditor } from '@oh-new-editor/svelte';

  let content = '<p>Hello</p>';
</script>

<OhNewEditor
  bind:value={content}
  options={{ placeholder: 'Start typing…' }}
  on:change={(e) => console.log(e.detail)}
/>`,
        },
        {
          title: '受控模式',
          description:
            'React 使用 value/onChange，Vue 使用 v-model，Svelte 使用 bind:value。编辑器聚焦时跳过内容同步。',
          tip: '所有适配器都是 createEditor 的轻量包装。底层 Editor 实例始终可访问。',
        },
      ],
    },
    {
      id: 'advanced',
      title: '高级：插件和自定义 Schema',
      description: '使用自定义 ProseMirror 插件和 Schema 扩展编辑器。',
      sections: [
        {
          title: '自定义插件',
          description:
            '通过 options.plugins 传递 ProseMirror 插件。它们在内置插件之后追加。',
          code: `import { Plugin } from 'prosemirror-state';

const myPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.key === 'Enter') {
        console.log('Enter pressed');
        return false; // 保留默认行为
      }
      return false;
    },
  },
});

const editor = createEditor(element, {
  plugins: [myPlugin],
});`,
        },
        {
          title: '自定义 Schema',
          description:
            '使用 createEditorSchema 和 options.schema 添加或扩展节点和标记。',
          code: `import { createEditorSchema } from '@oh-new-editor/core';
import { Schema } from 'prosemirror-model';

const customSchema = createEditorSchema({
  // 自定义节点定义
});

const editor = createEditor(element, {
  schema: customSchema,
});`,
        },
        {
          title: '功能工厂',
          description:
            '构建自己的功能时遵循 createXSupport() 模式。',
          tip: '参考核心包的插件文件（imageUpload.ts、inputRules.ts 等）了解实现模式。',
        },
      ],
    },
  ],
};
