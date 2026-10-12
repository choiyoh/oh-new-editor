---
"@oh-new-editor/core": patch
"@oh-new-editor/react": patch
"@oh-new-editor/vue": patch
"@oh-new-editor/svelte": patch
---

Add configurable editor UI messages with Korean and Simplified Chinese presets, improve keyboard navigation and link editing, and fix input rules, image upload, bubble menu, and Markdown behavior.

Fix adapter refs and callbacks, defer external content updates until blur, and discard superseded deferred values so the latest content is preserved.

Keep React and Svelte runtimes external to the published adapters, fix React/Vue declaration entrypoints, allow core imports during server rendering, ship Svelte source and generated declarations for SSR compilation, and include package usage documentation and MIT license metadata.
