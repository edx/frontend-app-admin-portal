# Rule for rendered HTML

IMPORTANT: Use semantic HTML only.

## Semantic HTML

*Context: Proper HTML is the foundation of accessibility for screen readers and search engines.*

Semantic elements convey meaning to screen readers that CSS classes don't.

- MUST use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<a>`) over generic `<div>`
- MUST use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<a>`) instead of using `role=` to repurpose non-semantic elements (for example, avoid `<div role="button">` when a `<button>` would work)
- MUST nest headings (`<h1>`–`<h6>`) sequentially without skipping levels
- MUST identify the main language of the page in the `<html>` tag
- MUST apply `dir` attribute as necessary on page or page parts that require a right-to-left direction.
- MUST use unique `id` attributes for active elements on the same page
- MUST structure content order in the code to match the visual order
- MUST ensure interactive elements have borders or distinct outlines to remain visible in Windows High Contrast / Forced Colors mode
- MUST use `<del>` for strikethrough/deleted text, not just `class="line-through"`
- MUST use `<ins>` for inserted text
- MUST use `<mark>` for highlighted text
- SHOULD use landmarks (`<header>`, `<aside>`, `<footer>`) to define page regions
- SHOULD use lists (`<ul>`, `<ol>`, `<dl>`) for grouped items to convey structure
- SHOULD use tables strictly for tabular data, not for layout
- NEVER use headings solely for visual sizing (use CSS instead)
- NEVER duplicate IDs on a single page
- NEVER block the ability to zoom text up to 400%

## Accessibility rules

All rendered HTML must follow our accessibility guidance and pass our accessibility tests.

See also skills/accessibility.md
