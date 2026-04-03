# Markdown Loss Matrix

`@oh-new-editor/core` keeps ProseMirror as the source of truth. Markdown output is a serialized view and can be lossy.

| Feature | Markdown output | Notes |
|---|---|---|
| Bold / italic / strike / code | Native markdown | Preserved |
| Headings / blockquote / lists / HR | Native markdown | Preserved |
| Links | Native markdown | Safe schemes only |
| Code block language | Fenced code block | Language preserved in fence info string |
| Images | `![alt](src "title")` | Width / height dropped |
| Underline | Inline HTML fallback | `<u>...</u>` |
| Font size | Inline HTML fallback | `<span style="font-size: Npx">...</span>` |
| Tables without merged cells | GFM table | Cell block structure flattened to text |
| Merged cells / rowspan / colspan | Raw HTML fallback | Markdown has no faithful equivalent |
| Cell background color | Lost in markdown table mode | Preserved only when raw HTML fallback is used |

Use `getContent('html')` when exact fidelity matters.
