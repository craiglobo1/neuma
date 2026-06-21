import type { AlignmentRelation } from "../alignment";
import type { Id } from "../common";
import type { ChantDocument } from "../document";
import { BarEvent, ClefChange, NeumeGroupEvent, type ClefDef, type NeumeGroup, type RhythmicSign, type Staff, type Voice } from "../music";
import { getStaffPosition, getTextForEvent, getVoiceEvents } from "../query";

export type LayoutPageMode = "continuous" | "paged";
export type LayoutRendererKind = "svg" | "canvas" | "webgl" | "hybrid";
export type LayoutGlyphSource = "font" | "path";
export type LayoutGlyphKind =
  | "staffLine"
  | "clef"
  | "custos"
  | "barline"
  | "note"
  | "liquescent"
  | "quilisma"
  | "accidental"
  | "episema"
  | "mora"
  | "ictus"
  | "brace"
  | "editorialMark"
  | "selection"
  | "handle";

export type LayoutOptions = {
  width: number;
  pxPerStaffSpace?: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutUnits = {
  kind: "staffSpace";
  value: 1;
  pxPerStaffSpace: number;
  lineThickness: number;
};

export type LayoutGlyphDef = {
  key: Id;
  source: LayoutGlyphSource;
  glyphName?: string;
  pathData?: string;
  advanceWidth: number;
  bbox: Rect;
  opticalPadding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
};

export type LayoutStaff = {
  id: Id;
  semanticStaffId: Id;
  voiceIds: Id[];
  origin: Point;
  width: number;
  lineCount: 4;
  lineYs: number[];
  lineThickness: number;
  ledgerSegments: Array<{
    x: number;
    y: number;
    width: number;
  }>;
  clefRuns: Array<{
    clefEventId: Id;
    x: number;
    glyphId: Id;
    governsFromMusicEventId: Id;
    governsToMusicEventId?: Id;
  }>;
};

export type LayoutGlyph = {
  id: Id;
  semanticId?: Id;
  parentId?: Id;
  systemId: Id;
  staffId?: Id;
  defKey: Id;
  kind: LayoutGlyphKind;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  classes: string[];
  styleKey?: string;
  hitBox?: Rect;
  reusable: boolean;
};

export type LayoutNeume = {
  id: Id;
  semanticNeumeId: Id;
  voiceId: Id;
  staffId: Id;
  systemId: Id;
  glyphIds: Id[];
  noteEventIds: Id[];
  rect: Rect;
  anchor: Point;
  textAttachment: {
    textSpanIds: Id[];
    relation: AlignmentRelation;
    visualAnchorX: number;
    visualSpanX1: number;
    visualSpanX2: number;
  };
  collisionGroup: Id;
};

export type LayoutSyllable = {
  id: Id;
  semanticTextSpanId: Id;
  systemId: Id;
  wordId?: Id;
  lyricRunId: Id;
  translationRunIds?: Id[];
  attachedNeumeIds: Id[];
  bounds: Rect;
  baselineY: number;
  anchorPolicy: "vowelCentre" | "spanCentre" | "firstPrincipalNote" | "editorial";
  anchorX: number;
  melismaExtent?: {
    startX: number;
    endX: number;
  };
  continuation: {
    softHyphenBefore: boolean;
    softHyphenAfter: boolean;
    lineBreakWithinWord: boolean;
    elision: boolean;
  };
};

export type LayoutTextRun = {
  id: Id;
  role: "lyric" | "translation" | "annotation" | "aboveLine" | "commentary" | "editorial";
  text: string;
  systemId: Id;
  attachedTo?: {
    kind: "syllable" | "neume" | "system";
    id: Id;
  };
  x: number;
  y: number;
  width: number;
  height: number;
  baselineY: number;
  align: "left" | "centre" | "right";
  fontKey: string;
  classes: string[];
  semanticId?: Id;
};

export type LayoutDiagnostic = {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  semanticIds?: Id[];
  layoutIds?: Id[];
};

export type LayoutSystem = {
  id: Id;
  index: number;
  surfaceIndex?: number;
  rect: Rect;
  contentRect: Rect;
  staffSpace: number;
  staffs: LayoutStaff[];
  neumes: LayoutNeume[];
  syllables: LayoutSyllable[];
  textRuns: LayoutTextRun[];
  glyphs: LayoutGlyph[];
  breakInfo: {
    kind: "auto" | "forced" | "page" | "keepTogether";
    justification: number;
    widowPenaltyApplied: boolean;
    orphanPenaltyApplied: boolean;
    trailingCustos?: Id;
  };
};

export type LayoutDocument = {
  schema: "neuma.layout";
  version: string;
  layoutId: Id;
  sourceDocumentId: Id;
  sourceRevision: string;
  units: LayoutUnits;
  viewport: {
    width: number;
    height: number;
    pageMode: LayoutPageMode;
  };
  defs: LayoutGlyphDef[];
  systems: LayoutSystem[];
  renderHints: {
    preferredRenderer: LayoutRendererKind;
    pixelSnap: boolean;
    dprAware: boolean;
  };
  index: {
    semanticToLayoutIds: Record<Id, Id[]>;
    voiceToSystemIds: Record<Id, Id[]>;
    textSpanToSyllableIds: Record<Id, Id[]>;
  };
  diagnostics: LayoutDiagnostic[];
};

type LayoutContext = {
  doc: ChantDocument;
  systemId: Id;
  staffId: Id;
  lineYs: number[];
  semanticToLayoutIds: Record<Id, Id[]>;
  textSpanToNeumeIds: Record<Id, Id[]>;
  textSpanRelations: Record<Id, AlignmentRelation>;
  glyphs: LayoutGlyph[];
  neumes: LayoutNeume[];
};

type LayoutNoteInput = {
  id: Id;
  pitch: {
    diatonicIndex: number;
    chromaticOffset: number;
  };
  sign: string;
  rhythmicSigns?: RhythmicSign[];
};

const VERSION = "0.1.0";
const LINE_THICKNESS = 0.08;
const STAFF_TOP = 3;
const STAFF_LEFT = 4;
const SYSTEM_MARGIN = 2;
const LYRIC_BASELINE_OFFSET = 5;
const LYRIC_NEUME_CLEARANCE = 0.35;
const TEXT_HEIGHT = 1;
const NOTE_WIDTH = 0.8;
const NOTE_HEIGHT = 0.8;
const NOTE_GAP = 0.75;
const PORRECTUS_ENDING_OVERLAP = NOTE_WIDTH * 0.9;
const MORA_SIZE = 0.35;
const MORA_GAP = 0.15;
const NEUME_GAP = 1.8;
const BAR_GAP = 1.2;

export function layoutChant(document: ChantDocument, options: LayoutOptions): LayoutDocument {
  const width = options.width;
  const pxPerStaffSpace = options.pxPerStaffSpace ?? 10;
  const diagnostics: LayoutDiagnostic[] = [];
  const semanticToLayoutIds: Record<Id, Id[]> = {};
  const voiceToSystemIds: Record<Id, Id[]> = {};
  const textSpanToSyllableIds: Record<Id, Id[]> = {};
  const staffs = sortedValues(document.music.staves);
  const voices = sortedValues(document.music.voices);
  const primaryStaff = staffs[0];
  const primaryVoice = voices[0];
  const systemId = "sys_1";
  const layoutStaffId = primaryStaff === undefined ? "lst_missing_staff" : `lst_${safeId(primaryStaff.id)}`;
  const staffWidth = Math.max(0, width - STAFF_LEFT - SYSTEM_MARGIN);
  const lineYs = [0, 1, 2, 3].map((offset) => STAFF_TOP + offset);
  const glyphs: LayoutGlyph[] = [];
  const neumes: LayoutNeume[] = [];
  const textSpanToNeumeIds: Record<Id, Id[]> = {};
  const textSpanRelations: Record<Id, AlignmentRelation> = {};

  if (primaryStaff === undefined || primaryVoice === undefined) {
    diagnostics.push({
      severity: "warning",
      code: "empty-document",
      message: "No staff and voice were available for layout.",
    });
  }

  const context: LayoutContext = {
    doc: document,
    systemId,
    staffId: layoutStaffId,
    lineYs,
    semanticToLayoutIds,
    textSpanToNeumeIds,
    textSpanRelations,
    glyphs,
    neumes,
  };

  let x = STAFF_LEFT;
  const clefEvent = primaryVoice === undefined
    ? undefined
    : getVoiceEvents(document, primaryVoice.id).find((entry) => entry.event instanceof ClefChange);
  const clef = clefEvent?.event instanceof ClefChange
    ? clefEvent.event.clef
    : primaryStaff?.defaultClef;
  const clefSemanticId = clefEvent?.eventId ?? primaryStaff?.id ?? "clef_default";
  const clefGlyphId = `lg_${safeId(clefSemanticId)}_clef`;

  if (primaryStaff !== undefined) {
    const clefGlyph = makeClefGlyph(clefGlyphId, clefSemanticId, systemId, layoutStaffId, x, clef ?? primaryStaff.defaultClef);
    glyphs.push(clefGlyph);
    addIndex(semanticToLayoutIds, clefSemanticId, clefGlyph.id);
  }

  x += 2.4;

  if (primaryVoice !== undefined) {
    voiceToSystemIds[primaryVoice.id] = [systemId];
    let pendingClefX: number | undefined;

    for (const entry of getVoiceEvents(document, primaryVoice.id)) {
      if (entry.event instanceof ClefChange) {
        if (entry.eventId !== clefSemanticId) {
          const clefX = pendingClefX ?? x;
          const inlineClefGlyph = makeClefGlyph(
            `lg_${safeId(entry.eventId)}_clef`,
            entry.eventId,
            systemId,
            layoutStaffId,
            clefX,
            entry.event.clef,
          );
          glyphs.push(inlineClefGlyph);
          addIndex(semanticToLayoutIds, entry.eventId, inlineClefGlyph.id);
          x = clefX + 2.4;
        }
        pendingClefX = undefined;
        continue;
      }

      if (entry.event instanceof NeumeGroupEvent) {
        pendingClefX = undefined;
        const neumeGroup = document.music.neumeGroups[entry.event.neumeGroupId];
        if (neumeGroup === undefined) {
          continue;
        }

        const notes = neumeGroup.noteIds.flatMap((noteId) => {
          const note = document.music.notes[noteId];
          return note === undefined ? [] : [note];
        });

        const laidOut = layoutNeumeGroup(context, primaryVoice, primaryStaff ?? entry.staff, neumeGroup, notes, entry.activeClef ?? primaryStaff?.defaultClef, x);
        x = laidOut.nextX;
        continue;
      }

      if (entry.event instanceof BarEvent) {
        const barGlyphId = `lg_${safeId(entry.eventId)}_bar`;
        const barGlyph = makeGlyph({
          id: barGlyphId,
          semanticId: entry.eventId,
          systemId,
          staffId: layoutStaffId,
          defKey: barDefKey(entry.event.kind),
          kind: "barline",
          x,
          y: STAFF_TOP,
          width: entry.event.kind === "double" || entry.event.kind === "final" ? 0.35 : LINE_THICKNESS,
          height: 3,
          zIndex: 2,
          classes: ["barline", `barline-${entry.event.kind}`],
        });
        glyphs.push(barGlyph);
        addIndex(semanticToLayoutIds, entry.eventId, barGlyph.id);
        pendingClefX = x;
        x += BAR_GAP;
      }
    }
  }

  const lyricBaselineY = lyricBaselineForNeumes(neumes);
  const syllables = layoutSyllables(document, systemId, textSpanToNeumeIds, textSpanRelations, neumes, lyricBaselineY, textSpanToSyllableIds, semanticToLayoutIds);
  const textRuns = layoutLyricTextRuns(document, systemId, syllables);
  const height = Math.max(
    STAFF_TOP + LYRIC_BASELINE_OFFSET,
    ...syllables.map((syllable) => syllable.baselineY),
  ) + 2;
  const layoutStaff: LayoutStaff = {
    id: layoutStaffId,
    semanticStaffId: primaryStaff?.id ?? "missing_staff",
    voiceIds: voices.map((voice) => voice.id),
    origin: { x: STAFF_LEFT, y: STAFF_TOP },
    width: staffWidth,
    lineCount: 4,
    lineYs,
    lineThickness: LINE_THICKNESS,
    ledgerSegments: [],
    clefRuns: primaryStaff === undefined ? [] : [{
      clefEventId: clefSemanticId,
      x: STAFF_LEFT,
      glyphId: clefGlyphId,
      governsFromMusicEventId: firstNeumeEventId(document, primaryVoice),
    }],
  };

  const system: LayoutSystem = {
    id: systemId,
    index: 0,
    rect: { x: 0, y: 0, width, height },
    contentRect: { x: SYSTEM_MARGIN, y: SYSTEM_MARGIN, width: Math.max(0, width - (SYSTEM_MARGIN * 2)), height: height - SYSTEM_MARGIN },
    staffSpace: 1,
    staffs: [layoutStaff],
    neumes,
    syllables,
    textRuns,
    glyphs: glyphs.sort(compareGlyphs),
    breakInfo: {
      kind: "auto",
      justification: 0,
      widowPenaltyApplied: false,
      orphanPenaltyApplied: false,
    },
  };

  return {
    schema: "neuma.layout",
    version: VERSION,
    layoutId: `layout_${safeId(document.id)}_${document.revision}`,
    sourceDocumentId: document.id,
    sourceRevision: String(document.revision),
    units: {
      kind: "staffSpace",
      value: 1,
      pxPerStaffSpace,
      lineThickness: LINE_THICKNESS,
    },
    viewport: {
      width,
      height,
      pageMode: "continuous",
    },
    defs: defaultGlyphDefs(),
    systems: [system],
    renderHints: {
      preferredRenderer: "svg",
      pixelSnap: false,
      dprAware: true,
    },
    index: {
      semanticToLayoutIds,
      voiceToSystemIds,
      textSpanToSyllableIds,
    },
    diagnostics,
  };
}

function layoutNeumeGroup(
  context: LayoutContext,
  voice: Voice,
  staff: Staff,
  neumeGroup: NeumeGroup,
  notes: LayoutNoteInput[],
  activeClef: ClefDef | undefined,
  x: number,
): { nextX: number } {
  const neumeGroupId = neumeGroup.id;
  const glyphIds: Id[] = [];
  const noteEventIds: Id[] = [];
  const boxes: Rect[] = [];
  const clef = activeClef ?? staff.defaultClef;
  const porrectusSwashDefKey = porrectusSwashDefKeyForNeume(neumeGroup, notes, clef);

  if (porrectusSwashDefKey !== undefined) {
    layoutPorrectusNeumeGroup({
      context,
      neumeGroupId,
      notes,
      clef,
      x,
      glyphIds,
      noteEventIds,
      boxes,
      swashDefKey: porrectusSwashDefKey,
    });
  } else {
    notes.forEach((note, index) => {
      const noteX = x + (index * NOTE_GAP);
      const noteY = noteCenterY(context, note, clef);
      layoutVisibleNoteGlyph({
        context,
        neumeGroupId,
        note,
        x: noteX,
        y: noteY,
        defKey: noteDefKey(note.sign),
        kind: noteKind(note.sign),
        classes: ["note", `note-${note.sign}`],
        glyphIds,
        noteEventIds,
        boxes,
      });
    });
  }

  const rect = unionRects(boxes) ?? { x, y: STAFF_TOP, width: NOTE_WIDTH, height: NOTE_HEIGHT };
  const neumeId = `ln_${safeId(neumeGroupId)}`;
  const textForEvent = getTextForEvent(context.doc, voice.id, findEventIdForNeumeGroup(context.doc, voice.id, neumeGroupId));
  const textSpanIds = textForEvent.map((entry) => entry.link.textSpanId);
  const relation = textForEvent[0]?.link.relation ?? "syllabic";
  const anchor = {
    x: notes.length === 0 ? x : x + (NOTE_WIDTH / 2),
    y: notes.length === 0 ? STAFF_TOP + 1.5 : rect.y + (rect.height / 2),
  };

  const neume: LayoutNeume = {
    id: neumeId,
    semanticNeumeId: neumeGroupId,
    voiceId: voice.id,
    staffId: context.staffId,
    systemId: context.systemId,
    glyphIds,
    noteEventIds,
    rect,
    anchor,
    textAttachment: {
      textSpanIds,
      relation,
      visualAnchorX: anchor.x,
      visualSpanX1: rect.x,
      visualSpanX2: rect.x + rect.width,
    },
    collisionGroup: `cg_${safeId(neumeGroupId)}`,
  };

  context.neumes.push(neume);
  addIndex(context.semanticToLayoutIds, neumeGroupId, neume.id);

  for (const textSpanId of textSpanIds) {
    addIndex(context.textSpanToNeumeIds, textSpanId, neume.id);
    context.textSpanRelations[textSpanId] = relation;
    addIndex(context.semanticToLayoutIds, textSpanId, neume.id);
  }

  return {
    nextX: x + neumeAdvanceWidth(porrectusSwashDefKey, notes.length) + NEUME_GAP,
  };
}

type LayoutVisibleNoteGlyphOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  note: LayoutNoteInput;
  x: number;
  y: number;
  defKey: Id;
  kind: LayoutGlyphKind;
  classes: string[];
  glyphIds: Id[];
  noteEventIds: Id[];
  boxes: Rect[];
  glyphId?: Id;
};

type LayoutPorrectusNeumeGroupOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  notes: LayoutNoteInput[];
  clef: ClefDef | undefined;
  x: number;
  glyphIds: Id[];
  noteEventIds: Id[];
  boxes: Rect[];
  swashDefKey: Id;
};

function layoutPorrectusNeumeGroup(options: LayoutPorrectusNeumeGroupOptions): void {
  const [first, second, third] = options.notes;
  const firstY = noteCenterY(options.context, first, options.clef);
  const secondY = noteCenterY(options.context, second, options.clef);
  const thirdY = noteCenterY(options.context, third, options.clef);
  const swashSize = glyphSizeForDef(options.swashDefKey);
  const swashGlyphId = `lg_${safeId(first.id)}_${safeId(options.swashDefKey)}`;
  const swashGlyph = makeGlyph({
    id: swashGlyphId,
    semanticId: first.id,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: options.swashDefKey,
    kind: "note",
    x: options.x,
    y: Math.min(firstY, secondY) - (NOTE_HEIGHT / 2),
    width: swashSize.width,
    height: swashSize.height,
    zIndex: 3,
    classes: ["note", "note-porrectus-swash", `note-${options.swashDefKey}`],
  });
  const hiddenSecondGlyph = makeLogicalGlyph({
    id: `lg_${safeId(second.id)}_hidden`,
    semanticId: second.id,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    x: options.x + swashSize.width,
    y: secondY,
  });

  options.glyphIds.push(swashGlyph.id, hiddenSecondGlyph.id);
  options.noteEventIds.push(first.id, second.id);
  options.boxes.push(swashGlyph.hitBox ?? swashGlyph);
  options.context.glyphs.push(swashGlyph, hiddenSecondGlyph);
  addIndex(options.context.semanticToLayoutIds, first.id, swashGlyph.id);
  addIndex(options.context.semanticToLayoutIds, second.id, hiddenSecondGlyph.id);

  addMoraGlyphs({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: first,
    noteX: options.x,
    noteY: firstY,
    baseGlyphId: swashGlyphId,
    glyphIds: options.glyphIds,
    boxes: options.boxes,
  });

  layoutVisibleNoteGlyph({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: third,
    x: options.x + Math.max(0, swashSize.width - PORRECTUS_ENDING_OVERLAP),
    y: thirdY,
    defKey: porrectusEndingDefKey(third),
    kind: noteKind(third.sign),
    classes: ["note", "note-porrectus-ending", `note-${third.sign}`],
    glyphIds: options.glyphIds,
    noteEventIds: options.noteEventIds,
    boxes: options.boxes,
  });
}

