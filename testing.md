# Mirla Testing — Test Boundaries

> Status: planning (no implementation yet). Branch: `agent-dev`.
> Last reviewed: 2026-10-26.

Testing exists to protect **data behavior**, not to freeze pixels. Mirla is a workshop tool used with real, messy collections; the highest-value tests are the pure transformations that turn CSVs into a trustworthy data payload and back.

---

## 1. Non-negotiable boundaries

### We test

- Pure functions and data models:
  - CSV parsing/normalization (BOM, headers, empty rows, dynamic types).
  - Protocol validation (allowed types, `ref:Table`, missing attributes).
  - Metadata validation (required `pid`/`label`, duplicate PIDs, type checks, reference resolution).
  - Image resolution (single file, folder gallery, thumbnails, extension casing, unsupported files).
  - Data normalization used by components (refs → labels, scalar/array handling, search/filter/sort, coordinates, dates).
  - Catalog page planning (sorting, field selection, chunking items into sheets, escaping).
  - Editor transformations (import detection, protocol/metadata merge, PID generation, image matching, export paths/names, CSV escaping).
  - File naming and manifests (plugin ZIP contents, theme bundle path, single-file editor constraints).

### We do not test

- Visual rendering, CSS layout, colors, spacing, or typography.
- Screenshot/DOM snapshot tests of components or pages.
- Pixel positions of D3/SVG/canvas output.
- Hover/transition behavior.
- Browser-specific print pagination of Paged.js.
- End-to-end clicking through Publii's Electron UI.
- The presence of specific HTML class names or markup structure, unless it is part of a data contract (e.g., a required placeholder token).

These are brittle, slow, and do not protect the contract that matters. Visual parity is verified manually with the protocol in `design-system.md` §11.

---

## 2. Test stack

| Area | Runner | Environment | Notes |
|---|---|---|---|
| Plugin pure functions | Vitest | Node | CommonJS modules; no Publii app needed |
| Component data helpers | Vitest | Node | ESM; no DOM required |
| Editor core | Vitest | Node | ESM; no DOM/canvas |
| Builds | CI script | Node | `npm ci && npm test && npm run build` |

Do not add Playwright/Cypress/JSDOM for visual or layout testing. If a future feature genuinely requires a browser API, isolate it behind an adapter and test the pure part.

Commands (component tests exist as of Sprint 1):

```bash
# Plugin
cd mirlaPlugin && npm test

# Components (Vitest, 30 tests)
cd svelte-components && npm test

# Editor
cd data-editor && npm test
```

At the repository root, a `scripts/test-all.sh` can run the three suites for CI.

---

## 3. What to extract first

Tests are only possible after the monolithic code is split into pure modules. The refactor order is therefore:

1. **Plugin** — extract `lib/csv.js`, `lib/validate.js`, `lib/media.js`, `lib/render.js`, `lib/catalog.js` from `main.js`.
   - `main.js` keeps only the Publii lifecycle: hooks, file paths, `fs` reads/writes, and orchestration.
   - Pure functions receive already-read strings/rows/options and return plain objects.
2. **Components** — extract `src/lib/data.js`, `src/lib/format.js`, `src/lib/palette.js`.
   - No `window` access in the pure modules; the caller passes `collection` and `context`.
3. **Editor** — extract `src/core/csv.js`, `src/core/state.js` (pure reducers), `src/core/images.js` (pure matching/planning), `src/core/export.js` (pure path/name planning).
   - Canvas/WebP/ZIP calls stay in browser adapters and are not unit-tested.

This is also the architecture boundary: if a function needs `fs`, `window`, `document`, or a Publii renderer, it is orchestration, not a test target.

---

## 4. Priority test cases

### 4.1 Protocol parsing

- Reads `Attribute`, `Type`, and `Description` (and the accepted description aliases).
- Trims attribute names; preserves type casing (`ref:Tecnica`).
- Unknown type falls back to `text` (or is reported, depending on the chosen behavior; document it).
- Empty rows are skipped.
- Duplicate attributes: last one wins or error? Current behavior overwrites; keep and test.
- BOM-prefixed file parses correctly.
- Missing protocol file is a fatal orchestration error (not a pure test).

### 4.2 Metadata parsing and validation

