# Mirla Plan — Active Sprint

> Branch: `agent-dev`. Status: **Sprint 1 complete; Sprint 2 next**.
> Last updated: 2026-10-26.

The work is split into sequential sprints. Only the sprint marked **ACTIVE** is implemented at a time. Do not start the next sprint until the current acceptance criteria are met and `diary.md` is updated.

---

## Sprint status

**Completed:** Sprint 0 (foundations, plugin dev loop) and Sprint 1 (design system, parity refactor).

**Next:** Sprint 2 (versatile customization: self-hosted fonts, colors, layout, print).


### Sprint 0 — Foundations, docs, and the plugin dev loop

**Status:** complete and verified.

**Goal:** one codebase, one branch, and a documented contract before touching UI code.

- [x] Audit the current plugin, theme, components, editor, print layer, and release workflow.
- [x] Create the `agent-dev` branch.
- [x] Write `architecture.md`, `design-system.md`, `testing.md`, `plan.md`, `diary.md`.
- [x] Approve the symlink procedure and run it on the local Publii installation.
- [x] Back up the installed plugin outside `plugins/` (`plugin-backups/mirlaPlugin-20261026-101249`).
- [x] Add `scripts/link-plugin.sh` (dry-run by default, explicit paths, backup, verification, rollback).
- [x] Add `scripts/unlink-plugin.sh` (dry-run by default, restore latest/specific backup).
- [x] Add a Windows-friendly fallback (`scripts/link-plugin.ps1` with a junction).
- [x] Add `scripts/check-plugin-loader.js` (reproduces Publii's discovery/require path).
- [x] Add `scripts/test-all.sh` and `scripts/build-all.sh`.
- [x] Add a CI workflow for tests/builds on branch pushes (no release).
- [x] Verify the symlink at the loader level (`is symlink: true`, `main.js` resolved from the repo).
- [x] Verify the plugin's full `processDataset` path against a temporary collection (56 items, 56 item pages, JSON + report).
- [x] Verify link/unlink/rollback in an isolated temporary Publii home.
- [x] Restart Publii and run a real preview/publish (confirmed working by the user).
- [x] Record the verification in `diary.md`.

**Acceptance:**

- `~/Documents/Publii/plugins/mirlaPlugin` resolves to `mirla-hd/mirlaPlugin`.
- A Publii preview uses the repo source; no copy step is needed. *(Loader, full plugin smoke, and real Publii preview/publish verified.)*
- The release workflow zips the same repo folder.
- Rolling back restores the pre-existing installed plugin.
- No application code has changed yet.

**Do not do in this sprint:** refactor components, change theme config, add the catalog, or start the editor port.

---

## Sprint sequence

| Sprint | Theme | Est. size | Depends on |
|---|---|---|---|
| 0 | Foundations, docs, plugin symlink | S | — |
| 1 | Design-system foundation + component parity refactor | L | 0 |
| 2 | Versatile customization (fonts, colors, layout, print) | M | 1 |
| 3 | Print catalog exporter | M–L | 1, 2 |
| 4 | Data editor Svelte spike + port | L | 0 (independent) |
| 5 | Release pipeline, docs, cleanup | S | 1–4 |

Sprint 4 can run in parallel with 1–3 because it is a separate app. The recommended order for a single developer is 0 → 1 → 2 → 3 → 4 → 5, but the editor spike can be done early to de-risk it.

---

## Sprint 1 — Design-system foundation and parity refactor

**Status:** complete; parity checked with headless Chrome against the previous bundle.

**Goal:** unify tokens and primitives without changing the current look or the public component API.

### 1.1 Tokens

- [x] Add the semantic token layer to `input/themes/mirlaTheme/assets/css/main.css` with the exact defaults in `design-system.md`.
- [x] Keep `--mirla-border` as an alias; remove the three local definitions.
- [x] Add chart palette as `src/lib/palette.js`; replace the duplicated arrays in bar/waffle/network.
- [x] Provide dev fallbacks instead of a separate `dev-tokens.css` mirror; components use `var(--mirla-*, fallback)`.
- [x] Verify computed styles against the previous bundle (headless screenshots; see diary).

### 1.2 Data helpers

- [x] Create `src/lib/data.js` with the helpers listed in `architecture.md` §6.3.
- [x] Create `src/lib/format.js` and `src/lib/palette.js`.
- [x] Replace duplicated normalization in all 12 components.
- [x] Add Vitest and tests for the helpers (`data.test.js`, `format.test.js`).

### 1.3 Primitives

- [x] `Surface`, `SearchField`, `FilterSelect`, `StatusBar`, `Button`, `Pager`, `EmptyState`, `ErrorState`, `ResetButton`, `ItemCard`, `ItemGrid`, `Legend`, `TableShell`.
- [x] `VizFrame` and `Icon` were not needed after the refactor; visualizations compose `ResetButton` + `ItemsBar`, and only one inline SVG remains.
- [x] Refactor `MirlaIndex` and `MirlaTable` first.
- [x] Refactor `MirlaProtocol`, `MirlaGallery`, `MirlaPreview`, `ItemsBar`.
- [x] Refactor the six visualizations to use `ResetButton`, `ItemsBar`, and shared palette/data helpers.
- [x] Remove static inline styles; keep only runtime-computed values.
- [x] Remove duplicate IDs; add `aria-label`s.

### 1.4 Dev harness

- [x] Build a component gallery page at `svelte-components/index.html` with the fixture collection.
- [x] Include dark/light toggle (responsive inspection by resizing; no separate viewport controls).
- [x] Include empty/error states.
- [x] Do not include the harness in the library build.

### 1.5 Documentation

- [x] Update `DesarrollarComponentes.md` to reference primitives/tokens and the testing rules.
- [x] Fix prop-name drift (`date-key` vs `datekey`, etc.) in the component README.
- [x] Record the parity check in `diary.md`.

**Acceptance:**

- No visible change in the components at 1440px and 768px in dark/light (manual comparison; 0.4–0.7% antialiasing/1px shift, no layout or color change).
- Public custom-element names, props, and defaults unchanged.
- Duplicated control CSS removed (search/status/reset/empty).
- 30 pure-function tests pass.
- The component bundle builds and is copied to the theme.
- `design-system.md` matches the implemented tokens/primitives, including Shadow DOM behavior.

**Notes:**

- The browser's custom elements use Shadow DOM. Theme tokens inherit; document-level selectors do not. This was previously undocumented and is now captured in `design-system.md` and `architecture.md`.
- `MirlaWaffle` cell clicks now set the active category correctly (the previous implementation only set `selectedItems` and left the reset/dimming state inactive).
- The ItemsBar close button appears not to remove the bar in headless tests; the same behavior exists in the old bundle and is likely the `fade` transition not completing under virtual time. Verify in a real browser before treating it as a regression.

**Out of scope:** typography presets, color picker, catalog, editor.

---

## Sprint 2 — Versatile customization

**Status:** not started.

**Goal:** make the common workshop customizations possible from Publii settings, without editing code.

### 2.1 Web typography (self-hosted)

- [ ] Add `assets/fonts/` with the bundled woff2 files and their OFL license files.
- [ ] Add `assets/css/fonts.css` with `@font-face` declarations (`font-display: swap`, `latin` + `latin-ext` subsets).
- [ ] Add `fontSource` select: `bundled` (default), `google` (legacy), `system`, `custom`.
- [ ] Add `fontPairing` select for bundled fonts: `current` (Inter + Libre Baskerville), `print`/`editorial` (IBM Plex Sans + Syne), `system`, `custom`.
- [ ] Add proper font stacks (quoted families + generic fallback) in `theme-variables.js`.
- [ ] Add `lineHeight` and heading scale options.
- [ ] Remove the default Google Fonts `<link>`s; load them only when `fontSource=google` (legacy sites preserve their behavior).
- [ ] Keep the four legacy fields for `custom`/`google` and existing sites.
- [ ] Add a `customCSS` textarea for `@font-face`/advanced overrides.
- [ ] Validate/sanitize family names; fail gracefully with a readable warning.
- [ ] Check total theme size and document the font payload.

### 2.2 Color and layout

- [ ] Optional `primaryColor` / `primaryHoverColor` color pickers.
- [ ] Optional border radius and content width controls (with current values as defaults).
- [ ] Document contrast considerations for custom colors.

### 2.3 Print customization

- [ ] Extract shared print styles into a partial (`partials/print-base.hbs` or a CSS asset).
- [ ] Add print page-size preset + custom width/height.
- [ ] Add print margins (top/right/bottom/left).
- [ ] Add print body/heading/code font options using the bundled fonts (defaults: IBM Plex Sans, Syne, Source Code Pro).
- [ ] Load Source Code Pro/IBM Plex Mono from the bundled fonts or document the monospace fallback.
- [ ] Add print image treatment (default grayscale for zines).
- [ ] Keep the current zine output identical with defaults.

### 2.4 Docs

- [ ] "How to use a font" recipes: bundled preset, system stack, custom `@font-face`, and legacy Google Fonts.
- [ ] Document all new theme options with examples.
- [ ] Update README (and remove the old manual URL-segment instructions).

**Acceptance:**

- A user can change body/heading fonts, base size, line height, width, and print page size from Publii settings.
- Default fonts are served from the theme; no Google Fonts request is made unless `fontSource=google`.
- Existing sites with the old default config look unchanged.
- Existing sites that used custom Google Fonts can switch to `fontSource=google` without losing their settings.
- No manual Google Fonts URL copying is required for the bundled presets.
- Print defaults remain visually identical.
- Theme config schema and docs match.

**Out of scope:** arbitrary font uploads through the Publii UI, per-page typography, a full color theme editor.

---

## Sprint 3 — Print catalog exporter

**Goal:** publish a print-ready catalog of the collection from Publii, alongside the existing zine workflow.

### 3.1 Plugin

- [ ] Extract the dataset build into a cached `getDataset(rendererInstance)` method.
- [ ] Add `addModifiers()` and an `htmlOutput` modifier that replaces `[MIRLA_CATALOG]`.
- [ ] Ensure the modifier only acts when the placeholder is present; no-op otherwise.
- [ ] Make missing template/catalog pages warnings, not fatal errors, in single-page previews.
- [ ] Add plugin settings (defaults confirmed):
  - `catalogFields` (default `label,autores,fecha,medio_impresion`; if none of those exist in the protocol, fall back to the first four non-media attributes);
  - `catalogSort` + `catalogSortDir` (default `label`, `asc`);
  - `catalogColumns` (default `2`; options 1/2/3);
  - `catalogItemsPerPage` (default `6`);
  - `catalogImageSource` (default `main`; options main/thumb);
  - `catalogImageTreatment` (default `grayscale`; options color/grayscale);
  - `catalogShowMetaLabels` (default `true`);
  - maybe `catalogGroupBy` (stretch; not v1 unless trivial).
- [ ] Catalog v1 includes main-table items only; secondary-table items are a follow-up.
- [ ] Reuse the print page size from Sprint 2 (default 5.5×8.1in).
- [ ] Render static, escaped catalog HTML:
  - cover/title block? Prefer authored page content; plugin inserts item sheets only.
  - item cards with image, label, selected metadata;
  - chunked `.catalog-sheet` pages;
  - no interactive controls.
- [ ] Add warnings to `mirla-report.txt` for missing images/fields and skipped items.
- [ ] Add pure tests for field selection, sorting, chunking, escaping, ref rendering.

### 3.2 Theme

- [ ] Add `page-catalog.hbs` and register `"catalog": "Printable Catalog Template"` in `config.json`.
- [ ] Add `assets/js/catalog.js`: wait for fonts + images, then start Paged.js.
- [ ] Add catalog print CSS (grid, cards, rules, folios, running headers, image treatment).
- [ ] Reuse the shared print base from Sprint 2.
- [ ] Add an editor placeholder style for `[MIRLA_CATALOG]` if useful.
- [ ] Add a documentation page/section: create page → select template → write cover/intro → insert placeholder → publish → print to PDF.
- [ ] Verify no change to `page-print.hbs` output.

### 3.3 Acceptance

- A page with the catalog template and `[MIRLA_CATALOG]` renders all main items in a static, print-ready layout.
- Browser print/PDF has correct page breaks, folios, and running heads.
- Images load before pagination; no blank pages from late image loads.
- Items are not split across pages; no content is lost.
- The catalog works in Publii preview and full publish.
- The zine workflow is unchanged.
- Tests cover the pure catalog logic.

**Out of scope:** selected/filtered catalogs, QR codes, automatic indexes with page numbers, multi-volume catalogs, secondary-table items. These are follow-ups.

---

## Sprint 4 — Data editor: spike, then Svelte port

**Goal:** keep the exact editor functionality, but make it maintainable and still a single double-clickable HTML file.

### 4.1 Feasibility spike (go/no-go)

- [ ] Create a minimal `data-editor/` Svelte 5 + Vite app.
- [ ] Add `vite-plugin-singlefile` (or a small custom inliner) and build one HTML file.
- [ ] Open it via `file://` in Chrome, Firefox, and Safari.
- [ ] Verify:
  - ES modules/inlined bundle execute from `file://`;
  - `<dialog>`, `<details>`, file inputs, drag/drop work;
  - `FileReader`, `Blob`, `URL.createObjectURL`, download links work;
  - canvas `toBlob('image/webp')` works or degrades as today;
  - JSZip generates a ZIP from `file://`;
  - PapaParse parses local CSV files;
  - the output is a single file with no runtime CDN calls;
  - size is acceptable (target < 3 MB).
- [ ] Record the result in `diary.md`. If any blocker is fundamental, stop and keep the current editor; document why.

### 4.2 Port

- [ ] Scaffold `data-editor/` with Svelte 5, Vite, Vitest.
- [ ] Extract pure core modules and tests (see `testing.md` §4.6).
- [ ] Components:
  - `App`, `MenuBar`, `Tabs`, `ProtocolTable`, `ProtocolRow`, `MetadataTable`, `MetadataRow`, `Pagination`, `GalleryPanel`, `GalleryGrid`, `ImagePickerModal`, `ProgressModal`, `HelpModal`.
- [ ] State: `core/state` (runes or a small store) with the same JSON shape.
- [ ] i18n: move the ES/EN dictionary to modules; preserve strings.
- [ ] Images: `SvelteMap`/explicit versioning for `File` and preview maps; same matching behavior.
- [ ] Export: JSZip + canvas WebP + thumbnail generation + CSV/BOM + project JSON.
- [ ] Help content: preserve and update only if needed.
- [ ] Build to a single HTML file; keep the root `MirlaDataEditor.html` as the distributable (decision pending).
- [ ] Add a parity checklist and test it manually against the current editor using the fixture.
- [ ] Add the editor build to CI/release.

### 4.3 Parity checklist

- [ ] Spanish/English toggle.
- [ ] Dark/light toggle.
- [ ] Protocol table: add/edit/delete, fixed pid/label, type + ref target, descriptions, pagination, per-page.
- [ ] Metadata table: add/delete rows, PID prefix, duplicate warnings, pagination, per-page.
- [ ] Tabs: add group, switch, gallery tab.
- [ ] Image gallery: drop files/folders, previews, count, unassigned filter.
- [ ] Image picker: multi-select, save, clear, main image badge.
- [ ] CSV import: protocol and metadata detection, alerts.
- [ ] Project JSON: save/load, legacy `__main_image` migration, image warning.
- [ ] Export: WebP/raw, main/thumb images, CSV names/BOM/escaping, ZIP name.
- [ ] Progress modal and error handling.
- [ ] Help modal content.
- [ ] Same behavior on `file://` with no network.

### 4.4 Acceptance

- The new editor reproduces every checklist item.
- It is a single HTML file, double-clickable, with no CDN dependency.
- Pure core tests pass.
- A project exported by the old editor loads in the new one, and vice versa (where the JSON shape is compatible).
- A collection exported by the new editor is accepted by the plugin and produces the same pages as the old editor's export.
- If the spike fails, the current editor remains and the reason is documented.

**Out of scope:** new editing features, undo/redo, image persistence in project JSON, visual redesign, cloud sync.

---

## Sprint 5 — Release pipeline, docs, cleanup

- [ ] CI: test + build components + build editor; zip plugin/theme; upload the editor.
- [ ] Exclude generated/dev files from zips.
- [ ] Remove stale `input/themes/mirlaTheme/zine.js` (after reference check).
- [ ] Remove stale `input/config/plugins/Mirla.json` (after reference check).
- [ ] Extract the duplicated `MIRLA_CONTEXT` script into a partial.
- [ ] Fix documentation drift (prop names, plugin options, font instructions, editor ZIP name).
- [ ] Add a short "developer quickstart" to README.
- [ ] Optional: self-host Pico/Shoelace/OpenSeadragon/world atlas for offline workshops.
- [ ] Optional: item-page SEO/sitemap improvements.
- [ ] Tag a release only after a manual end-to-end workshop dry run.

**Acceptance:**

- A clean clone can install, test, build, and release with documented commands.
- The release assets match the source in the repository.
- No stale duplicate copies remain.

---

## Decisions

Resolved:

1. **Plugin symlink:** approved and applied in Sprint 0. The installed plugin was backed up to `plugin-backups/mirlaPlugin-20261026-101249` and replaced with a symlink to the repo.
2. **Catalog defaults:** confirmed — 2 columns, 6 items/page, fields `label,autores,fecha,medio_impresion`, main images, grayscale, `label` ascending.
3. **Catalog scope:** main table only for v1.
4. **Fonts:** self-hosted bundled fonts (preferred over Google Fonts presets). Google Fonts remains only as a legacy/advanced source.
5. **Push policy:** push after each sprint, but only after explicit approval. No automatic pushes.

Still open (needed before the relevant sprint):

6. **Editor artifact:** keep the built `MirlaDataEditor.html` tracked at the repo root (current behavior), or build only into releases? Proposed: keep the root artifact for workshop convenience, generated by CI.
7. **Color customization:** add custom primary color pickers, or stay with Pico color versions? Proposed: add optional pickers with a contrast warning.
8. **Custom font uploads:** bundled presets + custom `@font-face` CSS for now; investigate a Publii upload field only if it supports woff2 cleanly.

---

## Definition of done (every sprint)

- Acceptance criteria met.
- Pure-function tests added/updated and passing.
- Manual visual parity check (if UI) recorded in `diary.md`.
- A real Publii preview + full publish completed (if plugin/theme).
- Documentation updated (`README`, `DesarrollarComponentes.md`, `design-system.md`, or `architecture.md` as relevant).
- `diary.md` entry appended with what changed and why.
- `plan.md` updated: current sprint status and next sprint.
- No generated artifact hand-edited.