function layoutVisibleNoteGlyph(options: LayoutVisibleNoteGlyphOptions): void {
  const glyphId = options.glyphId ?? `lg_${safeId(options.note.id)}`;
  const glyph = makeGlyph({
    id: glyphId,
    semanticId: options.note.id,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: options.defKey,
    kind: options.kind,
    x: options.x,
    y: options.y - (NOTE_HEIGHT / 2),
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
    zIndex: 3,
    classes: options.classes,
  });

  options.glyphIds.push(glyph.id);
  options.noteEventIds.push(options.note.id);
  options.boxes.push(glyph.hitBox ?? glyph);
  options.context.glyphs.push(glyph);
  addIndex(options.context.semanticToLayoutIds, options.note.id, glyph.id);

  addMoraGlyphs({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: options.note,
    noteX: options.x,
    noteY: options.y,
    baseGlyphId: glyphId,
    glyphIds: options.glyphIds,
    boxes: options.boxes,
  });
}

type AddMoraGlyphsOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  note: LayoutNoteInput;
  noteX: number;
  noteY: number;
  baseGlyphId: Id;
  glyphIds: Id[];
  boxes: Rect[];
};

function addMoraGlyphs(options: AddMoraGlyphsOptions): void {
  for (let moraIndex = 0; moraIndex < moraGlyphCount(options.note.rhythmicSigns ?? []); moraIndex += 1) {
    const moraGlyph = makeGlyph({
      id: `${options.baseGlyphId}_mora${moraIndex === 0 ? "" : `_${moraIndex + 1}`}`,
      semanticId: options.note.id,
      parentId: `ln_${safeId(options.neumeGroupId)}`,
      systemId: options.context.systemId,
      staffId: options.context.staffId,
      defKey: "mora",
      kind: "mora",
      x: options.noteX + NOTE_WIDTH + MORA_GAP + (moraIndex * (MORA_SIZE + MORA_GAP)),
      y: options.noteY - (MORA_SIZE / 2),
      width: MORA_SIZE,
      height: MORA_SIZE,
      zIndex: 4,
      classes: ["mora"],
    });

    options.glyphIds.push(moraGlyph.id);
    options.boxes.push(moraGlyph.hitBox ?? moraGlyph);
    options.context.glyphs.push(moraGlyph);
    addIndex(options.context.semanticToLayoutIds, options.note.id, moraGlyph.id);
  }
}

