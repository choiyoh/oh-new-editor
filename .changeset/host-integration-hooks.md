---
'@oh-new-editor/core': minor
---

호스트 앱이 에디터를 확장할 수 있는 훅을 추가한다.

- `EditorOptions.priorityPlugins`: 내장 키맵보다 먼저 등록되는 플러그인(자동완성·Enter/Backspace 처리 등)
- `EditorOptions.nodeViews`: 노드 타입별 커스텀 NodeView
- `EditorOptions.resolveImageSrc`: 저장된 이미지 `src` 를 렌더 시점에 로드 가능한 URL 로 변환
- `EditorOptions.prompt`: 이미지 대체 텍스트 입력에 쓰는 비동기 프롬프트(`window.prompt` 가 없는 Electron 용)
- `EditorImageOptions.altText`: 업로드한 이미지의 alt 생성 규칙
- `Editor.getView()` / `getDocument()` / `setDocument(doc, { silent })`: 문서를 통째로 불러오기
- `createNotionSupport({ slashItems })`: 슬래시 메뉴에 항목 추가(`SlashItemSpec`)

빌드: `dependencies` 에 선언된 패키지(prosemirror-*, marked, turndown, dompurify)를 번들에 포함하지 않고 외부 의존성으로 둔다. 번들에 들어 있으면 호스트 앱이 가져온 ProseMirror 와 클래스 인스턴스가 둘로 갈라져(`OrderedMap`, `Schema`, `PluginKey` …) 스키마·플러그인을 확장할 수 없었다.
