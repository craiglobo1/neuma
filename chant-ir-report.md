# Native IR for a Gregorian Chant Visual Editor

## What the existing ecosystems actually assume

Historically, Gregorian chant notation is text led. Neumes are not just generic notes placed on a staff; they are groups whose primary function is to “sonify” text, and the chant tradition treats phrase marks, clefs, custos, liquescent forms, quilisma, bars, and rhythmic signs as integral features of that notation system rather than as incidental engraving details. In the modern teaching tradition represented by the classic Solesmes approach, chant is not measured in the sense of modern bar based notation, barlines primarily mark phrase boundaries, the four line staff uses moveable C and F clefs, the usual accidental is B flat with scope limited by word or barline, the custos is a cue rather than a sounded note, and signs such as the horizontal episema, vertical episema or ictus, quilisma, and liquescent forms have specific notational and interpretive roles. Those descriptions are not universal truths for all chant scholarship, but they do reflect the conventions behind much twentieth century square note engraving and many current chant books. citeturn25view1turn26view1turn26view2turn26view4turn26view5turn27view0

GABC and Gregorio are extremely useful, but their assumptions are narrower than the editor you want. The official GABC documentation describes the format as an ASCII notation for Gregorian chant, with a basic structure of header fields followed by a syntax of clef plus `text(notes)`. In ordinary usage, each syllable is followed by the note sequence attached to it; bars that occur between syllables are encoded as separate pseudo syllables; lyric centring is based on vowel finding conventions; and a good deal of layout behaviour enters the source through manual spacing, manual line breaks, translation spans, above line text, braces, and even verbatim TeX insertion. That makes GABC excellent as a chant engraving notation, but not a sufficient source of truth for a richer visual editor. citeturn1view0turn11view0turn11view1turn14view2turn14view3turn14view4turn15view0

The limits become sharper once you go beyond monophonic chant. Gregorio explicitly says serious polyphonic chant typography is not really supported; its “simple polyphony” syntax places one vertically aligned note group in curly braces, requires those notes to come first, ignores them for spacing, performs no collision avoidance, and still bases automatic custos on the first note of the next syllable. That is a useful escape hatch, not a first class multi voice model. Similarly, GABC treats elision as a syllable without notes that is sung as part of an adjacent syllable, which is helpful, but it is still a special case inside a basically syllable to note string syntax rather than a general text to music alignment graph. citeturn1view2turn31view3

MEI is much closer to the semantic world you want than GABC. In the neumes module, MEI says that neume notation may be thought of as “neumed text”, that the `syllable` element is the fundamental unit of structure, that a syllable may contain one or more neumes, and that `syllable` is the primary organisational element within a `layer`. MEI also defines `layer` as an independent stream of events on a staff, allows critical apparatus and editorial markup such as `app`, `lem`, and `rdg`, and provides direct support for neume specific elements such as `neume`, `nc`, `divLine`, and custos. That is powerful, but it is still primarily syllable centric: the core model assumes music lives inside syllables, and the MEI neume customisation even disallows `neume` as a direct child of `layer`. For your editor, that is an important clue: MEI is an excellent interchange target, but a stricter native underlay graph is still useful if you want many to many text and music alignment. citeturn6view0turn1view3turn6view1turn6view2turn6view3turn19view2turn19view3turn20view0turn20view2

MusicXML is even less chant native. Its basic abstraction is a linear sequence of notes, lyrics, and voices. A lyric is attached to a `note`; a voice is a linear sequence of events; and multiple voices in one part are coordinated with `backup` and `forward`. MusicXML is excellent for modern notation interchange, but it offers no native neume vocabulary and no chant specific syllable container comparable to the MEI neume module. In practice, that makes MusicXML a projection target, not a strong internal model for chant editing. citeturn23view0turn23view1turn23view2turn23view3turn28view0

Exsurge and Verovio are useful architectural precedents for the rendering side. Exsurge exposes a pipeline where GABC is loaded into a `ChantScore`, layout is performed, chant lines are laid out, and a drawable SVG is produced. Verovio similarly takes symbolic input such as MEI and renders it to SVG; the MEI hierarchy is preserved in the SVG, it exposes an experimental edit API, and it can map semantic element IDs to rendered pages and to playback times after MIDI rendering. Those tools strongly support a layered architecture where semantic document state is kept separate from deterministic layout and final rendering. They are useful models for the rendering boundary, even if neither gives you the exact native editor IR you need. citeturn3view0turn18view0turn18view1turn18view2turn17view0

## The architecture that fits your requirements

The most practical answer is a six plane architecture: metadata plane, text plane, music plane, alignment plane, editorial overlay plane, and layout preference plane. Source adapters and playback adapters should sit beside those planes, not inside them. That architecture directly satisfies your stated separation goals and also avoids the chief failure mode of both GABC shaped and MEI shaped editor models, namely, making text containment do the work that should be done by an explicit underlay relation. The recommendation here is my design judgement, but it is grounded in the fact that GABC is syntax and layout aware, MEI is syllable centric, MusicXML is note centric, and modern editors benefit from explicit change operations, source spans, and derived view state rather than mixing those concerns together. citeturn11view0turn15view0turn6view0turn20view2turn23view0turn21view0turn21view1turn22search5

