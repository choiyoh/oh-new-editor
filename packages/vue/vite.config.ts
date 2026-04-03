import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OhNewEditorVue',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs')
    },
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ['vue', '@oh-new-editor/core']
    }
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
