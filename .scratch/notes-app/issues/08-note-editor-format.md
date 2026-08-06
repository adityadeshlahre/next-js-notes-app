# 08 — Note editor format

Type: grilling
Status: resolved
Blocked by:

## Question

How is a note's body authored and rendered?

Options:

- **Plain textarea + `whitespace-pre-wrap` rendering** (recommended): matches the assignment's "title + body", zero dependencies, keyboard-accessible by default.
- **Markdown**: nicer output but needs a renderer + escaping decisions, and the assignment never asks for it.
- **Rich text (Tiptap etc.)**: dependency weight, a11y burden — out of scope unless you want it.

## Answer

**Plain textarea + `whitespace-pre-wrap` rendering.** Title input + body textarea; body rendered read-only with `whitespace-pre-wrap`. Zero dependencies, keyboard-accessible by default, matches the assignment's "title + body" exactly. Unblocks ui-layout.