The metadata plane should contain only document level information: title, liturgical category, language, source references, mode labels, editorial responsibility, rights, and project settings. GABC headers such as `mode`, `annotation`, `commentary`, `office part`, `occasion`, `manuscript`, and `transcriber` clearly belong here, not in the music graph itself. Some of those fields have direct rendering consequences in Gregorio, but in your native model they should remain plain metadata plus optional projection rules. citeturn24view0turn24view1turn24view2

The text plane should own words, syllables, elisions, punctuation, verse boundaries, and optional normalised or diplomatic forms. It should not know anything about neumes or clefs. A syllable may exist without music; music may exist without text; and a word can span many syllables. This is where you preserve text underlay as text, rather than as a by product of note grouping. GABC’s treatment of bars as pseudo syllables and elisions as markup inside syllable text is a strong sign that source syntax should not dictate the native text model. citeturn11view0turn11view1turn31view3

The music plane should own voices or layers, clefs, accidentals, bars, custos hints, neume groups, notes, and chant specific sign information. Voices must be first class even if most documents use only one. A monophonic chant is then just the special case of one voice on one staff. This mirrors MEI’s concept of `layer` as an independent stream of events and avoids Gregorio’s ad hoc curly brace polyphony. citeturn20view0turn20view2turn1view2

The alignment plane is the heart of the design. Instead of nesting neumes under syllables, make text to music attachment a first class graph. The minimum object is an alignment link between a text span and one or more music spans. A text span may be one syllable, several syllables, or an elision group. A music span may be one neume group, several groups in the same voice, or a bundle of simultaneous spans in multiple voices. This immediately solves all the cases you listed: one syllable with one neume, one syllable with multiple neumes, one syllable with simultaneous material in several voices, a melisma across several neume groups, and a shared gesture spread across several syllables. MEI gets part of the way there by allowing multiple neumes inside a syllable and by providing linking attributes, but your editor should make that many to many relation explicit rather than implicit. citeturn6view0turn6view1turn20view2

The editorial overlay plane should contain annotations, variants, alternate readings, source specific corrections, uncertainties, user groups, and analysis not essential to the performed chant stream. MEI’s `app`, `lem`, and `rdg` are a good precedent for variant modelling, but an editing application benefits from storing such material as overlays referencing stable semantic IDs, because inline wrappers make editing operations much more fragile. citeturn6view3turn20view1

The layout preference plane should hold user intent that affects engraving but is still semantic enough to persist: preferred system breaks, avoid break ranges, staff visibility, layer visibility, compacting preferences, brace or grouping intent, and print profile settings. It should not contain coordinates. Gregorio’s documentation is full of manual line break and spacing interventions; that is precisely the sort of thing that should be represented as declarative preferences in your editor, then consumed by a disposable layout engine. citeturn15view0turn13view2turn18view0turn3view0

## The native editable document IR

The core document should be semantic first and React friendly. The following model is the one I would actually implement.

```ts
type Id = string

type ChantDocument = {
  id: Id
  revision: number
  metadata: DocumentMetadata
  text: TextPlane
  music: MusicPlane
  alignment: AlignmentPlane
  editorial: EditorialPlane
  layoutPrefs: LayoutPreferencePlane
  attachments?: ExternalAttachmentIndex
}

type DocumentMetadata = {
  title?: string
  language?: string
  officePart?: string
  occasion?: string
  modeLabel?: string
  modeModifier?: string
  modeDifferentia?: string
  commentary?: RichTextBlock[]
  annotationLines?: RichTextBlock[]
  sourceRefs?: SourceReference[]
  rights?: RightsInfo
  provenance?: ProvenanceInfo
  custom?: Record<string, unknown>
}

type TextPlane = {
  blocks: TextBlock[]
  syllables: Record<Id, TextSyllable>
  words: Record<Id, TextWord>
  spans: Record<Id, TextSpan>
}

type TextBlock = {
  id: Id
  kind: "chantText" | "translation" | "annotation" | "commentary"
  orderedSpanIds: Id[]
}

type TextWord = {
  id: Id
  syllableIds: Id[]
  normalisedText?: string
  diplomaticText?: string
}

type TextSyllable = {
  id: Id
  wordId?: Id
  text: string
  role: "lyric" | "punctuation" | "elision" | "editorial"
  elidesWithPrev?: boolean
  elidesWithNext?: boolean
  underlayHints?: UnderlayHint[]
}

type TextSpan = {
  id: Id
  syllableIds: Id[]
  label?: string
}

type MusicPlane = {
  staves: Record<Id, Staff>
  voices: Record<Id, Voice>
  events: Record<Id, MusicEvent>
  neumeGroups: Record<Id, NeumeGroup>
  notes: Record<Id, NoteEvent>
  phraseRegions: Record<Id, PhraseRegion>
}

type Staff = {
  id: Id
  lineCount: 4 | 5 | 2 | 3
  label?: string
  defaultClef?: ClefDef
}

type Voice = {
  id: Id
  staffId: Id
  kind: "chant" | "organal" | "drone" | "editorial" | "other"
  eventIds: Id[]
  name?: string
}

type MusicEvent =
  | ClefChange
  | AccidentalEvent
  | BarEvent
  | CustosEvent
  | NeumeGroupEvent
  | SpacerSemanticEvent

type ClefDef = {
  shape: "c" | "f"
  line: 1 | 2 | 3 | 4 | 5
  flatOnClef?: boolean
}

type ClefChange = {
  id: Id
  type: "clefChange"
  clef: ClefDef
}

type AccidentalEvent = {
  id: Id
  type: "accidental"
  kind: "flat" | "natural" | "sharp"
  pitch: StaffPitch
  editorial?: boolean
}

type BarEvent = {
  id: Id
  type: "bar"
  kind: "quarter" | "half" | "full" | "double" | "final"
  phraseStrength: "minor" | "medium" | "major"
}

type CustosEvent = {
  id: Id
  type: "custos"
  targetPitch?: StaffPitch
  generated: boolean
}

type SpacerSemanticEvent = {
  id: Id
  type: "semanticSpacer"
  reason: "sharedGestureSplit" | "editorialGap"
}

type NeumeGroupEvent = {
  id: Id
  type: "neumeGroup"
  neumeGroupId: Id
}

type NeumeGroup = {
  id: Id
  voiceId: Id
  noteIds: Id[]
  contourKindHint?: string
  notationHints?: NotationHint[]
  groupingRole?: "primary" | "secondary" | "ornamental" | "editorial"
}

type NoteEvent = {
  id: Id
  pitch: StaffPitch
  sign: NoteSign
  ornaments?: NoteOrnament[]
  rhythmicSigns?: RhythmicSign[]
  editorial?: EditorialFlag[]
}

type StaffPitch = {
  diatonicIndex: number
  chromaticOffset?: number
}

type NoteSign =
  | "punctum"
  | "virga"
  | "inclinatum"
  | "quilisma"
  | "oriscus"
  | "stropha"
  | "liquescentSmall"
  | "liquescentAscending"
  | "liquescentDescending"
  | "initioDebilis"

type NoteOrnament =
  | "cavum"
  | "linea"
  | "accentus"
  | "circulus"
  | "semiCirculus"

type RhythmicSign =
  | "mora"
  | "doubleMora"
  | "verticalEpisema"
  | "horizontalEpisema"

type PhraseRegion = {
  id: Id
  voiceIds: Id[]
  startEventId: Id
  endEventId: Id
  label?: string
}
```

