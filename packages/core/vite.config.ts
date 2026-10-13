import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// 의존성은 번들에 넣지 않는다 — 호스트 앱이 ProseMirror 를 직접 확장할 때 클래스 인스턴스가 둘로 갈라지지 않게 한다.
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
const externals = Object.keys(pkg.dependencies ?? {});

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        markdown: resolve(__dirname, 'src/markdown.ts'),
        notion: resolve(__dirname, 'src/notion.ts'),
        table: resolve(__dirname, 'src/table.ts'),
        toolbar: resolve(__dirname, 'src/toolbar.ts'),
        ai: resolve(__dirname, 'src/ai.ts')
      },
      name: 'OhNewEditorCore',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs';
        return `${entryName}.${ext}`;
      },
      cssFileName: 'style'
    },
    rollupOptions: {
      external: (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`))
    },
    sourcemap: true,
    emptyOutDir: true
  },
  plugins: [
    dts({
      include: ['src'],
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
      rollupTypes: false
    })
  ]
});
