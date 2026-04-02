# Accessibility Rules

Apply these rules to ALL UI code you generate or modify.

Our corporate policies and contracts with our partners MANDATE WCAG 2.1 AA compliance across all of our sites.

1. All pages MUST be WCAG 2.1 AA compliant.
2. All pages SHOULD be WCAG 2.2 AA compliant.

The following sections are not comprehensive. Enforce all of these requirements, but also the rest of WCAG 2.2 AA.

## Rules

### Semantics

- MUST use native HTML elements when available
- MUST only use ARIA when necessary to fill a gap in native HTML semantics
  - For example, use `<button>` instead of `role="button"` on a `<div>`, and use alt="" instead of `role="presentation"` on an `<img>` that is decorative.
- NEVER use ARIA to fix underlying semantic HTML issues - fix the HTML instead.
  - SHOULD avoid `role="presentation"` and `role="none"`
  - SHOULD avoid `role="application"`
- MUST use `aria-live="polite"` to announce updates (toast notifications, form validation, loading states)
- MUST manage focus when content changes: after navigation, move focus to the new page heading or main content
- MUST ensure content follows a logical linear layout
- MUST include navigation landmarks so users can jump content blocks
- MUST update `aria-expanded` or `aria-hidden` states dynamically via JS
- SHOULD avoid repetitive labels (e.g., repeating the same image caption)
- NEVER use ARIA attributes on elements that don't support them

### Resilience & Edge Cases

- MUST design the full UI stack: blank, loading, partial, error, and ideal states
- MUST allow users to override validators or add options manually
- SHOULD design for extreme scales (extra long/short names, offline mode, slow data)
- NEVER use generic error messages; explain what happened
- NEVER assume data will fit the "ideal" state layout

### Keyboard Navigation & Focus

- MUST ensure all interactive elements are focusable via `Tab` key
- MUST follow a logical tab order (left-to-right, top-to-bottom)
- MUST provide a visible, high-contrast focus indicator for active elements
- MUST guarantee that any element which receives focus is visible and operable
- MUST allow users to navigate into and out of all UI components (no keyboard traps)
- MUST ensure that a modal that covers page content traps focus until it is dismissed
- MUST move focus to any newly-opened modal that covers page content
- SHOULD support `Escape` to close overlays
- SHOULD return focus to the trigger element when a modal closes
- NEVER remove the browser default focus ring (`outline: none`) without a replacement
- NEVER rely on hover states that aren't accessible via keyboard focus

### Images
- MUST provide a textual alternative for all non-decorative images
  - If an image is not a link, and its alt text matches the text rendered immediately before or after the image, it can be considered decorative and hidden from screen readers with `alt=""`.
  - NEVER convey any information solely with the image or color
- MUST hide decorative visual elements
  - MAY do this with `aria-hidden="true"`
  - Examples: checkmarks in lists, decorative emojis, individual stars in ratings
- MUST only hide content that doesn't add meaning
- SHOULD avoid filler words in alt text ("image of", "picture of", "screenshot of")

### Icon Buttons and Controls
- NEVER rely on icons alone for meaning
  - MAY use `aria-label` to provide descriptive text for icon-only buttons
  - Example: `<button aria-label="search for courses, programs, and degrees"><svg aria-hidden="true">...</svg></button>`

### Typography & Readability

*Context: 10% of users have dyslexia. Reading can take them 3× as long. Fluid typography ensures legibility.*

- MUST define font sizes using relative units (`rem`, `em`, `%`) rather than fixed `px`
- MUST align text to the left; NEVER justify text
- MUST avoid heavy underlines, all-caps, and italics
- MUST maintain a readable line height (at least 1.5x font size)
- MUST limit line width to ~80 characters for comfortable reading
- SHOULD use dark grey text on soft/off-white backgrounds rather than pure black/white
- NEVER use text contained within images
- NEVER use dynamic, moving, or flashing images near text content

### Forms and Interactions

