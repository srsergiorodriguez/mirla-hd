# Mirla Design System — UI & Aesthetics

> Status: planning (no implementation yet). Branch: `agent-dev`.
> Last reviewed: 2026-10-26.

This is the contract for how Mirla looks and how UI code is written. The first rule is **visual parity**: the design-system refactor must not change the current appearance or behavior of the twelve existing custom elements. The second rule is **one vocabulary**: tokens, primitives, and patterns are shared instead of re-created per component.

---

## 1. Design principles

1. **The collection is the interface.** Chrome should stay quiet; images, labels, and data are the visual material.
2. **Pico CSS is the substrate.** Light/dark mode, color versions, typography, spacing, and form styling come from Pico variables. Mirla adds a thin semantic layer on top; it does not replace Pico.
3. **Tokens before values.** Component CSS uses semantic `--mirla-*` tokens with Pico fallbacks. Raw hex values are allowed only in the documented chart palette and print palette.
4. **Primitives before copies.** Search bars, status bars, pagers, empty states, reset buttons, and item cards are shared Svelte components, not repeated markup.
5. **No inline styling** except values that are genuinely computed at runtime (slider position, data-driven swatch color, chart height, D3 attributes).
6. **Accessible by default.** Keyboard operability, visible focus, labels, and reduced-motion support are part of "done".
7. **Print is a first-class surface.** Web tokens and print tokens are separate but documented in the same system.

---

## 2. Color

### 2.1 Theme colors (web)

The theme does not hardcode a brand palette. It uses Pico's color system:

- `themeColorScheme`: `dark` or `light` (default: `dark`).
- `themeColorVersion`: Pico color version (red, pink, fuchsia, purple, violet, indigo, blue, azure, cyan, jade, green, lime, yellow, amber, pumpkin, orange, sand, grey, zinc, slate; default: `.blue.` in `config.json`, current site uses `.` = azure).
- Shoelace is synchronized to Pico through `assets/css/main.css`.

Semantic tokens (implemented; values preserve the previous look):

| Token | Default expression | Used for |
|---|---|---|
| `--mirla-text` | `var(--pico-color, inherit)` | Body text in components |
| `--mirla-text-muted` | `var(--pico-muted-color, #777)` | Secondary labels, counts, empty states |
| `--mirla-heading` | `var(--pico-heading-color, inherit)` | Component titles |
| `--mirla-primary` | `var(--pico-primary, #3498db)` | Actions, focus, active states |
| `--mirla-primary-hover` | `var(--pico-primary-hover, #2980b9)` | Hover states |
| `--mirla-on-primary` | `var(--pico-primary-inverse, #fff)` | Text/icons on primary surfaces |
| `--mirla-surface` | `var(--pico-card-background-color, #f8f9fa)` | Control panels, cards |
| `--mirla-surface-muted` | `var(--pico-card-sectioning-background-color, rgba(0,0,0,.05))` | Inactive areas, table headers |
| `--mirla-border-color` | `color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent)` | Component borders (current `--mirla-border`) |
| `--mirla-border-subtle` | `color-mix(in srgb, var(--pico-color, currentColor) 12%, transparent)` | Internal dividers (where a lighter line is already used) |
| `--mirla-focus-ring` | `var(--sl-focus-ring-color, rgba(52,152,219,.2))` | Focus shadow |
| `--mirla-danger` | `var(--pico-del-color, #d81b60)` | Errors, destructive actions |
| `--mirla-shadow` | `var(--pico-box-shadow, 0 2px 4px rgba(0,0,0,.1))` | Panels |
| `--mirla-shadow-card` | `var(--pico-card-box-shadow, 0 2px 4px rgba(0,0,0,.05))` | Compact cards (ItemsBar) |
| `--mirla-border-form` | `var(--pico-form-element-border-color, rgba(0,0,0,.1))` | Media frames and card borders |

Optional custom colors (implemented):

- `primaryColor` and `primaryHoverColor` are color-picker theme options.
- Empty values keep the selected Pico Color Version.
- A valid hex primary is mapped to `--pico-primary`, `--pico-primary-background`, `--pico-primary-border`, and `--pico-primary-focus`. If the hover is empty, it is derived with `color-mix(..., #000 15%)`.
- `--pico-primary-inverse` is not recomputed; check contrast after choosing a light or dark custom color.

