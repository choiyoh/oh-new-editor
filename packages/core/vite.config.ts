import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        markdown: resolve(__dirname, 'src/markdown.ts'),
        notion: resolve(__dirname, 'src/notion.ts'),
        table: resolve(__dirname, 'src/table.ts'),
        toolbar: resolve(__dirname, 'src/toolbar.ts')
      },
      name: 'OhNewEditorCore',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs';
        return `${entryName}.${ext}`;
      },
      cssFileName: 'style'
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