The crucial extra plane is alignment.

```ts
type AlignmentPlane = {
  links: Record<Id, AlignmentLink>
}

type AlignmentLink = {
  id: Id
  textSpanId: Id
  musicTargets: MusicTarget[]
  relation:
    | "syllabic"
    | "melisma"
    | "sharedGesture"
    | "coSung"
    | "editorialAssociation"
  policy: AlignmentPolicy
}

type MusicTarget = {
  voiceId: Id
  fromEventId: Id
  toEventId?: Id
  bundleId?: Id
}

type AlignmentPolicy = {
  textDistribution: "singleSyllable" | "acrossSpan" | "elided"
  musicDistribution: "singleGroup" | "sequentialGroups" | "simultaneousBundle"
}
```

This is the part GABC and plain MEI do not give you natively. A `TextSpan` can be one syllable or many; a link can target one voice or many; and policy data explains whether the mapping is a normal syllabic assignment, a melisma, or a shared gesture.

Editorial and editor only information should sit beside the core, never hidden inside it.

```ts
type EditorialPlane = {
  annotations: Record<Id, EditorialAnnotation>
  variants: Record<Id, VariantSite>
  userGroups: Record<Id, UserGroup>
}

type EditorialAnnotation = {
  id: Id
  targets: TargetRef[]
  kind: "comment" | "sourceNote" | "performanceNote" | "analysis"
  text: RichTextBlock[]
}

type VariantSite = {
  id: Id
  targets: TargetRef[]
  readings: VariantReading[]
  defaultReadingId: Id
}

type VariantReading = {
  id: Id
  label?: string
  replacementTextSpanIds?: Id[]
  replacementMusicTargetIds?: Id[]
  sourceRefs?: SourceReference[]
}

type UserGroup = {
  id: Id
  targets: TargetRef[]
  label: string
  exportBehaviour: "ignore" | "comment" | "projectOnly"
}

type TargetRef = {
  kind:
    | "syllable"
    | "word"
    | "textSpan"
    | "voice"
    | "event"
    | "neumeGroup"
    | "note"
    | "alignment"
    | "phrase"
  id: Id
}
```

Layout intent, again, is declarative.

```ts
type LayoutPreferencePlane = {
  breakPrefs: BreakPreference[]
  spacingPrefs: SpacingPreference[]
  visibilityPrefs: VisibilityPreference[]
  engravingProfileId?: string
}

type BreakPreference = {
  id: Id
  kind: "preferBreakBefore" | "forbidBreakAcross" | "preferKeepTogether"
  targets: TargetRef[]
}

type SpacingPreference = {
  id: Id
  targets: TargetRef[]
  kind: "compact" | "expanded" | "manualGapHint"
  amount?: number
}

type VisibilityPreference = {
  id: Id
  targets: TargetRef[]
  visible: boolean
}
```

This model is intentionally more expressive than GABC and slightly less exchange driven than MEI. That is the right trade for a native editor.

## The GABC adapter and source mapping IR

You asked for a separate model for imported GABC source mapping. It should be lossless, concrete, and disposable, but it should not become the editor’s semantic truth. Tree sitter style incremental parsing is the right precedent here: syntax trees track node structure and source spans, can be efficiently updated after edits, and keep concrete source positions available. Modern editor systems also treat changes as operations with position mapping rather than mutating identity directly. That combination is exactly what you need for a dual view editor that has both a visual surface and a raw GABC pane. citeturn22search5turn21view0turn21view1turn21view3turn21view4

I would use two adapter objects: a lossless concrete GABC tree and a semantic projection map.

