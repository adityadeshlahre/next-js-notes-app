# 08 — Note editor format

Type: grilling
Status: open
Blocked by:

## Question

How is a note's body authored and rendered?

Options:

- **Plain textarea + `whitespace-pre-wrap` rendering** (recommended): matches the assignment's "title + body", zero dependencies, keyboard-accessible by default.
- **Markdown**: nicer output but needs a renderer + escaping decisions, and the assignment never asks for it.
- **Rich text (Tiptap etc.)**: dependency weight, a11y burden — out of scope unless you want it.