Rules:

- Components must not override `--pico-primary` directly. If a component needs a different accent (e.g., a chart series), use the chart palette or a documented `color` prop.
- Do not use pure black or pure white for text/borders. Use Pico tokens.
- `--mirla-border` is the historical name used in three components. It becomes an alias of `--mirla-border-color` during the migration; remove the local definitions from `MirlaIndex`, `MirlaTable`, and `MirlaProtocol`.

### 2.2 Categorical chart palette

Used by bar chart, waffle, network, and any future multi-series visualization. This is the only place where raw chart hex values live; it should move to `src/lib/palette.js` and be referenced by all components.

| # | Hex | Name (informal) |
|---|---|---|
| 1 | `#e60049` | crimson |
| 2 | `#0bb4ff` | azure |
| 3 | `#50e991` | mint |
| 4 | `#e6d800` | yellow |
| 5 | `#9b19f5` | violet |
| 6 | `#ffa300` | orange |
| 7 | `#dc0ab4` | magenta |
| 8 | `#b3d4ff` | light blue |
| 9 | `#00bfa0` | teal |
| 10 | `#97421d` | brown |

Notes:

- The palette is **not yet accessibility-audited** for contrast against both themes. Some colors (yellow, light blue) may need a darker outline or label. Do not change the palette during the parity refactor; audit it as a separate task.
- Charts should never rely on color alone: labels, tooltips, counts, and keyboard focus provide redundant encoding.
- `color` props on visualizations accept any CSS color, including `var(--pico-primary)`.
- A component may use a single accent (primary) by default; `usepalette="true"` opts into the categorical palette.

### 2.3 Print palette

| Token | Value | Usage |
|---|---|---|
| `--print-ink` | `#000` | Body text |
| `--print-ink-muted` | `#555` | Captions, folios, secondary metadata |
| `--print-rule` | `#494949` | Running heads, rules |
| `--print-code-bg` | `#d3d3d3` | Code blocks |
| `--print-paper` | `#fff` | Page background |
| `--print-screen-bg` | `gray` | Screen-only backdrop around pages |

Images in the zine template are currently filtered to `grayscale(100%) brightness(120%) contrast(120%)` for black-and-white laser printing. This must remain the default for `page-print.hbs`; the catalog will expose a print treatment option (color / grayscale / high contrast) without changing the zine default.

### 2.4 Data editor colors

The editor uses Pico variables plus a small set of legacy accents:

- Delete/destructive: `#d81b60` (hover `#c2185b`) — should become `--editor-danger`.
- Placeholder/editor borders: `#3498db`, `#f4f6f8`, `#accce6`, `#e8f0fe` — only in `assets/css/editor.css`, not in the app UI.
- The editor's root font size is `18px` (intentionally denser than the site). Preserve it in the Svelte port unless a visual review approves a change.

---

## 3. Typography

### 3.1 Web defaults (implemented)

| Role | Family | Source | Weights |
|---|---|---|---|
| Body | Inter | Theme `assets/fonts/` (woff2) | 400, 700 |
| Headings | Libre Baskerville | Theme `assets/fonts/` (woff2) | 700 |
| Code | System monospace | System stack | — |

- Base size: `16px` (`fontSize` theme option, range 12–20).
- Line height: `1.5` (`lineHeight` theme option, range 1.2–2). This is now an explicit theme setting.
- Headings use `--pico-font-family-heading` via `main.css`.
- The default site loads only local fonts. No Google Fonts request is made unless `fontSource=google`.
- `fontSource` and `fontPairing` replace the manual Google URL workflow for normal use. The four legacy fields remain for Google/custom setups.
- The optional `customCSS` field is appended after the theme CSS for advanced `@font-face` work.

### 3.2 Print defaults (implemented)

| Role | Family | Loaded? | Configurable |
|---|---|---|---|
| Body | IBM Plex Sans | Yes, bundled woff2 | `printFontBody` |
| Headings | Syne | Yes, bundled woff2 (variable 400–800) | `printFontHeading` |
| Code | Source Code Pro | Yes, bundled woff2 | `printFontCode` |

