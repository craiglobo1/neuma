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
- Exported all public classes from `src/index.ts`.

## Verification

- Added `package.json` and `tsconfig.json` for the standalone TypeScript library workflow.
- Installed local TypeScript with `npm.cmd install`.
- Verified the IR with `npm.cmd run typecheck`, which runs `tsc --noEmit`.