- BOM-prefixed file parses correctly.
- Rows without `pid` are skipped and counted.
- Duplicate main PIDs are detected (fatal).
- `pid` is coerced to a string (including numeric-looking IDs).
- `label` is required? The current plugin does not enforce it; document and decide. Test the chosen behavior.
- Number type: numeric string passes, non-numeric fails.
- Link type: requires `http://` or `https://`.
- YouTube type: requires an ID, not a full URL (current behavior; note the docs inconsistency).
- `ref`: missing target PID produces a warning, but the raw PID is preserved.
- `ref:Table`: target stub is `{ pid, label, images }`; missing table/record falls back safely.
- Multiple refs separated by `/`, `,`, or `;` produce the expected string/array shape.
- Secondary table rows get `_collection_type`.

### 4.3 Image resolution

- `<pid>.jpg`, `<pid>.JPG`, `<pid>.png` resolve.
- Unsupported extension (`.tif`, `.pdf`) is ignored.
- Folder `images/<pid>/` resolves all supported files, sorted alphabetically.
- `_thumb.` files are excluded from gallery images.
- `<pid>_thumb.webp` / `_thumb.jpg` resolve as `thumb`; missing thumb is `null`.
- Public URL is built from the site domain and uses forward slashes (Windows backslash regression).
- Duplicate images are not emitted twice.

### 4.4 Component data helpers

- `toLabels` handles:
  - string with commas/semicolons;
  - array of strings;
  - array of `{pid,label}` stubs;
  - single stub object;
  - `null`/`undefined`/empty string/number.
- `filterItems`:
  - search is case-insensitive and covers display values;
  - filters match ref labels, not just pids;
  - empty filters mean "all";
  - multiple filters are ANDed;
  - search + filters combine.
- `getUniqueOptions` deduplicates, trims, and sorts; ignores empties.
- `sortItems` handles numbers, numeric strings, dates, and labels with accents consistently.
- `parseLatLong` accepts `"4.7110, -74.0721"` and rejects `"Bogotá"`, `"4.7"`, `"a,b"`, and empty values.
- `parseMirlaDate` accepts a 4-digit year, full ISO date, and numeric year; rejects invalid strings.
- `buildWaffleGroups`:
  - percentages sum to 100 cells;
  - groups over 10 are rolled into "Other";
  - zero valid values returns an empty result;
  - ties are deterministic.
- `buildNetworkGraph`:
  - repeated source/target pairs produce one link (current behavior) or weighted links (if changed; test the decision);
  - counts are accurate;
  - empty keys return an empty graph.
- `buildTreeRollup` uses `"N/A"` for missing values (current behavior).
- `getItemImage` prefers `thumb` only where the current component does; preview/compare use `images` directly. Preserve and test the intended rule per component.

### 4.5 Catalog

- Field selection excludes `pid`, `label`, `images`, `thumb`, `_collection_type`, and `_`-prefixed attributes.
- Sort is stable for equal keys and handles accents/numbers.
- Items are chunked into sheets with no item lost and no empty trailing sheet.
- Column count and items-per-page produce the expected sheet count (e.g., 13 items / 6 per page = 3 sheets).
- HTML escaping: `&`, `<`, `>`, `"`, `'` in labels and metadata.
- Refs render as labels, not raw JSON.
- Missing images produce a placeholder, not a broken `<img>`.
- Media-only types (image/video/audio/youtube) are omitted from metadata lists unless explicitly requested.
- Secondary-table items are excluded from the v1 catalog (documented behavior).
- A missing catalog placeholder leaves the page unchanged.
- The modifier does not replace `[MIRLA_CATALOG]` inside a `<code>`/escaped context incorrectly (integration-level; test the pure matcher if feasible).

### 4.6 Editor

- Protocol CSV detection: headers include `Attribute` and `Type`.
- Metadata CSV detection: everything else.
- Protocol import:
  - always creates fresh `pid`/`label` fixed fields;
  - normalizes whitespace to underscores;
  - ignores invalid types (falls back to `text`);
  - preserves descriptions;
  - prunes metadata keys that are no longer in the protocol;
  - preserves `id` and `__main_images`.
- Metadata import:
  - adds missing protocol attributes as `text`;
  - trims values;
  - generates PIDs for rows missing one, using the prefix and next available number;
  - pads to 3 digits (current behavior).
- PID generation:
  - handles non-numeric suffixes gracefully;
  - does not collide with existing PIDs;
  - respects the current prefix.
