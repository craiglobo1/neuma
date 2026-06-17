# Development Notes

## Chant IR MVP

- Implemented the semantic chant IR described in `chant-ir-report.md` as TypeScript classes under `src/`.
- Added common identity, rich text, source reference, target reference, source span, and fidelity report models in `src/common.ts`.
- Added plane models for text, music, alignment, editorial overlays, layout preferences, and the top-level chant document.
- Added explicit many-to-many alignment support through `AlignmentLink`, `MusicTarget`, and `AlignmentPolicy`.
- Added chant-specific music entities for staves, voices, clefs, accidentals, bars, custos, neume groups, notes, phrase regions, ornaments, rhythmic signs, and notation/editorial hints.
- Added GABC attachment/source-mapping classes for a lossless CST, projection mappings, residual fragments, and import fidelity reports.
- Added an operation log scaffold on `ChantDocument` with MVP semantic operation names so later editing commands can be recorded without relying on raw state mutation.
- Added `kyrieExampleDocument` in `src/examples/kyrie.ts` as a concrete monophonic test fixture from the report.
- Added document factory helpers in `src/factory/index.ts` for creating documents, staves, voices, syllables, neume groups, and text-to-music alignment links without hand-wiring every dictionary.
- Added renderer-facing IR utilities in `src/query/index.ts` for voice event traversal, event ranges, neume/note expansion, alignment lookup, text lookup, active clef lookup, and clef-relative staff position calculation.
- Added document integrity validation in `src/validate/index.ts` for text, music, alignment, editorial, and layout preference references.
- Exported all public classes from `src/index.ts`.

## Verification

- Added `package.json` and `tsconfig.json` for the standalone TypeScript library workflow.
- Installed local TypeScript with `npm.cmd install`.
- Verified the IR with `npm.cmd run typecheck`, which runs `tsc --noEmit`.
- Verified emitted CommonJS output with `npm.cmd run build` and a Node smoke test against `kyrieExampleDocument`, `validateChantDocument`, `getVoiceEvents`, `getTextForEvent`, and `getStaffPosition`.