The zine template uses `11pt` body, `1.3` line-height, `8pt` captions/folios, and `8pt` code. Keep these defaults for visual parity.

Print settings (Theme → Print):

- `printPageWidth` / `printPageHeight` (defaults `5.5in` / `8.1in`).
- `printMarginTop` / `printMarginBottom` (defaults `20mm`).
- `printMarginOuter` (default `13mm`) and `printMarginInner` (default `16mm`, the gutter).
- `printFontBody` / `printFontHeading` / `printFontCode` (bundled fonts).
- `printImageTreatment`: `grayscale` (default) or `color`.

The print template links `assets/css/fonts.css` directly, so it does not load the web `style.css`.

### 3.3 Font sources and presets (implemented)

`fontSource` controls where fonts come from:

| `fontSource` | Behavior | Use |
|---|---|---|
| `bundled` (default) | Local `@font-face` from `assets/fonts/`, no network | Workshops, offline printing, privacy |
| `google` | Legacy Google Fonts links from the four raw fields | Existing sites with custom Google fonts |
| `system` | System UI/monospace stacks | Fastest, zero payload |
| `custom` | Legacy family-name fields + `customCSS` `@font-face` | Advanced/self-managed fonts |

Bundled `fontPairing` presets:

| Preset | Body | Headings | Character |
|---|---|---|---|
| `current` | Inter | Libre Baskerville | Current Mirla look (default) |
| `print` | IBM Plex Sans | Syne | Editorial/print companion |
| `system` | System UI stack | System UI stack | Offline, no font payload |
| `custom` | Legacy family-name fields | Legacy family-name fields | Advanced users |

Every bundled font needs:

- a `woff2` file (currently the `latin` subset, which covers Spanish/Portuguese accents);
- an `@font-face` rule in `assets/css/fonts.css` with `font-display: swap`, `font-style`, `font-weight`, and `unicode-range`;
- a license file under `assets/fonts/licenses/` (SIL OFL) and an entry in the README/release notes.

The theme now:

- generates a proper font stack with quoted family names and a generic fallback;
- removes the default Google Fonts preconnect/link tags;
- exposes `fontSize` and `lineHeight`;
- allows a `customCSS` field for extra `@font-face` declarations;
- links `fonts.css` in both the web head and the print template;
- maps optional custom primary colors to Pico's primary, background, border, focus, and hover tokens.

Font licenses: Inter, Libre Baskerville, IBM Plex Sans, Syne, and Source Code Pro are SIL Open Font License. Keep attribution in the release notes/README.

### 3.4 Type scale (web components)

| Token | Value | Typical use |
|---|---|---|
| `--mirla-fs-2xs` | `0.65rem` | Image badges, tiny metadata |
| `--mirla-fs-xs` | `0.75rem` | Dense table text, filter labels |
| `--mirla-fs-sm` | `0.85rem` | Secondary UI, legends, status bars |
| `--mirla-fs-base` | `0.9rem` | Table body, card labels |
| `--mirla-fs-md` | `1rem` | Search inputs, body UI |
| `--mirla-fs-lg` | `1.2rem` | Reset/close buttons |
| `--mirla-fs-xl` | `1.5rem` | Component titles (`h3`) |

Do not invent new sizes for one-off components. If a size is genuinely needed, add a token with a documented use.

---

## 4. Spacing, radii, borders, shadows, motion

### 4.1 Spacing

The current components use a mix of `0.2`, `0.25`, `0.3`, `0.4`, `0.5`, `0.6`, `0.75`, `0.8`, `1`, `1.2`, `1.5`, `2`, `2.5`, and `3rem`. The first refactor must preserve those computed values. The token names below are a **legacy-compatible scale**; a later cleanup can snap them to a 4px grid with visual review.

