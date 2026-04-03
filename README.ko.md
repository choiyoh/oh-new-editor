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

## 개발

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm --filter @oh-new-editor/core test
pnpm dev
```

## 참고

- `@oh-new-editor/core`는 의도적으로 headless입니다.
- Markdown 지원은 `@oh-new-editor/core/markdown`를 통해 opt-in 방식으로 제공됩니다.
- 테이블 지원은 `@oh-new-editor/core/table`를 통해 opt-in 방식으로 제공됩니다.
- Toolbar/Notion UI는 `@oh-new-editor/core/toolbar`, `@oh-new-editor/core/notion`을 통해 opt-in 방식으로 제공됩니다.
- Code block language selector는 구현되어 있지만 syntax highlighting은 아직 포함되어 있지 않습니다.
- 일부 기능은 markdown 출력 시 손실될 수 있으며, 자세한 내용은 `MARKDOWN_LOSS.md`를 참고하세요.
