# Neuma Agent Guide

## Start Here

Neuma is a TypeScript library for Gregorian chant editing. The durable source of truth is `ChantDocument`: semantic chant state split into planes. GABC, layout, SVG, playback, and future exports are projections from that document.

When editing code, keep this mental loop:

1. Build or mutate semantic data in `src/document`, `src/text`, `src/music`, `src/alignment`, `src/editorial`, `src/layout`, or `src/operations`.
2. Read semantic data through `src/query`.
3. Check cross-plane references with `src/validate`.
4. Derive positions in `src/layout/visual.ts`.
5. Render derived layout in `src/render-svg`.
6. Cover behavior in `test/run-tests.js` and fixtures in `src/examples`.

Do not treat GABC, SVG, array order, source offsets, or layout coordinates as native document truth.

## Semantic Invariants

The document has these persistent planes:

- `metadata`: title, language, office part, occasion, mode labels, commentary, source refs, rights, provenance, custom data.
- `text`: blocks, words, syllables, and reusable text spans.
- `music`: staves, voices, ordered music events, neume groups, notes, and phrase regions.
- `alignment`: links from text spans to one or more music targets.
- `editorial`: annotations, variants, and user groups.
- `layoutPrefs`: semantic layout intent only; no coordinates.
- `attachments`: source mapping and adapter-owned data.
- `operationLog`: future semantic edit history.

Keep these rules intact:

- Text owns text. It should not know about neumes, clefs, staff positions, or layout coordinates.
- Music owns chant events. It should not know about lyric text placement.
- Alignment owns underlay. Do not nest music under syllables as native truth.
- Layout preferences may persist user intent, but never concrete rendered coordinates.
- Attachments may preserve source syntax and spans, but source syntax must not reshape the semantic core.

## IDs And References

Use stable opaque IDs for persistent objects. Current fixtures use readable IDs such as `staff_main`, `voice_chant`, `evt_ng_ky`, `ng_ky`, `note_ky_1`, `span_ky`, and `aln_ky`.

Do:

- Add objects to the relevant dictionary before referencing them.
- Keep `Voice.eventIds` in the intended musical order.
- Keep `NeumeGroup.noteIds` in performed/visual group order.
- Keep `TextWord.syllableIds` and `TextBlock.orderedSpanIds` in text order.
- Use `MusicTarget(voiceId, fromEventId, toEventId?)` for event ranges.
- Update validation when adding a new reference-bearing type.

Do not:

- Use array indexes as persistent identity.
- Use source offsets as semantic IDs.
- Use layout IDs as semantic IDs.
- Add references that `validateChantDocument` cannot check.

## API Depth

Prefer deep modules over shallow classes:

- Keep semantic record classes and types simple. Do not add behavior to individual records when the behavior must preserve cross-plane invariants; put that behavior in document-level edit operations instead.
- Make `src/operations`, future focused edit modules, `src/query`, and `src/validate` do real work behind small APIs. Callers should not have to manually coordinate dictionaries, ordered ID lists, alignment links, operation logs, and validation.
- Avoid adding thin manager/service classes that only forward CRUD operations to one plane. Add a new abstraction only when it hides meaningful policy, preserves invariants, or answers a semantic question that would otherwise require repeated cross-plane traversal.
- If outside code needs several dictionary lookups to perform a normal chant-editing task, add a deep query or operation rather than spreading that traversal through callers.


## Layout Engine Notes

`layoutChant(document, { width, pxPerStaffSpace })` returns a `LayoutDocument`.

Current layout constraints:

- one system only,
- one primary staff and one primary voice for actual event layout,
- four-line rendered staff,
- staff-space units converted later by SVG scale,
- fixed constants for staff top, gaps, note size, lyric baseline, and bars,
- simple text measurement via string length,
- sorted glyph output for deterministic SVG,
- semantic-to-layout indexes for notes, neume groups, text spans, voices, and syllables.

When changing layout:

- Keep output deterministic.
- Preserve `layout.schema === "neuma.layout"` and version expectations unless intentionally migrating.
- Add layout diagnostics instead of silently ignoring important unsupported states.
- Keep `LayoutDocument.index.semanticToLayoutIds` useful for hit testing and editor lookup.
- Do not mutate `ChantDocument`.
- Keep lyric placement and melisma extents derived from alignment links.
- Keep coordinates in staff-space units until render time.

Current tests expect:

- `layoutChant(kyrieExampleDocument, { width: 80 })` creates one system.
- semantic IDs map to layout IDs.
- clef and note y positions reflect active clef.
- melismas attach multiple layout neumes and get `melismaExtent`.
- repeated renders are byte-for-byte identical.

## SVG Renderer Notes

`renderSvg(layout)` returns a string. `writeSvgFile(layout, filePath)` writes it and returns the same string.

Renderer behavior to preserve:

- SVG root includes layout/source document IDs.
- Glyph definitions are emitted as `<symbol>` entries.
- Glyph instances use `<use>` unless rendering barlines.
- Semantic IDs are copied into `data-semantic-id`.
- Neumes and syllables get transparent hit boxes.
- Text and attributes are escaped.
- Glyph assets load from `assets/svg` by `defKey` using `GLYPH_ASSET_NAMES`.
- Fallback symbol bodies exist for missing assets.

When adding glyphs, update both layout `defaultGlyphDefs` and renderer `GLYPH_ASSET_NAMES` if an asset exists. Tests may assert asset metadata such as `data-exsurge-glyph`.

##  Guardrails

- Text-to-music alignment must remain explicit and many-to-many.
- Voices must be first class even while MVP rendering is monophonic.
- Neumes need pitch sequence plus sign/hint data; glyph name alone is insufficient.
- Bars and phrase regions should stay separate.
- Do not make GABC  the native model.
- Do not make syllables contain music as the only source of underlay truth.
- Do not encode simple-polyphony workarounds as native semantics.
- Do not put SVG coordinates back into semantic nodes.
- Do not tie persistent IDs to array order, source offsets, or layout IDs.
- Do not add new references without validator coverage.
- Do not add WebGL, WASM, or a new rendering stack before profiling real bottlenecks.