function makeLogicalGlyph(glyph: Omit<LayoutGlyph, "classes" | "defKey" | "height" | "hitBox" | "kind" | "reusable" | "width" | "zIndex">): LayoutGlyph {
  return {
    ...glyph,
    defKey: "none",
    kind: "note",
    width: 0,
    height: 0,
    zIndex: 3,
    classes: ["note", "note-hidden"],
    reusable: true,
  };
}

function noteCenterY(context: LayoutContext, note: LayoutNoteInput, clef: ClefDef | undefined): number {
  return clef === undefined
    ? STAFF_TOP + 1.5
    : context.lineYs[0] + (getStaffPosition(note.pitch, clef, 4).staffStep * 0.5);
}

function layoutSyllables(
  document: ChantDocument,
  systemId: Id,
  textSpanToNeumeIds: Record<Id, Id[]>,
  textSpanRelations: Record<Id, AlignmentRelation>,
  neumes: LayoutNeume[],
  baselineY: number,
  textSpanToSyllableIds: Record<Id, Id[]>,
  semanticToLayoutIds: Record<Id, Id[]>,
): LayoutSyllable[] {
  const neumeById = Object.fromEntries(neumes.map((neume) => [neume.id, neume]));
  return Object.keys(textSpanToNeumeIds).sort((left, right) => {
    const leftX = neumeById[textSpanToNeumeIds[left][0]]?.anchor.x ?? 0;
    const rightX = neumeById[textSpanToNeumeIds[right][0]]?.anchor.x ?? 0;
    return leftX - rightX || left.localeCompare(right);
  }).map((textSpanId) => {
    const attachedNeumeIds = unique(textSpanToNeumeIds[textSpanId]);
    const attachedNeumes = attachedNeumeIds.flatMap((neumeId) => {
      const neume = neumeById[neumeId];
      return neume === undefined ? [] : [neume];
    });
    const firstNeume = attachedNeumes[0];
    const span = document.text.spans[textSpanId];
    const firstSyllable = span?.syllableIds[0] === undefined ? undefined : document.text.syllables[span.syllableIds[0]];
    const text = getHyphenatedTextForSpan(document, textSpanId);
    const textWidth = measureText(text);
    const spanStart = Math.min(...attachedNeumes.map((neume) => neume.textAttachment.visualSpanX1));
    const spanEnd = Math.max(...attachedNeumes.map((neume) => neume.textAttachment.visualSpanX2));
    const relation = textSpanRelations[textSpanId] ?? "syllabic";
    const hasMelisma = relation === "melisma" || attachedNeumes.length > 1 || (firstNeume?.noteEventIds.length ?? 0) > 1;
    const anchorX = firstNeume?.anchor.x ?? spanStart;
    const syllableId = `ls_${safeId(textSpanId)}`;
    const lyricRunId = `txt_${safeId(textSpanId)}`;
    const syllable: LayoutSyllable = {
      id: syllableId,
      semanticTextSpanId: textSpanId,
      systemId,
      wordId: firstSyllable?.wordId,
      lyricRunId,
      attachedNeumeIds,
      bounds: {
        x: anchorX - (textWidth / 2),
        y: baselineY - TEXT_HEIGHT,
        width: textWidth,
        height: TEXT_HEIGHT,
      },
      baselineY,
      anchorPolicy: hasMelisma ? "firstPrincipalNote" : "vowelCentre",
      anchorX,
      melismaExtent: hasMelisma ? { startX: spanStart, endX: spanEnd } : undefined,
      continuation: {
        softHyphenBefore: false,
        softHyphenAfter: false,
        lineBreakWithinWord: false,
        elision: firstSyllable?.role === "elision",
      },
    };

    textSpanToSyllableIds[textSpanId] = [syllable.id];
    addIndex(semanticToLayoutIds, textSpanId, syllable.id);
    return syllable;
  });
}