| Token | Value | Typical use |
|---|---|---|
| `--mirla-space-3xs` | `0.2rem` | Badge offsets, tight table cells |
| `--mirla-space-2xs` | `0.25rem` | Button vertical padding, small gaps |
| `--mirla-space-xs` | `0.3rem` | Compact button padding |
| `--mirla-space-sm` | `0.4rem` | Filter padding, label gaps |
| `--mirla-space-md` | `0.5rem` | Standard gap, header padding |
| `--mirla-space-lg` | `0.6rem` | Search input padding |
| `--mirla-space-xl` | `0.8rem` | Card title padding |
| `--mirla-space-2xl` | `1rem` | Panel padding, grid gaps |
| `--mirla-space-3xl` | `1.2rem` | Gallery gaps |
| `--mirla-space-4xl` | `1.5rem` | Panel padding (large), section gaps |
| `--mirla-space-5xl` | `2rem` | Component vertical margins |
| `--mirla-space-6xl` | `2.5rem` | Item viewer bottom margin |
| `--mirla-space-7xl` | `3rem` | Empty-state padding |

Rule of thumb: internal component spacing uses the scale; layout spacing between components uses `--mirla-space-5xl` (2rem) unless a component already documents an exception.

### 4.2 Radii

| Token | Value | Use |
|---|---|---|
| `--mirla-radius-sm` | `4px` | Badges, small images, code chips |
| `--mirla-radius-md` | `var(--pico-border-radius, 8px)` | Panels, cards, tables, images |
| `--mirla-radius-lg` | `12px` | Large media frames (if needed) |
| `--mirla-radius-pill` | `50px` | Search inputs, filter selects, pager buttons, reset buttons |

### 4.3 Borders

| Token | Value | Use |
|---|---|---|
| `--mirla-border-width` | `1px` | Default |
| `--mirla-border-width-strong` | `2px` | Active tab, table header rule |
| `--mirla-border-color` | see §2.1 | Panels, cards, inputs |
| `--mirla-border-subtle` | see §2.1 | Internal row separators |

### 4.4 Shadows

| Token | Value | Use |
|---|---|---|
| `--mirla-shadow` | `var(--pico-box-shadow, 0 2px 4px rgba(0,0,0,.1))` | Panels |
| `--mirla-shadow-hover` | `0 4px 10px rgba(0,0,0,.15)` | Hovered thumbnails |
| `--mirla-shadow-focus` | `0 0 0 calc(var(--pico-outline-width, 3px) / 2) var(--mirla-focus-ring)` | Focus rings |

Note: the theme sets `--pico-box-shadow: none !important` and `--pico-outline-width: 10px`. The focus ring therefore renders as a 5px ring. This is current behavior; do not "fix" it during the parity refactor.

### 4.5 Motion

| Token | Value | Use |
|---|---|---|
| `--mirla-duration-fast` | `0.2s` | Hover, focus, opacity |
| `--mirla-duration-base` | `0.3s` | Fades, dimming |
| `--mirla-duration-slow` | `0.5s` | Zoom reset, D3 transitions |
| `--mirla-ease-standard` | `ease` | Default |
| `--mirla-ease-bounce` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Thumbnail/card hover |
| `--mirla-ease-out` | `cubic-bezier(0.25, 1, 0.5, 1)` | Panels (optional) |

All non-essential animation must be disabled under `@media (prefers-reduced-motion: reduce)`.

---

## 5. Layout and responsive rules

| Context | Current value | Token (planned) |
|---|---|---|
| Main column | `1100px` | `--mirla-layout-main` (theme) |
| Sidebar | `300px` | `--mirla-layout-sidebar` (theme) |
| Item page container | `1000px` | `--mirla-item-width` |
| Item viewer height | `500px` | `--mirla-viewer-height` |
| Preview card max width | `400px` | `--mirla-preview-width` |
| Compare max height | `500px` | `--mirla-compare-height` |
| Map height | `400px` | `--mirla-map-height` |
| Network height | `500px` | `--mirla-network-height` |
| Table max height | `500px` | `--mirla-table-height` |
| Card min width | `140px` | `--mirla-card-min` |
| Filter min width | `160px` | `--mirla-filter-min` |
| Waffle max width | `350px` | `--mirla-waffle-max` |
| Gallery gap | `1.2rem`/`1.5rem` | `--mirla-space-3xl` / `--mirla-space-4xl` |

Breakpoints in use:

- `600px`: waffle layout switches from stacked to side-by-side.
- `768px`: theme grid collapses to one column.
- `1024px`: wide/full gallery wrappers expand to 110%.

