import { resolve } from 'node:path';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OhNewEditorSvelte',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs')
    },
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => /^(svelte|@oh-new-editor\/core)(\/|$)/.test(id),
      output: { exports: 'named' }
    }
  },
  plugins: [svelte()]
});