function lyricBaselineForNeumes(neumes: LayoutNeume[]): number {
  const defaultBaseline = STAFF_TOP + LYRIC_BASELINE_OFFSET;

  if (neumes.length === 0) {
    return defaultBaseline;
  }

  const lowestNeumeBottom = Math.max(...neumes.map((neume) => neume.rect.y + neume.rect.height));
  return Math.max(defaultBaseline, lowestNeumeBottom + TEXT_HEIGHT + LYRIC_NEUME_CLEARANCE);
}

function layoutLyricTextRuns(document: ChantDocument, systemId: Id, syllables: LayoutSyllable[]): LayoutTextRun[] {
  const lyricRuns = syllables.map((syllable) => makeTextRun(document, systemId, syllable));
  const hyphenRuns: LayoutTextRun[] = [];
  const sortedSyllables = [...syllables].sort((left, right) =>
    left.anchorX - right.anchorX || left.id.localeCompare(right.id),
  );

  for (let index = 0; index < sortedSyllables.length - 1; index += 1) {
    const left = sortedSyllables[index];
    const right = sortedSyllables[index + 1];

    if (!shouldHyphenateBetween(document, left, right)) {
      continue;
    }

    const leftRight = left.bounds.x + left.bounds.width;
    const rightLeft = right.bounds.x;
    const x = rightLeft > leftRight
      ? leftRight + ((rightLeft - leftRight) / 2)
      : (left.anchorX + right.anchorX) / 2;

    hyphenRuns.push({
      id: `txt_hyphen_${safeId(left.semanticTextSpanId)}_${safeId(right.semanticTextSpanId)}`,
      role: "lyric",
      text: "-",
      systemId,
      attachedTo: {
        kind: "system",
        id: systemId,
      },
      x,
      y: left.baselineY,
      width: measureText("-"),
      height: TEXT_HEIGHT,
      baselineY: left.baselineY,
      align: "centre",
      fontKey: "lyricMain",
      classes: ["lyric", "lyric-hyphen"],
    });
  }

  return [...lyricRuns, ...hyphenRuns].sort((left, right) =>
    left.x - right.x || left.id.localeCompare(right.id),
  );
}