```ts
type GabcAttachment = {
  id: Id
  sourceText: string
  cst: GabcCst
  projection: GabcProjection
  importReport: FidelityReport
  stale: boolean
}

type GabcCst = {
  rootId: Id
  nodes: Record<Id, GabcCstNode>
  tokens: GabcToken[]
  comments: SourceComment[]
  lineMap: LineMap
}

type GabcCstNode = {
  id: Id
  kind:
    | "file"
    | "header"
    | "headerField"
    | "body"
    | "syllableToken"
    | "textSegment"
    | "notesSegment"
    | "barToken"
    | "clefToken"
    | "markup"
    | "verbatim"
    | "braceCommand"
    | "translation"
    | "altText"
    | "polyphonyToken"
    | "spaceToken"
    | "comment"
  span: SourceSpan
  childIds: Id[]
  rawText: string
}

type GabcToken = {
  id: Id
  kind: string
  span: SourceSpan
  raw: string
}

type SourceSpan = {
  from: number
  to: number
  lineFrom: number
  colFrom: number
  lineTo: number
  colTo: number
}

type GabcProjection = {
  headerMappings: HeaderMapping[]
  objectMappings: ObjectSourceMapping[]
  residuals: ResidualFragment[]
}

type HeaderMapping = {
  fieldName: string
  nodeId: Id
  semanticTarget?: TargetRef
}

type ObjectSourceMapping = {
  semanticRef: TargetRef
  sourceNodeIds: Id[]
  projectionKind:
    | "exact"
    | "normalised"
    | "derived"
    | "synthetic"
}

type ResidualFragment = {
  id: Id
  nodeIds: Id[]
  kind:
    | "manualSpacing"
    | "manualBreak"
    | "verbatimTex"
    | "brace"
    | "comment"
    | "unsupportedPolyphony"
    | "unknownMarkup"
  exportPolicy: "preserveIfUnchanged" | "commentOnly" | "drop"
}
```

This separation gives you three valuable behaviours.

First, unchanged imported material can round trip with high fidelity. Comments, raw header order, manual line breaks, special markup, and spacing survive as attached source data even if the semantic editor does not understand all of them. Gregorio explicitly supports comments, verbatim TeX insertion, manual line breaks, translation spans, above line text, braces, and many spacing controls; you should preserve those as adapter residue, not pretend they are core semantics. citeturn14view1turn14view2turn14view3turn14view4turn14view5turn15view0turn13view2

Second, semantic editing can detach or stale the source projection when needed. Once a user creates a many to many underlay relation that GABC cannot express naturally, the semantic document remains valid while the GABC attachment becomes a best effort export source rather than an exact mirror.

Third, the visual editor can still offer source aware affordances. Because every imported semantic object can point back to original source spans, you can highlight the raw GABC token that created a neume, a clef, or a bar, and you can show import warnings on exact character ranges.

The import algorithm should be straightforward and opinionated.

Parse the GABC into a CST; extract headers into metadata; create a default staff and voice when none are implied; walk the body from clef context to clef context, converting clefs, bars, accidentals, custos, neume groups, and note modifiers into the music plane; build text syllables from the source text segments; then create default alignment links from each syllable like unit to its corresponding note sequence. Use GABC spacing tokens such as `/`, `//`, `!`, `@`, and glyph spaces as notation hints on neume groups, not as semantic spacers in the main model. Gregorio says those spacing distinctions affect neume formation and engraving, and that is exactly why they belong in the adapter and notation hints rather than in the text model. citeturn13view2

There are three especially important import rules.

For ordinary monophonic GABC, import into one voice with one alignment link per syllable token. That gives you a clean baseline and faithful display.

For bars encoded as pseudo syllables, create real `BarEvent` objects in the music plane and preserve the surrounding source syntax only in the GABC projection. Gregorio’s own documentation makes clear that bars between syllables are written as separate source units, but semantically they are not syllables. citeturn11view1

For Gregorio curly brace polyphony, import a second voice if possible, but mark the result as heuristic. Gregorio’s documentation itself says the feature is simple, spacing blind, and not serious polyphony support. That means your richer IR can absorb it, but should record uncertainty and source specific quirks. citeturn1view2

## The layout and rendering IR

The semantic document should never contain coordinates. Modern editor architecture and music rendering tools both reinforce this. CodeMirror keeps functional editor state distinct from DOM and screen coordinate concerns. Exsurge performs layout and then creates drawables. Verovio loads symbolic data and renders SVG as a separate step, and its page and time lookup methods operate on semantic element IDs after layout and rendering work has been done. Your editor should do the same. citeturn21view1turn3view0turn18view0turn18view2

The layout IR should therefore be derived, deterministic, cached, and disposable.

