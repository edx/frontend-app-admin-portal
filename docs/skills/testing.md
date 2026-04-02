#### Accessibility unit tests (required)

- Accessibility unit tests are required for UI components and page-level units, and they must use axe-core.
- For every new/changed page-level unit and reusable interactive UI component, include at least one axe-core test.
- Unless otherwise specified, configure checks for WCAG 2.1 AA and also track WCAG 2.2 AA and best-practice rules.
- Accessibility test PRs should fail when axe-core reports violations unless there is an explicitly documented temporary exception.
- If a Lighthouse-related API key is available in this repository, add a Lighthouse accessibility audit to automated tests and CI.
  - A passing Lighthouse accessibility audit score will be >= 90

See also: skills/accessibility.md, docs/skills/resources/wcag-aa.pdf