function makeTextRun(document: ChantDocument, systemId: Id, syllable: LayoutSyllable): LayoutTextRun {
  const text = getHyphenatedTextForSpan(document, syllable.semanticTextSpanId);

  return {
    id: syllable.lyricRunId,
    role: "lyric",
    text,
    systemId,
    attachedTo: {
      kind: "syllable",
      id: syllable.id,
    },
    x: syllable.anchorX,
    y: syllable.baselineY,
    width: syllable.bounds.width,
    height: syllable.bounds.height,
    baselineY: syllable.baselineY,
    align: "centre",
    fontKey: "lyricMain",
    classes: ["lyric"],
    semanticId: syllable.semanticTextSpanId,
  };
}

function shouldHyphenateBetween(document: ChantDocument, left: LayoutSyllable, right: LayoutSyllable): boolean {
  if (left.wordId === undefined || left.wordId !== right.wordId) {
    return false;
  }

  const word = document.text.words[left.wordId];

  if (word === undefined) {
    return false;
  }

  const leftLastIndex = lastSyllableIndexForSpan(document, word.syllableIds, left.semanticTextSpanId);
  const rightFirstIndex = firstSyllableIndexForSpan(document, word.syllableIds, right.semanticTextSpanId);

  return leftLastIndex >= 0 && rightFirstIndex === leftLastIndex + 1;
}