New components must use these breakpoints rather than inventing arbitrary ones. Prefer container-relative sizing (`minmax`, `auto-fill`, `clamp()`) where the current design already does.

---

## 6. Component and primitive inventory

### 6.1 Public custom elements (unchanged API)

See `architecture.md` §6 for the prop table. The public tags, attribute names, and default behavior are frozen during the refactor.

### 6.2 Shared Svelte primitives (implemented)

These are **internal Svelte components**, not custom elements. They are imported by the public components and compiled into the same bundle.

| Primitive | Responsibility | Replaces |
|---|---|---|
| `Surface` | Panel/card container with border, radius, background, padding | `.controls-container` copies, `.mirla-preview-item` card shell |
| `SearchField` | Label-less search input with consistent height/radius/focus | Four duplicated `.search-bar` blocks |
| `FilterSelect` | Label + select pair for filter grids | `.filter-group` copies |
| `StatusBar` | Count + actions row with top divider | `.status-bar` copies |
| `Button` | Variants: `ghost`, `primary`, `icon`, `plain`, `pager`; sizes; focus ring | `.reset-btn`, `.csv-btn`, `.pager-btn`, `.btn` variants |
| `Pager` | Prev/next + "current / total" with disabled states | Index pager (appears twice), future table pager |
| `EmptyState` | Dashed/bordered empty message | `.mirla-empty`, `.error`, `.no-data` variants |
| `ErrorState` | Monospace red dashed error box | `.mirla-error` copies |
| `ResetButton` | Circular ↺ overlay | Four `.reset-viz-btn` copies |
| `ItemCard` | Image + label + link, with thumb fallback | Index cards, gallery cards, preview image area |
| `ItemGrid` | Responsive grid of `ItemCard` | Index gallery grid, gallery grid, ItemsBar grid |
| `Legend` | Color swatch + label + count, keyboard-selectable | Waffle legend |
| `TableShell` | Scroll container and border/radius tokens | Table/protocol table wrappers |

Not implemented in Sprint 1: `VizFrame` (each visualization keeps its outer wrapper and composes `ResetButton` + `ItemsBar`) and `Icon` (only one inline SVG remains). Add them only if a second use appears.

Primitive rules:

- No primitive may read `window.MIRLA_*` directly. Data is passed in via props.
- Primitives are presentation-only; they do not own collection state.
- Primitives use tokens and have no hardcoded colors/sizes beyond a documented fallback.
- Primitives accept `children`/snippets for actions and labels where flexibility is needed.
- Primitives must render correctly in light and dark mode and at 320px width.

### 6.3 Shared data helpers (implemented)

`src/lib/data.js`:

- `getCollection()` / `getContext()` — safe global access.
- `asArray(value)` — normalize scalar/array.
- `toLabels(value)` — flatten refs (`{pid,label}`) and comma/semicolon strings into an array of labels.
- `toDisplayValue(value)` — string for search/sort/table.
- `filterItems(items, { query, filters })`.
- `getUniqueOptions(items, key)`.
- `sortItems(items, key, asc)`.
- `getItemByPid(items, pid)` with string comparison.
- `getItemImage(item, index)` with `thumb`/`images` fallback.
- `parseLatLong(value)`.
- `parseMirlaDate(value)`.
- `groupCounts(items, key)`.
- `buildWaffleGroups(items, key)`.
- `buildNetworkGraph(items, sourceKey, targetKey)`.
- `buildTreeRollup(items, keys)`.

`src/lib/palette.js`: the categorical palette and a `colorForIndex(i)` helper.

`src/lib/format.js`: number/date formatting, pluralization, safe fallbacks.

These functions are pure and are the main target of `testing.md`.

---

## 7. CSS architecture

### 7.1 Where tokens live

- **Theme tokens** live in `input/themes/mirlaTheme/assets/css/main.css` (`:root`). They are the runtime source of truth for the site.
- **Dynamic theme tokens** (font families, widths, print sizes) are emitted by `theme-variables.js` into the generated `style.css`.
- **Component CSS** uses `var(--mirla-*, <fallback>)` so it remains usable in the dev harness without the theme.
- The dev harness relies on the component fallbacks and Pico; it does not ship a separate token file. The theme remains the runtime source of truth.

### 7.2 Scoping