- Image matching:
  - single file `OBJ-001.jpg` → main image for `OBJ-001`;
  - folder `OBJ-001/` → gallery for `OBJ-001`;
  - matching is case-sensitive (current behavior; document);
  - folder names and filenames with multiple dots work;
  - assigned images are removed from the "unassigned" set.
- Export planning:
  - single image → `images/<pid>.<ext>`;
  - gallery → `images/<pid>/<original-base>.<ext>`;
  - thumbnail → `..._thumb.webp`;
  - WebP and raw modes;
  - deduplication by output name;
  - CSV file names for main and secondary tabs;
  - BOM is added to CSV output;
  - CSV escaping for commas, quotes, newlines;
  - ZIP file name per language (preserve the current quirk or fix it explicitly).
- Project JSON:
  - round-trips the current state shape;
  - migrates legacy `__main_image` to `__main_images`;
  - rejects invalid structures;
  - does not claim to persist images.

### 4.7 Release/build

- The component build writes `input/themes/mirlaTheme/assets/js/mirla-components.js`.
- The plugin ZIP contains `plugin.json`, `main.js`, `item-template.html`, `lib/**`, `papaparse.min.js`, `osd_icons/**`, `LICENSE`.
- The theme ZIP contains templates, partials, assets, config; excludes `.DS_Store`, `node_modules`, and stale generated files.
- The editor build produces exactly one self-contained `MirlaDataEditor.html` with no external `script src`/`link href` (except optionally fonts; the target is fully self-contained).
- A smoke check can assert that the built editor HTML has no `http://`/`https://` runtime dependencies (pure string check, not a browser test).

---

## 5. Fixtures

Create a small, synthetic fixture collection under `fixtures/collection/` (not the real Mirla collection):

```text
fixtures/collection/
├── Protocol.csv
├── Metadata.csv
├── Protocol_Tecnica.csv
├── Metadata_Tecnica.csv
└── images/
    ├── item-001.jpg
    ├── item-001_thumb.webp
    ├── item-002/
    │   ├── 01.jpg
    │   └── 02.jpg
    └── item-003.png
```

Requirements:

- At least one item with multiple refs.
- At least one `ref:Table` stub.
- At least one missing image.
- At least one long label with accents and punctuation.
- At least one numeric-looking PID.
- At least one duplicate PID case in a separate "invalid" fixture.
- No real personal data or copyrighted images. Use tiny generated placeholders.

The fixture is used by plugin tests and by the component dev harness. Keep it in version control; it is small.

---

## 6. CI gates

A change is mergeable when:

- [ ] `npm test` passes for the affected package(s).
- [ ] The component build succeeds (`svelte-components`).
- [ ] The editor build succeeds (once it exists).
- [ ] The plugin loads in a real Publii preview (manual, recorded in `diary.md`).
- [ ] No generated artifact was hand-edited.
- [ ] The change is recorded in `diary.md`.

Add a `ci.yml` workflow for pushes/PRs (tests + builds, no release) and keep the release workflow for tags/manual dispatch.

---

## 7. Test-writing rules

- Test behavior, not implementation details. Do not assert that a helper calls another helper.
- One `describe` per module; test names read as sentences.
- Use table-driven tests (`it.each`) for type/format matrices.
- Keep fixtures inline for small cases; use the shared fixture only when file structure matters.
- No network, no timers, no random values, no current date. Freeze inputs.
- Do not snapshot entire objects unless the object is the contract; assert the fields that matter.
- When a behavior is intentionally quirky (e.g., a single ref is a string, multiple refs are an array), write a test that names it as a compatibility guarantee.
- If a bug fix changes a quirk, update the test and note it in `diary.md`; do not silently "clean up" the contract.

---

## 8. Manual verification (not automated)

These are release checklists, not tests:

1. Publii plugin loads from the symlinked source; preview + full publish complete.
2. `mirla-report.txt` reports success for the fixture and warnings for the invalid fixture.
3. Item pages render images, metadata, refs, and OpenSeadragon controls.
4. Every custom element renders in the dev harness in dark/light and at 320/768/1440px.
5. A zine page prints correctly (Paged.js, footnotes, page numbers, canvases).
6. A catalog page prints correctly with all items, no orphaned cards, correct folios.
7. The data editor opens by double-click from `file://`, imports/exports the fixture, and re-imports its own ZIP into a clean Publii site.
8. Offline check: the editor and catalog work without network (catalog fonts may fall back; document).
