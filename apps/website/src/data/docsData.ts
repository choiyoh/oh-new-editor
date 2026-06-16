export interface DocChapter {
  id: string;
  title: string;
  description: string;
  sections: Array<{
    title: string;
    description?: string;
    code?: string;
  }>;
}

export interface DocsData {
  ko: Array<DocChapter>;
  en: Array<DocChapter>;
}

export const docsData: DocsData = {
  ko: [
    {
      id: 'getting-started',
      title: '시작하기 (Getting Started)',
      description: 'Oh New Editor는 프레임워크에 구애받지 않는 가볍고 강력한 헤드리스 리치 텍스트 에디터 툴킷입니다.',
      sections: [
        {
          title: '패키지 설치',
          description: 'pnpm, npm 또는 yarn을 사용해 코어 패키지를 프로젝트에 설치합니다.',
          code: 'pnpm add @oh-new-editor/core'
        },
        {
          title: '기본 에디터 초기화',
          description: 'DOM 요소가 로드된 시점에 createEditor를 사용하여 에디터를 간단하게 생성할 수 있습니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import '@oh-new-editor/core/style.css'; // 기본 에디터 스타일 임포트

const editor = createEditor({
  element: document.querySelector('#editor')!,
  content: '<p>안녕하세요, Oh New Editor입니다!</p>',
  onChange: (html) => {
    console.log('콘텐츠 변경됨:', html);
  }
});`
        }
      ]
    },
    {
      id: 'core-api',
      title: '코어 에디터 API (Core Editor)',
      description: '에디터 인스턴스 생성 옵션과 주요 라이프사이클 이벤트를 다룹니다.',
      sections: [
        {
          title: '에디터 옵션 (EditorOptions)',
          description: 'createEditor 호출 시 전달할 수 있는 세부 설정 항목들입니다.',
          code: `interface EditorOptions {
  element: HTMLElement;       // 마운트할 DOM 요소 (필수)
  content?: string;           // 초기 HTML 또는 마크다운 내용
  editable?: boolean;         // 읽기 전용 여부 (기본값: true)
  onChange?: (html: string) => void; // 내용이 변경될 때의 콜백
  onFocus?: () => void;       // 에디터 포커스 이벤트
  onBlur?: () => void;        // 에디터 포커스 아웃 이벤트
}`
        },
        {
          title: '명령어 실행 (Commands)',
          description: '에디터 인스턴스를 통해 다양한 서식 텍스트 명령어를 실행할 수 있습니다.',
          code: `// 글자 굵게 처리
editor.commands.toggleBold();

// 제목 1(h1)으로 변환
editor.commands.toggleHeading(1);

// 링크 삽입
editor.commands.setLink('https://github.com');`
        }
      ]
    },
    {
      id: 'markdown',
      title: '마크다운 지원 (Markdown Support)',
      description: '마크다운 구문을 실시간으로 파싱하고 에디터 콘텐츠를 마크다운 텍스트로 내보내는 모듈입니다.',
      sections: [
        {
          title: '마크다운 플러그인 로드',
          description: 'core의 markdown 플러그인을 활성화하면, 사용자가 타이핑하는 마크다운 단축키(예: # 입력 후 스페이스)를 실시간 서식으로 변환해줍니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { markdown } from '@oh-new-editor/core/markdown';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  plugins: [markdown()]
});`
        },
        {
          title: '마크다운 직렬화 (Serialization)',
          description: '에디터의 리치 텍스트 데이터를 깨끗한 마크다운 원고 형식으로 즉시 반환받을 수 있습니다.',
          code: `// 현재 작성된 문서를 마크다운으로 변환하여 가져오기
const markdownText = editor.getMarkdown();
console.log(markdownText);`
        }
      ]
    },
    {
      id: 'table',
      title: '표 편집 (Table Editing)',
      description: '그리드 기반의 표를 동적으로 삽입하고 행과 열을 확장/삭제할 수 있는 강력한 표 모듈입니다.',
      sections: [
        {
          title: '표 플러그인 장착',
          description: '표 조작을 위한 전용 스키마와 ProseMirror 테이블 핸들러 플러그인을 연동합니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { table } from '@oh-new-editor/core/table';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  plugins: [table()]
});`
        },
        {
          title: '테이블 제어 명령어',
          description: '행/열의 추가, 삭제 및 셀 병합 등을 스크립트로 제어합니다.',
          code: `// 3행 3열의 표 생성 및 삽입
editor.commands.insertTable({ rows: 3, cols: 3 });

// 현재 셀 우측에 열 추가
editor.commands.addColumnAfter();

// 현재 행 삭제
editor.commands.deleteRow();`
        }
      ]
    },
    {
      id: 'notion-slash',
      title: '노션 스타일 커맨드 (Notion Commands)',
      description: '새 문단에서 슬래시(/)를 입력하면 나타나는 단축 명령 도구 상자 플러그인입니다.',
      sections: [
        {
          title: '슬래시 플러그인 활성화',
          description: 'notion 플러그인을 추가하여 현대적인 에디터에 필수적인 커맨드 메뉴 인터페이스를 탑재합니다.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { notion } from '@oh-new-editor/core/notion';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  plugins: [notion({
    // 커스텀 메뉴 아이템을 배열로 전달할 수도 있습니다.
    onTrigger: (query) => {
      console.log('슬래시 메뉴 트리거됨, 검색어:', query);
    }
  })]
});`
        }
      ]
    },
    {
      id: 'toolbar-sync',
      title: '툴바 동기화 (Toolbar Controller)',
      description: '에디터 커서가 있는 곳의 스타일 상태(Bold 여부, Heading 크기 등)를 툴바 버튼과 동기화합니다.',
      sections: [
        {
          title: '툴바 상태 모니터링',
          description: 'onStateChange 이벤트를 이용해 커서의 서식 상태를 실시간으로 가져와 UI에 반영할 수 있습니다.',
          code: `import { createEditor } from '@oh-new-editor/core';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  onStateChange: (state) => {
    // 현재 커서가 있는 위치에 굵게(Bold) 스타일이 적용되어 있는지 확인
    const isBoldActive = state.active.bold;
    const isItalicActive = state.active.italic;
    
    // 이 상태값들을 UI 버튼의 Active 클래스로 맵핑하여 사용합니다.
    updateToolbarUI({ isBoldActive, isItalicActive });
  }
});`
        }
      ]
    }
  ],
  en: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Oh New Editor is a framework-agnostic, lightweight, and powerful headless rich-text editor toolkit.',
      sections: [
        {
          title: 'Installation',
          description: 'Install the core package using pnpm, npm, or yarn.',
          code: 'pnpm add @oh-new-editor/core'
        },
        {
          title: 'Basic Initialization',
          description: 'Instantiate your editor quickly inside any DOM element using createEditor.',
          code: `import { createEditor } from '@oh-new-editor/core';
import '@oh-new-editor/core/style.css'; // Import base styles

const editor = createEditor({
  element: document.querySelector('#editor')!,
  content: '<p>Hello, Oh New Editor!</p>',
  onChange: (html) => {
    console.log('Content changed:', html);
  }
});`
        }
      ]
    },
    {
      id: 'core-api',
      title: 'Core Editor API',
      description: 'Details of editor instantiation options and lifecycle events.',
      sections: [
        {
          title: 'Editor Options',
          description: 'Configurations you can pass to createEditor.',
          code: `interface EditorOptions {
  element: HTMLElement;       // DOM element to mount (required)
  content?: string;           // Initial HTML or Markdown content
  editable?: boolean;         // Editable state (default: true)
  onChange?: (html: string) => void; // Change event callback
  onFocus?: () => void;       // Focus event callback
  onBlur?: () => void;        // Blur event callback
}`
        },
        {
          title: 'Executing Commands',
          description: 'Format document text programmatically using commands.',
          code: `// Bold selected text
editor.commands.toggleBold();

// Toggle current node into Heading 1
editor.commands.toggleHeading(1);

// Set link to current selection
editor.commands.setLink('https://github.com');`
        }
      ]
    },
    {
      id: 'markdown',
      title: 'Markdown Support',
      description: 'Real-time markdown shortcuts parsing and clean markdown output serialization.',
      sections: [
        {
          title: 'Enabling Markdown Plugin',
          description: 'Include the markdown plugin to allow real-time shortcuts like typing "# " to create a header.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { markdown } from '@oh-new-editor/core/markdown';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  plugins: [markdown()]
});`
        },
        {
          title: 'Markdown Serialization',
          description: 'Retrieve editor contents formatted as a markdown string.',
          code: `// Extract current document as Markdown
const markdownText = editor.getMarkdown();
console.log(markdownText);`
        }
      ]
    },
    {
      id: 'table',
      title: 'Table Editing',
      description: 'Robust tables support with dynamic row/column management and cells merging.',
      sections: [
        {
          title: 'Adding Table Module',
          description: 'Wire up table schema rules and ProseMirror table handling plugins.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { table } from '@oh-new-editor/core/table';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  plugins: [table()]
});`
        },
        {
          title: 'Table Control Commands',
          description: 'Programmatically control columns/rows append, prepend, or deletion.',
          code: `// Insert a 3x3 table
editor.commands.insertTable({ rows: 3, cols: 3 });

// Add a column after the active cell
editor.commands.addColumnAfter();

// Delete active row
editor.commands.deleteRow();`
        }
      ]
    },
    {
      id: 'notion-slash',
      title: 'Notion-Style Commands',
      description: 'Slash commands trigger plugin providing inline commands helper popups.',
      sections: [
        {
          title: 'Enable Notion Plugin',
          description: 'Load the notion plugin to support modern slash command dropdown lists.',
          code: `import { createEditor } from '@oh-new-editor/core';
import { notion } from '@oh-new-editor/core/notion';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  plugins: [notion({
    onTrigger: (query) => {
      console.log('Slash triggered, search query:', query);
    }
  })]
});`
        }
      ]
    },
    {
      id: 'toolbar-sync',
      title: 'Toolbar Controller',
      description: 'Keep formatting toolbar buttons active states synchronized with editor selection.',
      sections: [
        {
          title: 'Listening to State Changes',
          description: 'Listen to onStateChange to capture cursor active marks and apply active CSS classes.',
          code: `import { createEditor } from '@oh-new-editor/core';

const editor = createEditor({
  element: document.querySelector('#editor')!,
  onStateChange: (state) => {
    // Check if bold formatting is active under the cursor
    const isBoldActive = state.active.bold;
    const isItalicActive = state.active.italic;
    
    // Map these variables to your frontend toolbar component
    updateToolbarUI({ isBoldActive, isItalicActive });
  }
});`
        }
      ]
    }
  ]
};