```ts
type LayoutScore = {
  id: Id
  sourceRevision: number
  profileHash: string
  systems: LayoutSystem[]
  semanticToLayout: SemanticLayoutMap[]
}

type LayoutSystem = {
  id: Id
  index: number
  x: number
  y: number
  width: number
  staves: LayoutStaff[]
  overlays: LayoutOverlay[]
}

type LayoutStaff = {
  id: Id
  semanticStaffId: Id
  lineCount: number
  lineYs: number[]
  items: LayoutItem[]
}

type LayoutItem =
  | LayoutClef
  | LayoutAccidental
  | LayoutBar
  | LayoutCustos
  | LayoutNeume
  | LayoutTextAttachment
  | LayoutConnector
  | LayoutEditorialMark

type LayoutClef = {
  id: Id
  semanticEventId: Id
  x: number
  bbox: BBox
  glyphName: string
}

type LayoutAccidental = {
  id: Id
  semanticEventId: Id
  x: number
  y: number
  bbox: BBox
  glyphName: string
}

type LayoutBar = {
  id: Id
  semanticEventId: Id
  x: number
  bbox: BBox
  style: string
}

type LayoutCustos = {
  id: Id
  semanticEventId: Id
  x: number
  y: number
  bbox: BBox
  glyphName: string
}

type LayoutNeume = {
  id: Id
  semanticNeumeGroupId: Id
  x: number
  noteHeads: LayoutNoteHead[]
  connectorShapes: LayoutShape[]
  bbox: BBox
}

type LayoutNoteHead = {
  semanticNoteId: Id
  x: number
  y: number
  glyphName: string
  bbox: BBox
}

type LayoutTextAttachment = {
  id: Id
  alignmentId: Id
  textSpanId: Id
  anchorXs: number[]
  baselineY: number
  textRuns: LayoutTextRun[]
  extenderLine?: LayoutShape
}

type LayoutTextRun = {
  text: string
  x: number
  y: number
  bbox: BBox
  styleClass: string
}

type LayoutConnector = {
  id: Id
  kind: "brace" | "groupLine" | "spanMarker"
  targets: Id[]
  shape: LayoutShape
}

type LayoutEditorialMark = {
  id: Id
  annotationId: Id
  x: number
  y: number
  bbox: BBox
}

type LayoutOverlay = {
  id: Id
  kind: "selection" | "hover" | "userGroup" | "variantBadge"
  targetIds: Id[]
  bbox: BBox
}

type LayoutShape = {
  path: string
  bbox: BBox
}

type BBox = {
  x: number
  y: number
  width: number
  height: number
}

type SemanticLayoutMap = {
  semanticRef: TargetRef
  layoutIds: Id[]
}
```

Two points matter more than any others.

The semantic to layout map must be explicit. If a note or neume group is split across systems, duplicated in a custos, or represented by several SVG primitives, you still want one stable semantic identity with several layout instances. Verovio’s API design around ID based page and time queries is a good precedent for this. citeturn18view2

User intent should enter layout through preferences and constraints, not raw coordinates. For example, “keep these syllables together”, “show translation centred over this span”, or “group these two neumes visually under one brace” are persistent preferences. Their exact x and y values are layout output and should be recalculated whenever width, font, engraving profile, or line break policy changes. Gregorio’s manual line break workflow and spacing controls show why source or project hints are useful; CodeMirror’s separation of state from layout shows why coordinates do not belong in the semantic state. citeturn15view0turn21view1

For rendering, you can then target several back ends from the same layout IR. SVG and canvas render directly from primitives. PDF can consume the same primitives or consume SVG. A future MEI or MusicXML export should bypass layout and project from the semantic document plus notation hints instead. That separation will save you from countless bugs.

## How the model represents the hard cases

The design becomes concrete once the alignment graph is used consistently.

For one syllable with one neume, create one `TextSpan` containing one syllable and one `AlignmentLink` whose `musicTargets` contain one `NeumeGroupEvent` span in one voice. This is the default Gregorian case.

For one syllable with multiple neumes, keep the same text span but allow `musicTargets` to contain several sequential neume group spans in the same voice. MEI supports the idea that a syllable may contain one or more neumes; your native model generalises that by making the sequence explicit instead of using containment. citeturn6view0turn1view3

For multiple voices on the same syllable, create one text span and several music targets, one per voice, normally with `policy.musicDistribution = "simultaneousBundle"`. This is the first place where a real alignment graph beats both GABC and a pure syllable container model. Gregorio can only fake simple polyphony; MEI layers are closer, but the underlay relation is still better expressed explicitly in your native IR. citeturn1view2turn20view2

For melismas, create one text span with one syllable and a music target whose event range covers several sequential neume groups. In rendering, this can drive extenders if you choose to display them in an adapted style. In export, a GABC projection can flatten this back to one syllable with a longer note sequence when the material is monophonic and contiguous.

For one neume spanning multiple syllables, create a `TextSpan` containing several syllable IDs and a single music target. This is exactly the sort of relation that is awkward in GABC and only somewhat natural in MEI. Your model should treat it as ordinary, not exceptional. If you need more detail, add distribution data such as “first note carries first syllable, remainder shared”, but keep the main relation many to many.

For multiple syllables sharing a musical gesture, use the same pattern and set `relation = "sharedGesture"`. This semantic distinction matters because the UI can then render a shared gesture marker differently from a plain melisma.

Bars and phrase structure should be separate concepts. A `BarEvent` is a notated event in one or more voices. A `PhraseRegion` is an analytical or editorial span over a run of events. Historical and Solesmes style practice often align the two closely, but not always perfectly, and your editor should not collapse them. Gregorio treats bars as syntax tokens within the stream; chant practice treats them as phrase punctuation; keeping both ideas separate in the IR is the practical solution. citeturn11view1turn27view0

Clef changes should be ordinary music events with scoped effect. A `ClefChange` remains in the voice or staff event stream, and subsequent pitch rendering uses the nearest preceding active clef. GABC treats clefs as stream tokens and even provides inline custos handling around clef changes; MEI stores staff definitions and clef data at the staff level. Your IR should keep the event and derived scope both available. citeturn11view2turn1view2turn19view1

