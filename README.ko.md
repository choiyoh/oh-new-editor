# Oh New Editor

ProseMirror 기반의 프레임워크 비종속 리치 텍스트 에디터 패키지 모음입니다.

[English README](./README.md)

## 개요

Oh New Editor는 headless 코어와 선택형 UI/기능 모듈을 제공하여, 바닐라 JavaScript·React·Vue·Svelte 환경에서 동일한 편집 경험을 구성할 수 있도록 설계되어 있습니다.

## 패키지 구성

- `@oh-new-editor/core` — headless editor core
- `@oh-new-editor/core/toolbar` — 고정형 toolbar UI
- `@oh-new-editor/core/notion` — slash menu + bubble toolbar UI
- `@oh-new-editor/core/table` — 테이블 schema 및 편집 기능
- `@oh-new-editor/core/markdown` — markdown 파싱/직렬화 기능
- `@oh-new-editor/react` — React wrapper
- `@oh-new-editor/vue` — Vue wrapper
- `@oh-new-editor/svelte` — Svelte wrapper

## 주요 기능

- Sanitized HTML 입력/출력
- 선택형 markdown 입력/출력
- Toolbar 스타일과 Notion 스타일 UI
- 이미지 업로드, drag-and-drop, retry, alt text, resize handle
- 테이블 삽입, resize, merge/split, row/column 조작, size guard
- CSS custom properties 및 `data-theme="dark"` 기반 다크 모드
- React / Vue / Svelte용 thin adapter

## 설치

```bash
pnpm add @oh-new-editor/core
```

선택 기능은 필요할 때 subpath export로 가져오면 됩니다.

## 빠른 시작

### Headless core + toolbar

```ts
import { createEditor } from '@oh-new-editor/core';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import { createTableSupport } from '@oh-new-editor/core/table';
import { createMarkdownSupport } from '@oh-new-editor/core/markdown';
import '@oh-new-editor/core/style.css';

const editor = createEditor(document.getElementById('editor')!, {
  toolbar: createToolbarSupport(),
  table: createTableSupport({ maxRows: 50, maxCols: 20 }),
  markdown: createMarkdownSupport(),
  placeholder: 'Write something…',
  image: {
    upload: async (file) => {
      const url = await uploadFileSomewhere(file);
      return url;
    }
  },
  initialContent: '<p>Hello</p>'
});
```

### Notion 스타일 UI

```ts
import { createEditor } from '@oh-new-editor/core';
import { createNotionSupport } from '@oh-new-editor/core/notion';
import { createTableSupport } from '@oh-new-editor/core/table';
import '@oh-new-editor/core/style.css';

createEditor(document.getElementById('editor')!, {
  toolbar: createNotionSupport(),
  table: createTableSupport()
});
```

## 프레임워크 어댑터

### React

```tsx
import { OhNewEditor } from '@oh-new-editor/react';
import { createToolbarSupport } from '@oh-new-editor/core/toolbar';
import '@oh-new-editor/core/style.css';

export function Example() {
  return <OhNewEditor options={{ toolbar: createToolbarSupport() }} />;
}
```

### Vue

```ts
import { OhNewEditor } from '@oh-new-editor/vue';
```

### Svelte

```ts
import { OhNewEditor } from '@oh-new-editor/svelte';
```

## Core API

```ts
const editor = createEditor(element, options);

editor.getContent('html');
editor.getContent('markdown');
editor.setContent('<p>Hello</p>', 'html');
editor.setOutputFormat('markdown');
editor.setReadOnly(true);
editor.on('change', () => {});
editor.destroy();
```

## 테마

core stylesheet를 import한 뒤 토큰을 override하면 됩니다.

```css
.my-editor-scope {
  --oh-editor-bg: #ffffff;
  --oh-editor-primary: #7c3aed;
}

[data-theme='dark'] {
  --oh-editor-bg: #0f172a;
}
```

조상 요소에 `data-theme="dark"`를 지정하면 다크 팔레트가, `data-theme="system"`을 지정하면 OS 설정을 따릅니다.

## 다국어

내장 UI는 기본적으로 영어 문자열을 사용합니다. 프리셋이나 일부 문자열만 바꿔서 전달할 수 있습니다.

```ts
import { createEditor, messagesKo } from '@oh-new-editor/core';

createEditor(element, { messages: messagesKo });
createEditor(element, { messages: { bold: '진하게' } });
```

프리셋: `messagesKo`, `messagesZhCN`. 슬래시 명령 검색은 UI 언어와 관계없이 영어·한국어(`ㅈㅁ` 같은 초성 포함)·중국어 키워드를 모두 인식합니다.

## 접근성

툴바, 버블 메뉴, 표 메뉴, 링크 편집기는 키보드로 조작할 수 있습니다. 툴바는 탭 정지 하나에 방향키 이동을 쓰고, 버튼은 Enter/Space로 실행되며, 표 셀 안에서 Shift+F10 / 메뉴 키로 표 메뉴를 열 수 있습니다.

## 개발

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm --filter @oh-new-editor/core test
pnpm dev
```

## 참고

배포 검증과 계정 설정은 [릴리스 가이드](./docs/RELEASING.md)를 참고하세요. CI는 소스 테스트 외에도 실제 배포용 tarball을 별도 소비자 프로젝트에 설치하여 검증합니다.

서버에서도 패키지를 import할 수 있습니다. 편집기 생성과 HTML 처리는 브라우저 DOM이 필요합니다. React·Vue는 클라이언트에서 편집기를 생성하고, Svelte를 지원하는 번들러는 소스 export를 사용해 서버·클라이언트용으로 각각 컴파일합니다.

- `@oh-new-editor/core`는 의도적으로 headless입니다.
- Markdown 지원은 `@oh-new-editor/core/markdown`를 통해 opt-in 방식으로 제공됩니다.
- 테이블 지원은 `@oh-new-editor/core/table`를 통해 opt-in 방식으로 제공됩니다.
- Toolbar/Notion UI는 `@oh-new-editor/core/toolbar`, `@oh-new-editor/core/notion`을 통해 opt-in 방식으로 제공됩니다.
- Code block language selector는 구현되어 있지만 syntax highlighting은 아직 포함되어 있지 않습니다.
- 일부 기능은 markdown 출력 시 손실될 수 있으며, 자세한 내용은 `MARKDOWN_LOSS.md`를 참고하세요.