function getHyphenatedTextForSpan(document: ChantDocument, textSpanId: Id): string {
  const span = document.text.spans[textSpanId];

  if (span === undefined) {
    return "";
  }

  return span.syllableIds.map((syllableId, index) => {
    const syllable = document.text.syllables[syllableId];
    const text = syllable?.text ?? "";
    const nextSyllableId = span.syllableIds[index + 1];
    const nextSyllable = nextSyllableId === undefined ? undefined : document.text.syllables[nextSyllableId];
    const needsHyphen = syllable?.wordId !== undefined && syllable.wordId === nextSyllable?.wordId;

    return needsHyphen ? `${text}-` : text;
  }).join("");
}

function firstSyllableIndexForSpan(document: ChantDocument, syllableIds: Id[], textSpanId: Id): number {
  const span = document.text.spans[textSpanId];

  if (span === undefined) {
    return -1;
  }

  for (const syllableId of span.syllableIds) {
    const index = syllableIds.indexOf(syllableId);

    if (index >= 0) {
      return index;
    }
  }

  return -1;
}

function lastSyllableIndexForSpan(document: ChantDocument, syllableIds: Id[], textSpanId: Id): number {
  const span = document.text.spans[textSpanId];

  if (span === undefined) {
    return -1;
  }

  for (let index = span.syllableIds.length - 1; index >= 0; index -= 1) {
    const wordIndex = syllableIds.indexOf(span.syllableIds[index]);

    if (wordIndex >= 0) {
      return wordIndex;
    }
  }

  return -1;
}

function makeClefGlyph(id: Id, semanticId: Id, systemId: Id, staffId: Id, x: number, clef?: ClefDef): LayoutGlyph {
  const line = clef?.line ?? 3;
  const staffLine = Math.min(4, Math.max(1, line));
  const lineY = STAFF_TOP + (4 - staffLine);
  return makeGlyph({
    id,
    semanticId,
    systemId,
    staffId,
    defKey: clef?.shape === "f" ? "clefF" : "clefC",
    kind: "clef",
    x,
    y: lineY - 1,
    width: 1.3,
    height: 2,
    zIndex: 2,
    classes: ["clef", `clef-${clef?.shape ?? "c"}`],
  });
}

function makeGlyph(glyph: Omit<LayoutGlyph, "hitBox" | "reusable">): LayoutGlyph {
  return {
    ...glyph,
    hitBox: {
      x: glyph.x - 0.15,
      y: glyph.y - 0.15,
      width: glyph.width + 0.3,
      height: glyph.height + 0.3,
    },
    reusable: true,
  };
}

function defaultGlyphDefs(): LayoutGlyphDef[] {
  return [
    glyphDef("none", 0, 0),
    glyphDef("punctum", 0.8, 0.8),
    glyphDef("quilisma", 0.8, 0.8),
    glyphDef("inclinatum", 0.8, 0.8),
    glyphDef("liquescentAscending", 0.8, 1),
    glyphDef("liquescentDescending", 0.8, 1),
    glyphDef("oriscusAscending", 0.8, 0.8),
    glyphDef("oriscusDescending", 0.8, 0.8),
    glyphDef("virgaLong", 0.8, 2.2),
    glyphDef("virgaShort", 0.8, 1.7),
    glyphDef("apostropha", 0.8, 0.9),
    glyphDef("podatusLower", 0.8, 0.8),
    glyphDef("podatusUpper", 0.8, 0.8),
    glyphDef("porrectus1", 2.4, 1.6),
    glyphDef("porrectus2", 2.8, 2),
    glyphDef("porrectus3", 3, 2.5),
    glyphDef("porrectus4", 3.2, 3),
    glyphDef("mora", 0.35, 0.35),
    glyphDef("verticalEpisemaAbove", 0.2, 0.6),
    glyphDef("verticalEpisemaBelow", 0.2, 0.6),
    glyphDef("flat", 0.6, 1.7),
    glyphDef("natural", 0.6, 1.7),
    glyphDef("custosLong", 0.4, 2.2),
    glyphDef("custosShort", 0.4, 1.7),
    glyphDef("custosDescLong", 0.4, 2.2),
    glyphDef("custosDescShort", 0.4, 1.7),
    glyphDef("clefC", 1.3, 2),
    glyphDef("clefF", 1.3, 2),
    glyphDef("barQuarter", LINE_THICKNESS, 1.5),
    glyphDef("barHalf", LINE_THICKNESS, 2),
    glyphDef("barFull", LINE_THICKNESS, 3),
    glyphDef("barDouble", 0.35, 3),
    glyphDef("barFinal", 0.35, 3),
  ];
}

function glyphDef(key: Id, width: number, height: number): LayoutGlyphDef {
  return {
    key,
    source: "path",
    advanceWidth: width,
    bbox: { x: 0, y: 0, width, height },
    opticalPadding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  };
}

function noteDefKey(sign: string): Id {
  switch (sign) {
    case "virga":
      return "virgaShort";
    case "inclinatum":
      return "inclinatum";
    case "quilisma":
      return "quilisma";
    case "oriscus":
      return "oriscusAscending";
    case "stropha":
      return "apostropha";
    case "liquescentSmall":
    case "liquescentAscending":
      return "liquescentAscending";
    case "liquescentDescending":
      return "liquescentDescending";
    default:
      return "punctum";
  }
}