Unsupported GABC details should never be shoehorned into the semantic model. Verbatim TeX, manual spacing directives, brace commands, comments, raw translation centring spans, and manual line breaks should live under `GabcAttachment.projection.residuals`. Gregorio officially supports all of these, but they are source or engraving instructions, not chant semantics. citeturn14view1turn14view2turn14view4turn14view5turn15view0

Editor only features that cannot export cleanly to GABC, such as user created colour groups, selected pedagogical overlays, cross voice experimental brackets, or custom spatial grouping, should live in `EditorialPlane.userGroups` or `LayoutPreferencePlane`. Exporters may ignore them, comment on them, or project them into another target format later.

## IDs, spans, operations, import, and export

Stable IDs should be opaque, immutable, typed by prefix, and never derived from source offsets or array positions. Use IDs such as `syl_x`, `span_x`, `voice_x`, `evt_x`, `ng_x`, `note_x`, `aln_x`, and `var_x`. Array order is acceptable for an MVP, but if you expect collaboration or aggressive mid sequence insertion, move to explicit order keys. This recommendation follows directly from the fact that location references in editor systems are useful but unstable under edits. Tree sitter nodes track source positions, Slate paths locate tree positions, CodeMirror changes are expressed relative to document positions, and ProseMirror step maps are needed precisely because positions move when documents change. Persistent semantic references therefore need IDs, while source spans and tree paths should remain secondary locators. citeturn22search5turn21view4turn21view1turn21view0

Source spans should exist only in adapter layers and transient editor selections. Every imported GABC node should have a span; every semantic object created from source should optionally point back to source node IDs; and every export report item should identify both semantic IDs and source spans when possible. That gives you excellent diagnostics without infecting the semantic core with source coordinates.

Edit operations should be first class, serialisable, invertible where possible, and expressed in semantic terms. ProseMirror’s atomic `Step` objects and change maps are a strong precedent, as is Slate’s use of operation objects for history and collaboration. This matters because chant editing is not just text editing. You want commands like “split syllable before character”, “merge selected neumes into one group”, “reassign alignment to next syllable”, “insert clef change before this event”, or “promote selected alternate reading to default”, not a soup of ad hoc state mutations. citeturn21view0turn21view3

A practical MVP operation set would include the following families: text operations such as insert syllable, split syllable, merge syllables, and move syllable between words; music operations such as insert neume group, delete neume group, change note pitch, add rhythmic sign, change clef, and insert bar; alignment operations such as attach text span to music span, extend melisma, split alignment, merge alignments, and convert to shared gesture; overlay operations such as add annotation, add variant site, and toggle user group; and layout preference operations such as prefer break before, keep together, and set visibility. Those are design recommendations, but they align with the operation based approach used by modern structured editors. citeturn21view0turn21view1turn21view3

The GABC import strategy should proceed in two passes. The first pass is lossless parsing into the adapter CST and residual map. The second pass is semantic projection. Recognised headers become metadata. Clefs, bars, accidentals, custos, note groups, liquescent markers, quilisma, punctum mora, vertical and horizontal episema, and spacing distinctions become music objects plus notation hints. Syllable text becomes text plane objects. Then default underlay links are created. Preserve any source feature that cannot be represented semantically as a residual with an import warning, not as silent data loss. Gregorio’s documentation is rich enough that you can classify most imported constructs as exact, normalised, source only, or unsupported. citeturn1view0turn11view1turn13view0turn13view2turn14view2turn31view3

The GABC export strategy should be projection based and explicit about loss. Define export profiles such as `gabcMono`, `gabcSimplePolyphony`, and perhaps `gabcPedagogical`. Each profile validates the semantic document against profile constraints. The monophonic profile should require one active output voice, one four line staff context at a time, underlay links that can be flattened to GABC syllable blocks, and no unresolved overlay only constructs. The simple polyphony profile may optionally emit Gregorio curly brace notation when two voices can be reduced to that limited syntax, but it should warn loudly because the official documentation says spacing, collision avoidance, and serious typography are not really supported there. citeturn1view2

Lossy export reporting should be a formal output, not an afterthought.

```ts
type FidelityReport = {
  status: "exact" | "normalised" | "lossy" | "blocked"
  items: FidelityItem[]
}

type FidelityItem = {
  severity: "info" | "warning" | "error"
  semanticRefs: TargetRef[]
  sourceSpans?: SourceSpan[]
  message: string
  fallback?: string
}
```

Typical warning cases are easy to predict. Multi voice same syllable with independent spacing, warning, exported as separate files or dropped extra voices. One gesture attached to several non elided syllables, warning, flattened to first syllable only or blocked. User groups and custom braces, info or warning, omitted from GABC but preserved in project JSON. Verbatim TeX fragments, warning, preserved only when source attachment is unchanged. Manual line breaks, info, re emitted only if layout preferences request them. These are design recommendations, but they are exactly the kind of explicit degradation policy you need if GABC is an adapter rather than the native model.

For playback and future exports, keep a separate projection layer. MEI’s `nc` already carries gestural duration related attributes, and Verovio can map element IDs to playback times after MIDI rendering. That makes it sensible to keep optional performance projections distinct from chant semantics. Your native note objects do not need fixed modern durations. A playback adapter can derive an event timeline from a chosen interpretation profile, whether equalist, semiological, pedagogical, or approximation for study playback. citeturn6view2turn18view2