- Svelte custom elements are compiled with **Shadow DOM**. Component styles are injected into the shadow root. CSS custom properties (`--pico-*`, `--mirla-*`) inherit through the shadow boundary, so theme tokens and light/dark colors still work. Document-level selectors and the theme's `[data-theme]` rules do **not** cross the boundary; use `:host`, `:host-context`, a scoped selector, or a data-driven SVG/canvas attribute instead.
- Use `:global()` only for document-level overrides. Inside a shadow root, `:global(mirla-barchart svg text)` cannot match the host; prefer a scoped `svg text` rule or D3 attributes. Audit the existing `:global(mirla-*)` rules rather than copying them into new components.
- Do not style generic tags (`table`, `input`, `button`) from a component; scope to a class to avoid leaking into page content.

### 7.3 Class naming

- Public/structural classes: `.mirla-*` (keep existing names for parity).
- Primitive internals: `.c-<primitive>-*` (e.g. `.c-status-bar`), or simple local names inside a Svelte component. Svelte scoping prevents collisions.
- State classes: `.is-active`, `.is-disabled`, `.is-dimmed`, `.is-empty`.
- Avoid IDs in reusable components. If an input needs an ID for a label, use Svelte 5's `$props.id()` or wrap the input inside the label.

### 7.4 Forbidden patterns

- Static `style="..."` attributes. Exceptions: runtime-computed values (slider position, waffle cell color, chart height, comparison clip path). Add a comment explaining why.
- Raw hex/rgb colors in component CSS, except the chart palette and documented fallbacks.
- Duplicating a full control block (search + status + actions) in a new component.
- `!important` except for overriding Publii inline styles (documented in `main.css`).
- Fixed pixel heights for text containers that can grow with translated strings.
- `outline: none` without a visible `:focus-visible` replacement.
- Hover-only interactions; every click/hover affordance needs a keyboard path.

---

## 8. Accessibility rules

- All interactive elements are `<button>`, `<a>`, `<input>`, `<select>`, or have an appropriate ARIA role and keyboard handler.
- Every icon-only button has an `aria-label` and a `title` (the current reset buttons only have `title`; add `aria-label`).
- Focus is always visible: use the standard focus ring token, not `outline: none`.
- Do not use color alone to convey selection; pair with opacity, outline, or count.
- Charts:
  - Provide text labels for axes and data points.
  - Make clickable marks keyboard-focusable where feasible.
  - Announce filter results via the status bar (e.g., "12 results found").
- `prefers-reduced-motion: reduce` disables transforms/transitions that are not essential.
- Images have meaningful `alt` text derived from `label`, with a fallback to `pid`.
- Tables use `<th scope="col">` for headers and `<caption>` or a visible title.
- Avoid duplicate IDs when multiple instances of a component are on one page.
- Contrast: the current chart palette and muted text need an audit; do not claim WCAG compliance until measured.

---

## 9. Print and catalog design

### 9.1 Shared print base

Extract the common print setup from `page-print.hbs` into a shared partial (planned `partials/print-base.hbs` or a CSS asset):

- page size variables (`--page-width`, `--page-height`);
- margins and left/right page rules;
- running header and page numbers;
- body/heading/code typography;
- footnote and sidenote rules;
- image classes and print treatments;
- screen-only gray backdrop;
- `@media print` Paged.js overrides.

Both the zine template and the catalog template include the same base. Catalog-specific CSS lives in `assets/css/catalog.css` (or a dedicated `<style>` block) and only adds catalog layout.

### 9.2 Catalog tokens and defaults (confirmed)

| Token | Default | Use |
|---|---|---|
| `--mirla-catalog-columns` | `2` | Grid columns per sheet |
| `--mirla-catalog-gap` | `6mm` | Gap between cards |
| `--mirla-catalog-card-padding` | `3mm` | Card inner padding |
| `--mirla-catalog-image-height` | `45mm` | Image box height |
| `--mirla-catalog-title-size` | `10pt` | Item label |
| `--mirla-catalog-meta-size` | `7.5pt` | Metadata |
| `--mirla-catalog-rule` | `0.5pt solid #000` | Card rules |
| `--mirla-catalog-image-fit` | `contain` | Image fitting |
| `--mirla-catalog-image-filter` | `grayscale(100%) brightness(120%) contrast(120%)` | Print treatment |