function noteKind(sign: string): LayoutGlyphKind {
  switch (sign) {
    case "quilisma":
      return "quilisma";
    case "liquescentSmall":
    case "liquescentAscending":
    case "liquescentDescending":
      return "liquescent";
    default:
      return "note";
  }
}

function porrectusSwashDefKeyForNeume(
  neumeGroup: NeumeGroup,
  notes: LayoutNoteInput[],
  clef: ClefDef | undefined,
): Id | undefined {
  if (!isPorrectusNeume(neumeGroup) || notes.length !== 3 || clef === undefined) {
    return undefined;
  }

  const firstPosition = getStaffPosition(notes[0].pitch, clef, 4).staffStep;
  const secondPosition = getStaffPosition(notes[1].pitch, clef, 4).staffStep;
  const porrectusSize = Math.abs(secondPosition - firstPosition);

  switch (porrectusSize) {
    case 1:
      return "porrectus1";
    case 2:
      return "porrectus2";
    case 3:
      return "porrectus3";
    case 4:
      return "porrectus4";
    default:
      return undefined;
  }
}

function isPorrectusNeume(neumeGroup: NeumeGroup): boolean {
  const glyphHint = neumeGroup.notationHints.find((hint) => hint.key === "glyph")?.value;

  return neumeGroup.contourKindHint === "porrectus"
    || glyphHint === "porrectus"
    || glyphHint === "porrectus1"
    || glyphHint === "porrectus2"
    || glyphHint === "porrectus3"
    || glyphHint === "porrectus4";
}

function porrectusEndingDefKey(note: LayoutNoteInput): Id {
  switch (note.sign) {
    case "liquescentAscending":
      return "liquescentAscending";
    case "liquescentDescending":
      return "liquescentDescending";
    default:
      return "podatusUpper";
  }
}

function glyphSizeForDef(defKey: Id): Pick<Rect, "width" | "height"> {
  const def = defaultGlyphDefs().find((item) => item.key === defKey);
  return {
    width: def?.bbox.width ?? NOTE_WIDTH,
    height: def?.bbox.height ?? NOTE_HEIGHT,
  };
}

function neumeAdvanceWidth(compoundGlyphKey: Id | undefined, noteCount: number): number {
  if (compoundGlyphKey !== undefined) {
    return glyphSizeForDef(compoundGlyphKey).width;
  }

  return Math.max(NOTE_WIDTH, noteCount * NOTE_GAP);
}

function moraGlyphCount(rhythmicSigns: RhythmicSign[]): number {
  return rhythmicSigns.reduce((count, sign) => {
    if (sign === "doubleMora") {
      return count + 2;
    }

    return sign === "mora" ? count + 1 : count;
  }, 0);
}

function barDefKey(kind: string): Id {
  switch (kind) {
    case "quarter":
      return "barQuarter";
    case "half":
      return "barHalf";
    case "double":
      return "barDouble";
    case "final":
      return "barFinal";
    default:
      return "barFull";
  }
}

function firstNeumeEventId(document: ChantDocument, voice: Voice | undefined): Id {
  if (voice === undefined) {
    return "";
  }

  return voice.eventIds.find((eventId) => document.music.events[eventId] instanceof NeumeGroupEvent) ?? "";
}

function findEventIdForNeumeGroup(document: ChantDocument, voiceId: Id, neumeGroupId: Id): Id {
  const voice = document.music.voices[voiceId];
  return voice?.eventIds.find((eventId) => {
    const event = document.music.events[eventId];
    return event instanceof NeumeGroupEvent && event.neumeGroupId === neumeGroupId;
  }) ?? "";
}

function sortedValues<T extends { id: Id }>(record: Record<Id, T>): T[] {
  return Object.values(record).sort((left, right) => left.id.localeCompare(right.id));
}

function safeId(id: Id): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "_");
}

function addIndex(index: Record<Id, Id[]>, semanticId: Id, layoutId: Id): void {
  const ids = index[semanticId] ?? [];
  if (!ids.includes(layoutId)) {
    ids.push(layoutId);
  }
  index[semanticId] = ids;
}

function unique(ids: Id[]): Id[] {
  return [...new Set(ids)];
}

function unionRects(rects: Rect[]): Rect | undefined {
  if (rects.length === 0) {
    return undefined;
  }

  const x1 = Math.min(...rects.map((rect) => rect.x));
  const y1 = Math.min(...rects.map((rect) => rect.y));
  const x2 = Math.max(...rects.map((rect) => rect.x + rect.width));
  const y2 = Math.max(...rects.map((rect) => rect.y + rect.height));
  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
}

function measureText(text: string): number {
  return Math.max(0.8, text.length * 0.48);
}

function compareGlyphs(left: LayoutGlyph, right: LayoutGlyph): number {
  return left.zIndex - right.zIndex || left.x - right.x || left.y - right.y || left.id.localeCompare(right.id);
}