## MVP, roadmap, comparisons, examples, and the mistakes to avoid

The right MVP is smaller than it may feel. Support one staff, one voice, C and F clefs, bars, custos generation, note entry by direct visual editing, neume grouping, punctum mora, vertical and horizontal episema, liquescent forms, quilisma, monophonic syllable attachment through explicit alignment links, import from ordinary GABC, export to ordinary GABC, and SVG rendering. Include stable IDs and an operation log from day one. Do not wait to “add IDs later”; editor history, source mapping, and future overlays all become far more expensive if identity is not designed in early. This scope aligns with the practical capabilities seen in existing square note editor work such as Neon, which focused first on core neume elements, clefs, custos, basic grouping, and web based editing using Verovio. citeturn17view0

The next stage should add true multi voice support, many to many alignment editing, phrase regions, layer visibility, translation and commentary as separate text planes, and richer GABC residual preservation. After that, add variants, alternate readings, user groups, layout preferences such as keep together and prefer break before, and future exports to MEI. Only after the semantic and projection layers are solid should you attempt polished MusicXML export, because MusicXML will force a much more note and duration centric projection. citeturn6view0turn6view3turn23view0turn23view1

The comparison between model shapes is clear. A GABC shaped IR is attractive for import and export and for leveraging existing engravers, but it bakes in source syntax, pseudo syllables for bars, vowel based centring assumptions, and ad hoc layout controls. A chant semantic IR is best for correctness, flexible underlay, and future notation extensions. A visual editor document IR is what you need for undo, collaboration, source mapping, dirty state, and persistent user intent; in practice, it should wrap the chant semantic IR rather than replace it. A general music notation IR such as MEI or MusicXML is best as an interchange target. MEI is significantly closer to chant because it has neume and syllable concepts plus layers and critical apparatus. MusicXML is farther away because it is essentially note, lyric, and voice based. citeturn11view1turn15view0turn6view0turn20view2turn6view3turn23view0turn23view1

The dangerous modelling mistakes are equally clear.

Treating syllables as the only container for music is the biggest one. It works for ordinary chant, but it makes multi voice, shared gestures, and true many to many underlay awkward from the start.

Treating note glyph names as the entire meaning of a neume is another. You need pitch sequence plus semantic sign data plus notation hints, otherwise contour based regrouping and alternate rendering styles become brittle. LilyPond’s chant documentation is a nice reminder that glyph appearance can be derived from musical meaning, and that the same music may be rendered in different chant styles. citeturn25view3

Treating GABC as native truth is the mistake you explicitly want to avoid, and that instinct is correct. GABC is a valuable adapter, but it mixes notation, textual conventions, and engraving controls. citeturn11view0turn15view0

Storing SVG coordinates in semantic nodes is another common trap. Layout must remain derived and disposable. citeturn21view1turn18view0turn3view0

Using source offsets or array positions as identity is a more technical but equally serious trap. Editing frameworks exist largely because positions shift under edits. Use stable IDs, keep source spans separate, and map positions through operations when needed. citeturn21view0turn21view1turn21view4

Here is a short monophonic example for an ordinary phrase.

```ts
const doc: ChantDocument = {
  id: "doc1",
  revision: 1,
  metadata: {
    title: "Kyrie",
    language: "la",
    modeLabel: "VIII"
  },
  text: {
    blocks: [
      { id: "tb1", kind: "chantText", orderedSpanIds: ["ts1", "ts2"] }
    ],
    syllables: {
      sy1: { id: "sy1", text: "Ky", role: "lyric" },
      sy2: { id: "sy2", text: "ri", role: "lyric" },
      sy3: { id: "sy3", text: "e", role: "lyric" }
    },
    words: {
      w1: { id: "w1", syllableIds: ["sy1", "sy2", "sy3"] }
    },
    spans: {
      ts1: { id: "ts1", syllableIds: ["sy1"] },
      ts2: { id: "ts2", syllableIds: ["sy2", "sy3"] }
    }
  },
  music: {
    staves: {
      st1: { id: "st1", lineCount: 4, defaultClef: { shape: "c", line: 4 } }
    },
    voices: {
      v1: { id: "v1", staffId: "st1", kind: "chant", eventIds: ["e1", "e2", "e3", "e4"] }
    },
    events: {
      e1: { id: "e1", type: "clefChange", clef: { shape: "c", line: 4 } },
      e2: { id: "e2", type: "neumeGroup", neumeGroupId: "ng1" },
      e3: { id: "e3", type: "neumeGroup", neumeGroupId: "ng2" },
      e4: { id: "e4", type: "bar", kind: "full", phraseStrength: "major" }
    },
    neumeGroups: {
      ng1: { id: "ng1", voiceId: "v1", noteIds: ["n1", "n2"] },
      ng2: { id: "ng2", voiceId: "v1", noteIds: ["n3", "n4", "n5"] }
    },
    notes: {
      n1: { id: "n1", pitch: { diatonicIndex: 0 }, sign: "punctum" },
      n2: { id: "n2", pitch: { diatonicIndex: 1 }, sign: "punctum" },
      n3: { id: "n3", pitch: { diatonicIndex: 1 }, sign: "punctum" },
      n4: { id: "n4", pitch: { diatonicIndex: 0 }, sign: "punctum" },
      n5: { id: "n5", pitch: { diatonicIndex: 1 }, sign: "quilisma" }
    },
    phraseRegions: {}
  },
  alignment: {
    links: {
      a1: {
        id: "a1",
        textSpanId: "ts1",
        musicTargets: [{ voiceId: "v1", fromEventId: "e2" }],
        relation: "syllabic",
        policy: {
          textDistribution: "singleSyllable",
          musicDistribution: "singleGroup"
        }
      },
      a2: {
        id: "a2",
        textSpanId: "ts2",
        musicTargets: [{ voiceId: "v1", fromEventId: "e3" }],
        relation: "melisma",
        policy: {
          textDistribution: "acrossSpan",
          musicDistribution: "singleGroup"
        }
      }
    }
  },
  editorial: { annotations: {}, variants: {}, userGroups: {} },
  layoutPrefs: { breakPrefs: [], spacingPrefs: [], visibilityPrefs: [] }
}
```

