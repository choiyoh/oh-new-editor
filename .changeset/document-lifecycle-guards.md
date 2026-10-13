---
'@oh-new-editor/core': patch
---

Cancel pending AI requests when replacing editor content, isolate cleanup from superseded requests, validate document schema before replacement, and prevent image resize gestures from modifying read-only content.

Block image paste, drop, retry and late upload insertion in read-only editors. Report rejected UI prompts and slash commands through `EditorOptions.onError`, and stop disposed slash UIs from restoring focus. Make completed AI results undoable as one edit while keeping cancelled stream previews out of history.