- MUST use explicit wording in labels for Cancel actions (e.g., "Discard Changes", "Close", "Stay")
- MUST make destructive buttons (Delete, Cancel) visually distinct and harder to reach
- MUST link labels to inputs explicitly (`for`/`id` or wrapping)
- MUST guarantee a textual label for form controls, not just rely on placement, color, icons, etc.
- MUST ensure every input has a clear, persistent text label
- MUST provide text-based error messages identifying the invalid field
  - MUST associate error messages with the relevant form controls, possibly using `aria-describedby` if appropriate
  - MUST announce form errors to screen readers at the appropriate times, possibly using `role="alert"` if appropriate
- MUST use a single input field for phone numbers (including country code)
- MUST allow people to type their name exactly as they prefer (incl. special chars)
- MUST support copy-pasting for all inputs (users often paste data)
- MUST provide 3 interaction modes for sliders: handle, text box, and +/- steppers
- NEVER disable copy-paste for any fields unless documented requirements for the feature require it
- SHOULD have search inputs describe what they search: "Search for courses, programs, and degrees"
- SHOULD display useful hints *above* the text box, not as placeholders
- SHOULD show errors immediately only for severe/blocking issues
- SHOULD use "Undo" for low-severity, frequent actions
- SHOULD use "Confirm" dialogs for severe, rare, or irreversible actions
- NEVER use placeholder text as a replacement for a label
- NEVER split phone numbers into multiple fields
- NEVER validate prematurely (while user is focused or just starting to type)
- NEVER tell a user their name is "invalid"
- NEVER rely on color alone to indicate required fields or errors
- NEVER use an ambiguous "X" icon in a modal (can mean Close, Save, or Cancel)
- NEVER use double negatives in confirmation dialogs (e.g., "Cancel the cancellation")
- NEVER disable copy-paste for password fields

### Animation & Motion

- MUST respect the user's `prefers-reduced-motion` system setting
- MUST provide a mechanism to pause, stop, or hide auto-playing content
- SHOULD keep optimal speed for UI animation between 200–500ms
- NEVER use parallax effects or moving elements at different speeds without a toggle
- NEVER flash content more than 3 times per second (seizure risk)

### Color and Contrast

- MUST ensure text has a contrast ratio of at least 4.5:1 against the background (WCAG AA)
- MUST ensure UI components/graphics have a contrast ratio of at least 3:1
- MUST ensure both dark and light mode have adequate color contrast
- MUST use more than color to communicate data (labels, patterns, shapes)
- MUST ensure yellow/orange meets 4.5:1 contrast; usually requires shifting hue toward brown/burnt orange
- MUST always accompany yellow UI elements with dark text or icons to articulate meaning
- SHOULD use Blue as a safe hue
- SHOULD respect prefers-color-scheme media queries to support system Dark Mode
- SHOULD use "brown" (dark yellow) if yellow is required for text
- NEVER rely on color alone to convey meaning or status
- NEVER use instructions that rely solely on sensory characteristics (shape, size, visual location, orientation, or sound)
- NEVER mix Red, Green, and Brown together
- NEVER mix Pink, Turquoise, and Grey together

### Cognitive support

- MUST allow users to include spaces when entering numbers (e.g., credit cards)
- MUST round values to the nearest whole number unless decimals are mandatory
- MUST use descriptive, verb-based labels (e.g., "Finish and Send" vs "Okay")
- MUST provide transparent feedback for every single action performed
- NEVER time users out or lock them out for 24h due to entry errors
- NEVER assume what the user wants or needs; suspend assumptions
- NEVER rely on precise movements; accommodate reduced dexterity

### Touch Targets & Mobile

- MUST ensure a hard minimum interactive size of 24×24px (WCAG 2.2 AA) with sufficient spacing
- MUST encapsulate the entire element (full-width bars/cards) rather than just the text or icon
- MUST provide single-pointer alternatives for complex gestures (e.g., a visible 'Delete' button in addition to 'Swipe to Delete')
- SHOULD aim for "Safe Zone" targets based on screen position (Steven Hoober’s Rule):
    - **Top of screen:** ~42px (11mm) minimum
    - **Bottom of screen:** ~46px (12mm) minimum
    - **Center of screen:** ~27px (7mm) minimum