And here is the kind of example your IR can represent naturally, but GABC cannot represent cleanly as a genuine first class structure: one syllable with two independent simultaneous neume groups in two voices, plus a lower voice continuation that shares text with the next syllable. Gregorio’s own documentation shows why this is beyond comfortable GABC semantics, even though a fragile curly brace workaround may exist for very simple cases. citeturn1view2

```ts
const advancedExample: ChantDocument = {
  id: "doc2",
  revision: 1,
  metadata: { title: "Experimental Kyrie", language: "la" },
  text: {
    blocks: [{ id: "tb1", kind: "chantText", orderedSpanIds: ["tsKy", "tsRi"] }],
    syllables: {
      syKy: { id: "syKy", text: "Ky", role: "lyric" },
      syRi: { id: "syRi", text: "ri", role: "lyric" }
    },
    words: { w1: { id: "w1", syllableIds: ["syKy", "syRi"] } },
    spans: {
      tsKy: { id: "tsKy", syllableIds: ["syKy"] },
      tsRi: { id: "tsRi", syllableIds: ["syRi"] },
      tsKyRi: { id: "tsKyRi", syllableIds: ["syKy", "syRi"] }
    }
  },
  music: {
    staves: {
      st1: { id: "st1", lineCount: 4, defaultClef: { shape: "c", line: 4 } }
    },
    voices: {
      top: { id: "top", staffId: "st1", kind: "chant", eventIds: ["t1", "t2"] },
      low: { id: "low", staffId: "st1", kind: "organal", eventIds: ["b1", "b2", "b3"] }
    },
    events: {
      t1: { id: "t1", type: "neumeGroup", neumeGroupId: "ngTopKy" },
      t2: { id: "t2", type: "neumeGroup", neumeGroupId: "ngTopRi" },
      b1: { id: "b1", type: "neumeGroup", neumeGroupId: "ngLowKyA" },
      b2: { id: "b2", type: "neumeGroup", neumeGroupId: "ngLowKyB" },
      b3: { id: "b3", type: "neumeGroup", neumeGroupId: "ngLowRi" }
    },
    neumeGroups: {
      ngTopKy: { id: "ngTopKy", voiceId: "top", noteIds: ["n1", "n2"] },
      ngTopRi: { id: "ngTopRi", voiceId: "top", noteIds: ["n3"] },
      ngLowKyA: { id: "ngLowKyA", voiceId: "low", noteIds: ["n4"] },
      ngLowKyB: { id: "ngLowKyB", voiceId: "low", noteIds: ["n5", "n6"] },
      ngLowRi: { id: "ngLowRi", voiceId: "low", noteIds: ["n7"] }
    },
    notes: {
      n1: { id: "n1", pitch: { diatonicIndex: 1 }, sign: "punctum" },
      n2: { id: "n2", pitch: { diatonicIndex: 2 }, sign: "quilisma" },
      n3: { id: "n3", pitch: { diatonicIndex: 1 }, sign: "punctum" },
      n4: { id: "n4", pitch: { diatonicIndex: -2 }, sign: "virga" },
      n5: { id: "n5", pitch: { diatonicIndex: -1 }, sign: "punctum" },
      n6: { id: "n6", pitch: { diatonicIndex: -2 }, sign: "punctum" },
      n7: { id: "n7", pitch: { diatonicIndex: -1 }, sign: "punctum" }
    },
    phraseRegions: {}
  },
  alignment: {
    links: {
      aTopKy: {
        id: "aTopKy",
        textSpanId: "tsKy",
        musicTargets: [{ voiceId: "top", fromEventId: "t1" }],
        relation: "syllabic",
        policy: {
          textDistribution: "singleSyllable",
          musicDistribution: "singleGroup"
        }
      },
      aLowShared: {
        id: "aLowShared",
        textSpanId: "tsKyRi",
        musicTargets: [{ voiceId: "low", fromEventId: "b1", toEventId: "b3" }],
        relation: "sharedGesture",
        policy: {
          textDistribution: "acrossSpan",
          musicDistribution: "sequentialGroups"
        }
      }
    }
  },
  editorial: { annotations: {}, variants: {}, userGroups: {} },
  layoutPrefs: { breakPrefs: [], spacingPrefs: [], visibilityPrefs: [] }
}
```

If you export that document to GABC, the correct outcome is not heroic guessing. The correct outcome is a profile check that says, in effect: native document valid; GABC projection lossy; reason, independent multi voice underlay on one syllable and cross syllable shared gesture do not reduce cleanly to standard GABC semantics; fallback, export top voice only, export voices separately, or emit a warning and block export. That is not a weakness of the IR. It is exactly the point of making the native model more expressive than the adapter.