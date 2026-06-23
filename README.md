# Neuma

Neuma is a TypeScript library for representing Gregorian chant as a semantic intermediate representation. It is designed as a native editor model rather than as an engraving format, so text, music, alignment, editorial data, layout preferences, and source attachments are stored as separate planes.

The current package is an MVP IR layer. It does not render SVG yet, parse GABC yet, or choose chant glyph shapes. It gives renderer, importer, and editor code a stable document model to build on.

## Install

Install dependencies:

```powershell
npm.cmd install
```

Use `npm.cmd` on PowerShell if `npm` is blocked by script execution policy.

## Build And Check

Typecheck without emitting files:

```powershell
npm.cmd run typecheck
```

Build JavaScript and declaration files into `dist/`:

```powershell
npm.cmd run build
```

## Library Shape

The top-level `ChantDocument` contains these planes:

- `metadata`: document title, language, mode labels, source references, rights, and provenance.
- `text`: text blocks, words, syllables, and reusable text spans.
- `music`: staves, voices, events, neume groups, notes, and phrase regions.
- `alignment`: explicit links between text spans and music targets.
- `editorial`: annotations, variants, and project-only user groups.
- `layoutPrefs`: semantic layout intent such as breaks, spacing, and visibility.
- `attachments`: external source attachments such as GABC mapping data.
- `operationLog`: semantic operation records for future editor commands.

## Quick Example

```ts
import {
  MusicTarget,
  StaffPitch,
  attachTextToMusic,
  createEmptyChantDocument,
  createNeumeGroup,
  createStaff,
  createSyllable,
  createVoice,
  getTextForEvent,
  getVoiceEvents,
  validateChantDocument,
} from "neuma";

const doc = createEmptyChantDocument({ id: "doc_sample" });

const staff = createStaff(doc, { label: "Main staff" });
const voice = createVoice(doc, { staffId: staff.id, name: "Chant" });

const syllable = createSyllable(doc, "Ky", {
  wordId: "word_kyrie",
  blockId: "text_main",
});

const group = createNeumeGroup(doc, {
  voiceId: voice.id,
  notes: [
    { pitch: new StaffPitch(0), sign: "punctum" },
    { pitch: new StaffPitch(1), sign: "punctum" },
  ],
});

attachTextToMusic(doc, {
  syllableIds: [syllable.id],
  musicTargets: [new MusicTarget(voice.id, group.event.id)],
});

const validation = validateChantDocument(doc);
const events = getVoiceEvents(doc, voice.id);
const eventText = getTextForEvent(doc, voice.id, group.event.id);

console.log(validation.valid);
console.log(events.length);
console.log(eventText[0]?.text);
```

## Included Fixture

The package includes a small monophonic Kyrie fixture:

```ts
import { kyrieExampleDocument } from "neuma";
```

It contains a C clef, one chant voice, two neume groups, a bar, lyric syllables, and explicit alignment links.

## Local Smoke Test

After building, you can test the compiled CommonJS output from this repository:

```powershell
node -e "const n=require('./dist'); const r=n.validateChantDocument(n.kyrieExampleDocument); console.log(r.valid)"
```

Expected output:

```text
true
```

## Important Modules

- `src/document`: top-level document, metadata, attachments, operation log.
- `src/text`: text plane classes.
- `src/music`: staff, voice, event, neume group, and note classes.
- `src/alignment`: many-to-many text/music alignment classes.
- `src/editorial`: annotations, variants, and user groups.
- `src/layout`: semantic layout preference classes.
- `src/adapter/gabc`: lossless GABC source attachment and projection mapping classes.
- `src/operations`: document-level helpers for creating and wiring common semantic objects while preserving cross-plane references.
- `src/query`: renderer-facing IR queries and clef-relative staff position helpers.
- `src/validate`: document integrity validation.
- `src/examples`: test fixtures.

## Current Scope

Implemented:

- Semantic IR classes.
- GABC attachment/source-mapping classes.
- Operation helpers for common document construction.
- A Kyrie example document.
- Validation helpers.
- Query helpers for renderer-facing traversal and lookup.
- TypeScript build and declaration output.

Not implemented yet:

- GABC parser/exporter.
- SVG renderer.
- Glyph selection and engraving rules.
- Persistence format versioning.
- Automated test runner.