- SHOULD limit bottom tab bars to a maximum of 5 items
- SHOULD use distinct "Tap" buttons rather than hover tooltips for mobile actions
- SHOULD use magnification overlays (like iOS text selection) for very small precise targets
- SHOULD increase target sizes significantly for sticky menus to account for movement
- NEVER place interactive elements flush against the screen edge without padding
- NEVER disable the visual zoom pinch gesture
- NEVER crowd targets; if a target is small (<44px), the spacing around it MUST be large

---

## UI patterns for components

### Navigation Patterns

- MUST include a "Skip to main content" link as the first focusable element
- MUST ensure the "Skip to main content" link is available on keyboard focus
- MUST ensure focusable elements are not obscured by sticky headers when tabbing (use scroll-padding)
- MUST ensure sufficient contrast between sticky menus and content
- SHOULD limit sticky bar items to a maximum of 5 to avoid rage taps
- SHOULD convert Table of Contents headings into accordions on mobile
- NEVER allow long sticky menus to create multiple scrollbars

### Star Ratings

- MUST announce rating once: "Rating: X out of 5 stars". For example:

```
<span aria-label="Rating: 4 out of 5 stars">
  <span aria-hidden="true">★★★★☆</span>
</span>
```

### Carousels & Sliders

*Context: Carousels often suffer from discoverability issues. If used, they must be strictly controlled.*

- MUST provide a visible "Pause/Stop" button for any auto-advancing carousel
- MUST group "Previous" and "Next" buttons close together for easier motor control
- MUST pause auto-rotation on hover and stop completely on interaction
- SHOULD avoid auto-advancing carousels whenever possible
- SHOULD replace progress dots with distinct labels, icons, or thumbnails
- SHOULD display navigation buttons *above* the carousel on desktop and *below* on mobile
- IF auto-advancing, MUST add at least a 5–7 second delay per slide
- NEVER rely on dragging movements alone for navigation

### Drag-and-Drop

*Context: Most drag-and-drop libraries fail accessibility checks. Users need keyboard control (Space/Arrows).*

- MUST support keyboard navigation: `Space` to pick up/drop, `Arrow keys` to move
- MUST design distinct visual states for: Grabbed, Dragged, Dropped, and Error
- MUST ensure dragged items move content out of the way to create room (reflow)
- MUST move dragged items toward the user in the z-dimension (elevation)
- SHOULD remove the item from the stack immediately upon drag (for cards) or upon drop (for tables)
- SHOULD use a haptic "bump" on mobile to indicate an item has been grabbed
- NEVER rely solely on mouse interactions

### Artificial Intelligence (AI) & Chat Interfaces

- MUST be transparent about whether the user is speaking to an AI or a human
- MUST explicitly label AI agents via text or `aria-labels` to distinguish from humans
- MUST provide "Skip to chat" or "Skip to last reply" links to bypass history
- MUST ensure AI-generated charts and visuals have proper alt text
- SHOULD allow users to collapse chat history without ending the session
- SHOULD provide task builders to help users articulate prompts (avoid open-ended "Ask me anything")
- NEVER use disguised AI that pretends to be human; it erodes trust
- NEVER use repetitive "busy" messages for screen reader users

### Search, Sorting & Feature Discovery

- MUST show at least 3 search results without scrolling
- MUST repeat sorting options at the bottom of long lists
- MUST explain *why* a feature is disabled and how to re-enable it
- SHOULD start showing search suggestions immediately on focus
- NEVER hide search behind an icon
- NEVER use technical abbreviations like "ASC/DESC" for sorting

---

## Accessibility verification

- MUST run accessibility compliance tests and fix any issues they find
- MUST use `axe-core` unit tests and integration tests in preference over writing home-grown tests for the same functionality
  - SHOULD include `wcag22`, `wcag22a`, `best-practice`, `focus-order-semantics`, `hidden-content`, and `label-content-name-mismatch` rules where relevant in any tests, as well as the required rule sets

See also: skills/html.md, skills/resources/wcag-aa.pdf