Content defaults (plugin settings):

- Fields: `label,autores,fecha,medio_impresion`; if none exist in the protocol, fall back to the first four non-media attributes after `label`.
- Sort: `label`, ascending.
- Columns: `2`.
- Items per page: `6`.
- Image source: main image (not the 400px thumbnail).
- Image treatment: grayscale.
- Metadata labels: visible.
- Scope: main-table items only in v1.
- Page size: reuse the print page size (default 5.5×8.1in).

The plugin provides layout classes (`catalog--cols-1/2/3`, `catalog--images-color/grayscale`) rather than inline CSS. The theme CSS owns the visual values.

### 9.3 Print rules

- One `.catalog-sheet` per printed page; `break-after: page`.
- Each card has `break-inside: avoid`.
- Images are eager-loaded and decoded before Paged.js starts.
- Running header uses the page title; folios use `counter(page)`.
- No interactive controls in print output; hide screen-only buttons.
- The zine's grayscale default must not change when adding the catalog.

---

## 10. Data editor design rules (Phase 4)

- Preserve the current dense, utilitarian feel and the 18px root size.
- Use Pico variables; add editor tokens for danger, dropzone, badges, and table density.
- Move every static inline style into a class.
- Keep native `<dialog>`, `<details>`, tables, and file inputs; they work on `file://` and are familiar.
- Preserve Spanish/English parity and the existing strings (including the ZIP filename quirk) during the parity port. Fix strings in a separate, documented task.
- The editor is a single-file app: no external CSS/JS at runtime.
- Destructive actions (delete attribute, delete row) must remain confirmed.
- Image operations must show progress and must not block the UI for large collections without feedback.

---

## 11. Visual parity protocol

Because this refactor must not change the look, use a manual protocol (not automated visual tests; see `testing.md`):

1. Build the component dev harness with a fixture collection (main + secondary table, refs, images, long labels, missing images).
2. For each refactored component, capture before/after screenshots at:
   - desktop 1440px, tablet 768px, mobile 390px;
   - dark and light theme;
   - default state, hover, focus, active/filtered, empty/error.
3. Compare spacing, typography, border colors, radii, hover behavior, and responsive breakpoints.
4. Record the check in `diary.md` with the component name and any intentional differences (ideally none).
5. Do not merge a component refactor without this check.

The dev harness is a development tool, not a test artifact. It can live at `svelte-components/index.html` and be excluded from the library build.

---

## 12. Migration checklist for a component refactor

- [ ] Replace local data normalization with `src/lib/data.js`.
- [ ] Replace duplicated controls with primitives.
- [ ] Replace local `--mirla-border` definitions with the global token.
- [ ] Replace hardcoded colors/sizes with tokens or documented fallbacks.
- [ ] Remove static inline styles (keep only computed values, with comments).
- [ ] Remove duplicate IDs; add labels.
- [ ] Add `aria-label`/focus-visible states where missing.
- [ ] Verify dark/light, 320px, 768px, 1440px.
- [ ] Verify empty/error state.
- [ ] Run pure-function tests and the component build.
- [ ] Record the parity check in `diary.md`.

---

## 13. Design decisions

Resolved:

1. **Fonts:** self-hosted bundled fonts are the default; Google Fonts is a legacy/advanced source. See §3.3.
2. **Catalog defaults:** 2 columns, 6 items/page, fields `label,autores,fecha,medio_impresion`, main images, grayscale, `label` ascending, main-table items only. See §9.2.
3. **Spacing scale:** keep the legacy-compatible scale for parity; snap to a 4px grid in a later dedicated visual pass.

Still open:

4. **Color customization**: keep Pico color versions only, or add a custom primary color picker? Proposed: add optional `primaryColor`/`primaryHoverColor` color pickers that override Pico tokens, with a warning about contrast.
5. **Data editor visual refresh**: strictly parity first, or allow small density/contrast improvements during the port? Proposed: parity first; improvements in a follow-up.
6. **Bundled font set**: start with Inter, Libre Baskerville, IBM Plex Sans, Syne, and Source Code Pro. Add more only when a real workshop need appears.
