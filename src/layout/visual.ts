import type { AlignmentRelation } from "../alignment";
import type { Id } from "../common";
import type { ChantDocument } from "../document";
import { BarEvent, ClefChange, NeumeGroupEvent, type ClefDef, type NeumeGroup, type RhythmicSign, type Staff, type Voice } from "../music";
import { getStaffPosition, getTextForEvent, getVoiceEvents, type ResolvedVoiceEvent } from "../query";

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
  | "neumeLine"
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
  lyricTextSize: number;
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
  textSpanAnchors: Record<Id, LayoutTextSpanAnchor[]>;
  glyphs: LayoutGlyph[];
  neumes: LayoutNeume[];
};

type SystemLayoutState = {
  systemId: Id;
  index: number;
  layoutStaffId: Id;
  lineYs: number[];
  context: LayoutContext;
  x: number;
  pendingClefX?: number;
  underlayCursor?: UnderlayPlacement;
  startClef?: ClefDef;
  startClefSemanticId: Id;
  startClefGlyphId: Id;
  contentEventCount: number;
};

type LayoutTextSpanAnchor = {
  x: number;
  spanStart: number;
  spanEnd: number;
  relation: AlignmentRelation;
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
const EXSURGE_PUNCTUM_WIDTH = 100;
const LINE_THICKNESS = 0.16;
const STAFF_TOP = 3;
const STAFF_LEFT = 4;
const SYSTEM_MARGIN = 2;
const STAFF_LINE_INTERVAL = 2;
const STAFF_STEP_INTERVAL = STAFF_LINE_INTERVAL / 2;
const STAFF_HEIGHT = STAFF_LINE_INTERVAL * 3;
const LYRIC_BASELINE_BELOW_STAFF = 2;
const LYRIC_NEUME_CLEARANCE = 0.35;
const LYRIC_TEXT_SIZE = 1.8;
const LYRIC_TEXT_WIDTH_PER_CHARACTER = 0.48;
const LYRIC_MIN_GAP = 0.12;
const LYRIC_WORD_GAP = 0.7;
const LYRIC_HYPHEN_MIN_GAP = 0.4;
const NOTE_WIDTH = 1;
const NOTE_HEIGHT = exsurgeGlyphSize(100, 123.43799591064453).height;
const NOTE_GAP = 0.75;
const PORRECTUS_ENDING_OVERLAPS: Record<Id, number> = {
  porrectus1: NOTE_WIDTH * 0.9,
  porrectus2: NOTE_WIDTH * 1.35,
  porrectus3: NOTE_WIDTH * 1.73,
  porrectus4: NOTE_WIDTH * 1.73,
};
const NEUME_CONNECTOR_LINE_WIDTH = LINE_THICKNESS;
const PORRECTUS_START_LINE_X_OFFSET = 0;
const PORRECTUS_CONNECTOR_MIN_INTERVAL_STEPS = 2;
const PORRECTUS_CONNECTOR_X_OFFSET = 0.55;
const PODATUS_CONNECTOR_X_OFFSET = NOTE_WIDTH - (NEUME_CONNECTOR_LINE_WIDTH / 2);
const TORCULUS_CONNECTOR_MIN_INTERVAL_STEPS = 2;
const TORCULUS_NOTE_GAP = -0.2;
const TORCULUS_CONNECTOR_NOTE_CLEARANCE = -0.17;
const TORCULUS_SECOND_NOTE_X_OFFSET = NOTE_WIDTH + TORCULUS_NOTE_GAP;
const TORCULUS_THIRD_NOTE_X_OFFSET = TORCULUS_SECOND_NOTE_X_OFFSET + (NOTE_WIDTH + TORCULUS_NOTE_GAP);
const TORCULUS_FIRST_CONNECTOR_X_OFFSET = TORCULUS_SECOND_NOTE_X_OFFSET - TORCULUS_CONNECTOR_NOTE_CLEARANCE - (NEUME_CONNECTOR_LINE_WIDTH / 2);
const TORCULUS_SECOND_CONNECTOR_X_OFFSET = TORCULUS_THIRD_NOTE_X_OFFSET - TORCULUS_CONNECTOR_NOTE_CLEARANCE - (NEUME_CONNECTOR_LINE_WIDTH / 2);
const CLIVIS_HANGING_LINE_X_OFFSET = NEUME_CONNECTOR_LINE_WIDTH / 2;
const CLIVIS_HANGING_LINE_PUNCTUM_OVERSHOOT = NOTE_HEIGHT / 2.2;
const PODATUS_UPPER_X_OFFSET = NOTE_WIDTH - exsurgeGlyphSize(91.406005859375, 125.78099822998047).width;
const MORA_SIZE = exsurgeGlyphSize(48, 48).width;
const MORA_GAP = 0.35;
const MORA_ON_LINE_Y_OFFSET = STAFF_STEP_INTERVAL / 2;
const NEUME_GAP = 1.2;
const BAR_GAP = 2;
const BAR_SIDE_GAP = BAR_GAP ;
const TEXT_ONLY_GAP = 1.2;
const SYSTEM_GAP = STAFF_LINE_INTERVAL * 1;

type UnderlayPlacement = {
  textSpanId: Id;
  wordId?: Id;
  leftX: number;
  rightX: number;
};

export function layoutChant(document: ChantDocument, options: LayoutOptions): LayoutDocument {
  const width = options.width;
  const pxPerStaffSpace = options.pxPerStaffSpace ?? 10;
  const diagnostics: LayoutDiagnostic[] = [];
  let semanticToLayoutIds: Record<Id, Id[]> = {};
  const voiceToSystemIds: Record<Id, Id[]> = {};
  const textSpanToSyllableIds: Record<Id, Id[]> = {};
  const staffs = sortedValues(document.music.staves);
  const voices = sortedValues(document.music.voices);
  const primaryStaff = staffs[0];
  const primaryVoice = voices[0];
  const staffWidth = Math.max(0, width - STAFF_LEFT - SYSTEM_MARGIN);

  if (primaryStaff === undefined || primaryVoice === undefined) {
    diagnostics.push({
      severity: "warning",
      code: "empty-document",
      message: "No staff and voice were available for layout.",
    });
  }

  const clefEvent = primaryVoice === undefined
    ? undefined
    : getVoiceEvents(document, primaryVoice.id).find((entry) => entry.event instanceof ClefChange);
  let activeClef = clefEvent?.event instanceof ClefChange
    ? clefEvent.event.clef
    : primaryStaff?.defaultClef;
  let activeClefSemanticId = clefEvent?.eventId ?? primaryStaff?.id ?? "clef_default";
  const systemStates: SystemLayoutState[] = [];
  let currentState = createSystemLayoutState({
    document,
    primaryStaff,
    voices,
    semanticToLayoutIds,
    index: 0,
    startClef: activeClef ?? primaryStaff?.defaultClef,
    startClefSemanticId: activeClefSemanticId,
  });
  semanticToLayoutIds = currentState.context.semanticToLayoutIds;
  systemStates.push(currentState);

  if (primaryVoice !== undefined) {
    voiceToSystemIds[primaryVoice.id] = [currentState.systemId];

    for (const entry of getVoiceEvents(document, primaryVoice.id)) {
      if (entry.event instanceof ClefChange) {
        activeClef = entry.event.clef;
        activeClefSemanticId = entry.eventId;

        if (entry.eventId === currentState.startClefSemanticId && currentState.contentEventCount === 0) {
          currentState.pendingClefX = undefined;
          continue;
        }

        const trial = cloneSystemLayoutState(currentState);
        placeClefChangeOnState(trial, entry.eventId, entry.event.clef);

        if (shouldBreakBeforeState(trial, width) && currentState.contentEventCount > 0) {
          currentState = createSystemLayoutState({
            document,
            primaryStaff,
            voices,
            semanticToLayoutIds,
            index: systemStates.length,
            startClef: activeClef,
            startClefSemanticId: activeClefSemanticId,
          });
          systemStates.push(currentState);
          addVoiceSystemId(voiceToSystemIds, primaryVoice.id, currentState.systemId);
        } else {
          currentState = trial;
          systemStates[systemStates.length - 1] = currentState;
          semanticToLayoutIds = currentState.context.semanticToLayoutIds;
        }
        continue;
      }

      if (entry.event instanceof NeumeGroupEvent || entry.event instanceof BarEvent) {
        const trial = cloneSystemLayoutState(currentState);
        placeMusicEventOnState(trial, document, primaryVoice, primaryStaff ?? entry.staff, entry);

        if (shouldBreakBeforeState(trial, width) && currentState.contentEventCount > 0) {
          currentState = createSystemLayoutState({
            document,
            primaryStaff,
            voices,
            semanticToLayoutIds,
            index: systemStates.length,
            startClef: activeClef ?? entry.activeClef ?? primaryStaff?.defaultClef,
            startClefSemanticId: activeClefSemanticId,
          });
          systemStates.push(currentState);
          addVoiceSystemId(voiceToSystemIds, primaryVoice.id, currentState.systemId);
          placeMusicEventOnState(currentState, document, primaryVoice, primaryStaff ?? entry.staff, entry);

          if (shouldBreakBeforeState(currentState, width)) {
            diagnostics.push({
              severity: "warning",
              code: "layout-system-overflow",
              message: `Music event '${entry.eventId}' is wider than the available system width.`,
              semanticIds: [entry.eventId],
              layoutIds: currentState.context.glyphs.map((glyph) => glyph.id),
            });
          }
        } else {
          currentState = trial;
          systemStates[systemStates.length - 1] = currentState;
        }

        semanticToLayoutIds = currentState.context.semanticToLayoutIds;
      }
    }
  }

  const systems: LayoutSystem[] = [];
  let nextSystemY = 0;

  for (const state of systemStates) {
    const baseSystem = finalizeSystemLayoutState({
      state,
      document,
      primaryStaff,
      voices,
      primaryVoice,
      staffWidth,
      width,
      textSpanToSyllableIds,
    });
    const system = translateSystem(baseSystem, nextSystemY);
    systems.push(system);
    semanticToLayoutIds = mergeIndexes(semanticToLayoutIds, state.context.semanticToLayoutIds);
    nextSystemY += system.rect.height + SYSTEM_GAP;
  }

  const viewportHeight = systems.length === 0
    ? defaultLyricBaseline() + 2
    : Math.max(...systems.map((system) => system.rect.y + system.rect.height));

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
      lyricTextSize: LYRIC_TEXT_SIZE,
    },
    viewport: {
      width,
      height: viewportHeight,
      pageMode: "continuous",
    },
    defs: defaultGlyphDefs(),
    systems,
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

type CreateSystemLayoutStateOptions = {
  document: ChantDocument;
  primaryStaff?: Staff;
  voices: Voice[];
  semanticToLayoutIds: Record<Id, Id[]>;
  index: number;
  startClef?: ClefDef;
  startClefSemanticId: Id;
};

type FinalizeSystemLayoutStateOptions = {
  state: SystemLayoutState;
  document: ChantDocument;
  primaryStaff?: Staff;
  voices: Voice[];
  primaryVoice?: Voice;
  staffWidth: number;
  width: number;
  textSpanToSyllableIds: Record<Id, Id[]>;
};

function createSystemLayoutState(options: CreateSystemLayoutStateOptions): SystemLayoutState {
  const systemId = options.index === 0 ? "sys_1" : `sys_${options.index + 1}`;
  const baseStaffId = options.primaryStaff === undefined ? "lst_missing_staff" : `lst_${safeId(options.primaryStaff.id)}`;
  const layoutStaffId = options.index === 0 ? baseStaffId : `${baseStaffId}_${systemId}`;
  const lineYs = [0, 1, 2, 3].map((offset) => STAFF_TOP + (offset * STAFF_LINE_INTERVAL));
  const context: LayoutContext = {
    doc: options.document,
    systemId,
    staffId: layoutStaffId,
    lineYs,
    semanticToLayoutIds: cloneIndex(options.semanticToLayoutIds),
    textSpanToNeumeIds: {},
    textSpanRelations: {},
    textSpanAnchors: {},
    glyphs: [],
    neumes: [],
  };
  const startClefGlyphId = options.index === 0
    ? `lg_${safeId(options.startClefSemanticId)}_clef`
    : `lg_${safeId(options.startClefSemanticId)}_clef_${systemId}`;

  if (options.primaryStaff !== undefined) {
    const clefGlyph = makeClefGlyph(
      startClefGlyphId,
      options.startClefSemanticId,
      systemId,
      layoutStaffId,
      STAFF_LEFT,
      options.startClef ?? options.primaryStaff.defaultClef,
      lineYs,
    );
    context.glyphs.push(clefGlyph);
    addIndex(context.semanticToLayoutIds, options.startClefSemanticId, clefGlyph.id);
  }

  return {
    systemId,
    index: options.index,
    layoutStaffId,
    lineYs,
    context,
    x: STAFF_LEFT + 2.4,
    startClef: options.startClef,
    startClefSemanticId: options.startClefSemanticId,
    startClefGlyphId,
    contentEventCount: 0,
  };
}

function cloneSystemLayoutState(state: SystemLayoutState): SystemLayoutState {
  return {
    ...state,
    context: {
      ...state.context,
      semanticToLayoutIds: cloneIndex(state.context.semanticToLayoutIds),
      textSpanToNeumeIds: cloneIndex(state.context.textSpanToNeumeIds),
      textSpanRelations: { ...state.context.textSpanRelations },
      textSpanAnchors: cloneAnchorIndex(state.context.textSpanAnchors),
      glyphs: [...state.context.glyphs],
      neumes: [...state.context.neumes],
    },
    underlayCursor: state.underlayCursor === undefined ? undefined : { ...state.underlayCursor },
  };
}

function placeClefChangeOnState(state: SystemLayoutState, eventId: Id, clef: ClefDef): void {
  const clefX = state.pendingClefX ?? state.x;
  const inlineClefGlyph = makeClefGlyph(
    `lg_${safeId(eventId)}_clef${state.index === 0 ? "" : `_${state.systemId}`}`,
    eventId,
    state.systemId,
    state.layoutStaffId,
    clefX,
    clef,
    state.lineYs,
  );
  state.context.glyphs.push(inlineClefGlyph);
  addIndex(state.context.semanticToLayoutIds, eventId, inlineClefGlyph.id);
  state.x = clefX + 2.4;
  state.pendingClefX = undefined;
}

function placeMusicEventOnState(
  state: SystemLayoutState,
  document: ChantDocument,
  voice: Voice,
  staff: Staff,
  entry: ResolvedVoiceEvent,
): void {
  if (entry.event instanceof NeumeGroupEvent) {
    state.pendingClefX = undefined;
    state.x = applyUnderlaySpacing(document, voice.id, entry.eventId, state.x, NOTE_WIDTH / 2, state.underlayCursor);
    const neumeGroup = document.music.neumeGroups[entry.event.neumeGroupId];
    if (neumeGroup === undefined) {
      return;
    }

    const notes = neumeGroup.noteIds.flatMap((noteId) => {
      const note = document.music.notes[noteId];
      return note === undefined ? [] : [note];
    });
    const laidOut = layoutNeumeGroup(state.context, voice, staff, neumeGroup, notes, entry.activeClef ?? staff.defaultClef, state.x);
    state.underlayCursor = underlayPlacementForEvent(document, voice.id, entry.eventId, state.x + (NOTE_WIDTH / 2), state.underlayCursor);
    state.x = laidOut.nextX;
    state.contentEventCount += 1;
    return;
  }

  if (entry.event instanceof BarEvent) {
    const barGlyphId = `lg_${safeId(entry.eventId)}_bar`;
    const barDef = barDefKey(entry.event.kind);
    const barSize = glyphSizeForDef(barDef);
    state.x = applyUnderlaySpacing(document, voice.id, entry.eventId, state.x, BAR_SIDE_GAP + (barSize.width / 2), state.underlayCursor);
    const barX = state.x + BAR_SIDE_GAP;
    const barGlyph = makeGlyph({
      id: barGlyphId,
      semanticId: entry.eventId,
      systemId: state.systemId,
      staffId: state.layoutStaffId,
      defKey: barDef,
      kind: "barline",
      x: barX,
      y: barY(barDef, state.lineYs),
      width: barSize.width,
      height: barSize.height,
      zIndex: 2,
      classes: ["barline", `barline-${entry.event.kind}`],
    });
    state.context.glyphs.push(barGlyph);
    addIndex(state.context.semanticToLayoutIds, entry.eventId, barGlyph.id);

    for (const text of getTextForEvent(document, voice.id, entry.eventId)) {
      addTextSpanAnchor(state.context, text.link.textSpanId, {
        x: barX + (barGlyph.width / 2),
        spanStart: barX,
        spanEnd: barX + barGlyph.width,
        relation: text.link.relation,
      });
      addIndex(state.context.semanticToLayoutIds, text.link.textSpanId, barGlyph.id);
    }

    state.pendingClefX = barX;
    state.underlayCursor = underlayPlacementForEvent(document, voice.id, entry.eventId, barX + (barGlyph.width / 2), state.underlayCursor);
    state.x = barX + barGlyph.width + BAR_SIDE_GAP;
    state.contentEventCount += 1;
  }
}

function shouldBreakBeforeState(state: SystemLayoutState, width: number): boolean {
  const rightBoundary = Math.max(STAFF_LEFT, width - SYSTEM_MARGIN);
  return systemRightEdge(state) > rightBoundary;
}

function systemRightEdge(state: SystemLayoutState): number {
  const glyphRight = state.context.glyphs.reduce((right, glyph) => Math.max(right, glyph.x + glyph.width), STAFF_LEFT);
  const lyricRight = Object.entries(state.context.textSpanAnchors).reduce((right, [textSpanId, anchors]) => {
    const explicitAnchor = explicitTextSpanAnchor(anchors);
    if (explicitAnchor === undefined) {
      return right;
    }

    const textWidth = measureText(getHyphenatedTextForSpan(state.context.doc, textSpanId));
    return Math.max(right, explicitAnchor.x + (textWidth / 2));
  }, STAFF_LEFT);

  return Math.max(glyphRight, lyricRight);
}

function finalizeSystemLayoutState(options: FinalizeSystemLayoutStateOptions): LayoutSystem {
  const state = options.state;
  const lyricBaselineY = lyricBaselineForNeumes(state.context.neumes, state.lineYs);
  const textSpanIds = layoutTextSpanOrderForSystem(
    options.document,
    state.context.textSpanAnchors,
    state.context.textSpanToNeumeIds,
  );
  const syllables = layoutSyllables(
    options.document,
    state.systemId,
    state.context.textSpanToNeumeIds,
    state.context.textSpanRelations,
    state.context.textSpanAnchors,
    state.context.neumes,
    lyricBaselineY,
    options.textSpanToSyllableIds,
    state.context.semanticToLayoutIds,
    textSpanIds,
  );
  const textRuns = layoutLyricTextRuns(options.document, state.systemId, syllables);
  const height = Math.max(
    defaultLyricBaseline(state.lineYs),
    ...syllables.map((syllable) => syllable.baselineY),
  ) + 2;
  const layoutStaff: LayoutStaff = {
    id: state.layoutStaffId,
    semanticStaffId: options.primaryStaff?.id ?? "missing_staff",
    voiceIds: options.voices.map((voice) => voice.id),
    origin: { x: STAFF_LEFT, y: state.lineYs[0] },
    width: options.staffWidth,
    lineCount: 4,
    lineYs: state.lineYs,
    lineThickness: LINE_THICKNESS,
    ledgerSegments: [],
    clefRuns: options.primaryStaff === undefined ? [] : [{
      clefEventId: state.startClefSemanticId,
      x: STAFF_LEFT,
      glyphId: state.startClefGlyphId,
      governsFromMusicEventId: firstNeumeEventId(options.document, options.primaryVoice),
    }],
  };

  return {
    id: state.systemId,
    index: state.index,
    rect: { x: 0, y: 0, width: options.width, height },
    contentRect: { x: SYSTEM_MARGIN, y: SYSTEM_MARGIN, width: Math.max(0, options.width - (SYSTEM_MARGIN * 2)), height: height - SYSTEM_MARGIN },
    staffSpace: STAFF_LINE_INTERVAL,
    staffs: [layoutStaff],
    neumes: state.context.neumes,
    syllables,
    textRuns,
    glyphs: state.context.glyphs.sort(compareGlyphs),
    breakInfo: {
      kind: "auto",
      justification: 0,
      widowPenaltyApplied: false,
      orphanPenaltyApplied: false,
    },
  };
}

function translateSystem(system: LayoutSystem, dy: number): LayoutSystem {
  if (dy === 0) {
    return system;
  }

  return {
    ...system,
    rect: translateRect(system.rect, 0, dy),
    contentRect: translateRect(system.contentRect, 0, dy),
    staffs: system.staffs.map((staff) => ({
      ...staff,
      origin: { x: staff.origin.x, y: staff.origin.y + dy },
      lineYs: staff.lineYs.map((lineY) => lineY + dy),
      ledgerSegments: staff.ledgerSegments.map((segment) => ({ ...segment, y: segment.y + dy })),
    })),
    neumes: system.neumes.map((neume) => ({
      ...neume,
      rect: translateRect(neume.rect, 0, dy),
      anchor: { x: neume.anchor.x, y: neume.anchor.y + dy },
    })),
    syllables: system.syllables.map((syllable) => ({
      ...syllable,
      bounds: translateRect(syllable.bounds, 0, dy),
      baselineY: syllable.baselineY + dy,
    })),
    textRuns: system.textRuns.map((run) => ({
      ...run,
      y: run.y + dy,
      baselineY: run.baselineY + dy,
    })),
    glyphs: system.glyphs.map((glyph) => ({
      ...glyph,
      y: glyph.y + dy,
      hitBox: glyph.hitBox === undefined ? undefined : translateRect(glyph.hitBox, 0, dy),
    })),
  };
}

function translateRect(rect: Rect, dx: number, dy: number): Rect {
  return {
    x: rect.x + dx,
    y: rect.y + dy,
    width: rect.width,
    height: rect.height,
  };
}

function addVoiceSystemId(index: Record<Id, Id[]>, voiceId: Id, systemId: Id): void {
  const systemIds = index[voiceId] ?? [];
  if (!systemIds.includes(systemId)) {
    systemIds.push(systemId);
  }
  index[voiceId] = systemIds;
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
  const podatus = isPodatusNeume(neumeGroup, notes, clef);
  const clivis = isClivisNeume(neumeGroup, notes, clef);
  const torculus = isTorculusNeume(neumeGroup, notes, clef);
  let advanceWidth = neumeAdvanceWidth(porrectusSwashDefKey, notes.length);

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
  } else if (podatus) {
    advanceWidth = layoutPodatusNeumeGroup({
      context,
      neumeGroupId,
      notes,
      clef,
      x,
      glyphIds,
      noteEventIds,
      boxes,
    }).advanceWidth;
  } else if (clivis) {
    advanceWidth = layoutClivisNeumeGroup({
      context,
      neumeGroupId,
      notes,
      clef,
      x,
      glyphIds,
      noteEventIds,
      boxes,
    }).advanceWidth;
  } else if (torculus) {
    advanceWidth = layoutTorculusNeumeGroup({
      context,
      neumeGroupId,
      notes,
      clef,
      x,
      glyphIds,
      noteEventIds,
      boxes,
    }).advanceWidth;
  } else {
    notes.forEach((note, index) => {
      const noteX = x + (index * NOTE_GAP);
      const noteY = noteCenterY(context, note, clef);
      layoutVisibleNoteGlyph({
        context,
        neumeGroupId,
        note,
        clef,
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
    addTextSpanAnchor(context, textSpanId, {
      x: anchor.x,
      spanStart: rect.x,
      spanEnd: rect.x + rect.width,
      relation,
    });
    addIndex(context.semanticToLayoutIds, textSpanId, neume.id);
  }

  return {
    nextX: x + advanceWidth + NEUME_GAP,
  };
}

type LayoutVisibleNoteGlyphOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  note: LayoutNoteInput;
  clef: ClefDef | undefined;
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

type LayoutPorrectusConnectorLineOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  second: LayoutNoteInput;
  third: LayoutNoteInput;
  clef: ClefDef | undefined;
  x: number;
  secondY: number;
  thirdY: number;
  glyphIds: Id[];
  boxes: Rect[];
};

type LayoutPorrectusStartLineOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  first: LayoutNoteInput;
  second: LayoutNoteInput;
  x: number;
  firstY: number;
  secondY: number;
  glyphIds: Id[];
  boxes: Rect[];
};

type LayoutClivisNeumeGroupOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  notes: LayoutNoteInput[];
  clef: ClefDef | undefined;
  x: number;
  glyphIds: Id[];
  noteEventIds: Id[];
  boxes: Rect[];
};

type LayoutPodatusNeumeGroupOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  notes: LayoutNoteInput[];
  clef: ClefDef | undefined;
  x: number;
  glyphIds: Id[];
  noteEventIds: Id[];
  boxes: Rect[];
};

type LayoutPodatusConnectorLineOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  lower: LayoutNoteInput;
  upper: LayoutNoteInput;
  x: number;
  lowerY: number;
  upperY: number;
  glyphIds: Id[];
  boxes: Rect[];
};

type LayoutTorculusNeumeGroupOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  notes: LayoutNoteInput[];
  clef: ClefDef | undefined;
  x: number;
  glyphIds: Id[];
  noteEventIds: Id[];
  boxes: Rect[];
};

type LayoutTorculusConnectorLineOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  from: LayoutNoteInput;
  to: LayoutNoteInput;
  clef: ClefDef;
  x: number;
  fromY: number;
  toY: number;
  glyphIds: Id[];
  boxes: Rect[];
};

type LayoutClivisHangingLineOptions = {
  context: LayoutContext;
  neumeGroupId: Id;
  upper: LayoutNoteInput;
  lower: LayoutNoteInput;
  clef: ClefDef;
  x: number;
  upperY: number;
  lowerY: number;
  glyphIds: Id[];
  boxes: Rect[];
};

function layoutPorrectusNeumeGroup(options: LayoutPorrectusNeumeGroupOptions): void {
  const [first, second, third] = options.notes;
  const firstY = noteCenterY(options.context, first, options.clef);
  const secondY = noteCenterY(options.context, second, options.clef);
  const thirdY = noteCenterY(options.context, third, options.clef);
  const swashSize = glyphSizeForDef(options.swashDefKey);
  const endingDefKey = porrectusEndingDefKey(third);
  const endingOverlap = porrectusEndingOverlap(options.swashDefKey, endingDefKey);
  const endingX = options.x + Math.max(0, swashSize.width - endingOverlap);
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

  layoutPorrectusStartLine({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    first,
    second,
    x: options.x + PORRECTUS_START_LINE_X_OFFSET,
    firstY,
    secondY: secondY + (NOTE_HEIGHT* 0.8),
    glyphIds: options.glyphIds,
    boxes: options.boxes,
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
    clef: options.clef,
    noteX: options.x,
    noteY: firstY,
    baseGlyphId: swashGlyphId,
    glyphIds: options.glyphIds,
    boxes: options.boxes,
  });

  layoutPorrectusConnectorLine({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    second,
    third,
    clef: options.clef,
    x: endingX + PORRECTUS_CONNECTOR_X_OFFSET,
    secondY,
    thirdY,
    glyphIds: options.glyphIds,
    boxes: options.boxes,
  });

  layoutVisibleNoteGlyph({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: third,
    clef: options.clef,
    x: endingX,
    y: thirdY,
    defKey: endingDefKey,
    kind: noteKind(third.sign),
    classes: ["note", "note-porrectus-ending", `note-${third.sign}`],
    glyphIds: options.glyphIds,
    noteEventIds: options.noteEventIds,
    boxes: options.boxes,
  });
}

function layoutPodatusNeumeGroup(options: LayoutPodatusNeumeGroupOptions): { advanceWidth: number } {
  const [lower, upper] = options.notes;
  const lowerDefKey = podatusLowerDefKey(lower);
  const upperDefKey = podatusUpperDefKey(upper);
  const lowerSize = glyphSizeForDef(lowerDefKey);
  const upperSize = glyphSizeForDef(upperDefKey);
  const lowerY = noteCenterY(options.context, lower, options.clef);
  const upperY = noteCenterY(options.context, upper, options.clef);
  const upperX = options.x + PODATUS_UPPER_X_OFFSET;

  layoutVisibleNoteGlyph({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: lower,
    clef: options.clef,
    x: options.x,
    y: lowerY,
    defKey: lowerDefKey,
    kind: noteKind(lower.sign),
    classes: ["note", "note-podatus-lower", `note-${lower.sign}`],
    glyphIds: options.glyphIds,
    noteEventIds: options.noteEventIds,
    boxes: options.boxes,
  });

  layoutPodatusConnectorLine({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    lower,
    upper,
    x: options.x + PODATUS_CONNECTOR_X_OFFSET,
    lowerY,
    upperY,
    glyphIds: options.glyphIds,
    boxes: options.boxes,
  });

  layoutVisibleNoteGlyph({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: upper,
    clef: options.clef,
    x: upperX,
    y: upperY,
    defKey: upperDefKey,
    kind: noteKind(upper.sign),
    classes: ["note", "note-podatus-upper", `note-${upper.sign}`],
    glyphIds: options.glyphIds,
    noteEventIds: options.noteEventIds,
    boxes: options.boxes,
  });

  return {
    advanceWidth: Math.max(lowerSize.width, PODATUS_UPPER_X_OFFSET + upperSize.width),
  };
}

function layoutPodatusConnectorLine(options: LayoutPodatusConnectorLineOptions): void {
  const y = Math.min(options.lowerY, options.upperY);
  const height = Math.abs(options.upperY - options.lowerY);

  if (height === 0) {
    return;
  }

  const line = makeGlyph({
    id: `lg_${safeId(options.lower.id)}_${safeId(options.upper.id)}_podatus_connector`,
    semanticId: options.neumeGroupId,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: "neumeConnectorLine",
    kind: "neumeLine",
    x: options.x,
    y,
    width: NEUME_CONNECTOR_LINE_WIDTH,
    height,
    zIndex: 2,
    classes: ["neume-line", "podatus-connector-line"],
  });

  options.glyphIds.push(line.id);
  options.boxes.push(line.hitBox ?? line);
  options.context.glyphs.push(line);
}

function layoutClivisNeumeGroup(options: LayoutClivisNeumeGroupOptions): { advanceWidth: number } {
  const [upper, lower] = options.notes;
  const upperDefKey = clivisUpperDefKey(upper);
  const lowerDefKey = noteDefKey(lower.sign);
  const upperSize = glyphSizeForDef(upperDefKey);
  const lowerSize = glyphSizeForDef(lowerDefKey);
  const upperY = noteCenterY(options.context, upper, options.clef);
  const lowerY = noteCenterY(options.context, lower, options.clef);
  const lowerX = options.x + upperSize.width;

  if (options.clef !== undefined && upper.sign !== "oriscus") {
    layoutClivisHangingLine({
      context: options.context,
      neumeGroupId: options.neumeGroupId,
      upper,
      lower,
      clef: options.clef,
      x: options.x + CLIVIS_HANGING_LINE_X_OFFSET,
      upperY,
      lowerY,
      glyphIds: options.glyphIds,
      boxes: options.boxes,
    });
  }

  layoutVisibleNoteGlyph({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: upper,
    clef: options.clef,
    x: options.x,
    y: upperY,
    defKey: upperDefKey,
    kind: noteKind(upper.sign),
    classes: ["note", "note-clivis-upper", `note-${upper.sign}`],
    glyphIds: options.glyphIds,
    noteEventIds: options.noteEventIds,
    boxes: options.boxes,
  });

  layoutVisibleNoteGlyph({
    context: options.context,
    neumeGroupId: options.neumeGroupId,
    note: lower,
    clef: options.clef,
    x: lowerX,
    y: lowerY,
    defKey: lowerDefKey,
    kind: noteKind(lower.sign),
    classes: ["note", "note-clivis-lower", `note-${lower.sign}`],
    glyphIds: options.glyphIds,
    noteEventIds: options.noteEventIds,
    boxes: options.boxes,
  });

  return {
    advanceWidth: upperSize.width + lowerSize.width,
  };
}

function layoutTorculusNeumeGroup(options: LayoutTorculusNeumeGroupOptions): { advanceWidth: number } {
  const notePositions = options.notes.map((note, index) => {
    const noteXOffsets = [
      0,
      TORCULUS_SECOND_NOTE_X_OFFSET,
      TORCULUS_THIRD_NOTE_X_OFFSET,
    ];
    const xOffset = noteXOffsets[index] ?? (TORCULUS_THIRD_NOTE_X_OFFSET + ((index - 2) * NOTE_GAP));

    return {
      note,
      x: options.x + xOffset,
      y: noteCenterY(options.context, note, options.clef),
    };
  });
  const connectorXOffsets = [
    TORCULUS_FIRST_CONNECTOR_X_OFFSET,
    TORCULUS_SECOND_CONNECTOR_X_OFFSET,
  ];

  if (options.clef !== undefined) {
    for (let index = 1; index < notePositions.length; index += 1) {
      const previous = notePositions[index - 1];
      const current = notePositions[index];
      const connectorXOffset = connectorXOffsets[index - 1] ?? (current.x - options.x + (NEUME_CONNECTOR_LINE_WIDTH / 2));

      layoutTorculusConnectorLine({
        context: options.context,
        neumeGroupId: options.neumeGroupId,
        from: previous.note,
        to: current.note,
        clef: options.clef,
        x: options.x + connectorXOffset,
        fromY: previous.y,
        toY: current.y,
        glyphIds: options.glyphIds,
        boxes: options.boxes,
      });
    }
  }

  for (const position of notePositions) {
    layoutVisibleNoteGlyph({
      context: options.context,
      neumeGroupId: options.neumeGroupId,
      note: position.note,
      clef: options.clef,
      x: position.x,
      y: position.y,
      defKey: noteDefKey(position.note.sign),
      kind: noteKind(position.note.sign),
      classes: ["note", "note-torculus", `note-${position.note.sign}`],
      glyphIds: options.glyphIds,
      noteEventIds: options.noteEventIds,
      boxes: options.boxes,
    });
  }

  return {
    advanceWidth: torculusAdvanceWidth(options.notes.length),
  };
}

function layoutClivisHangingLine(options: LayoutClivisHangingLineOptions): void {
  const upperStep = getStaffPosition(options.upper.pitch, options.clef, 4).staffStep;
  const lowerStep = getStaffPosition(options.lower.pitch, options.clef, 4).staffStep;
  const intervalSteps = lowerStep - upperStep;
  const lowerWithinStaff = lowerStep < 6;
  const extendedLowerY = intervalSteps === 1 && upperStep % 2 === 0 && lowerWithinStaff
    ? options.lowerY + STAFF_STEP_INTERVAL
    : options.lowerY;
  const y = Math.min(options.upperY, extendedLowerY);
  const lineEndY = extendedLowerY + CLIVIS_HANGING_LINE_PUNCTUM_OVERSHOOT;
  const height = lineEndY - y;

  if (height <= 0) {
    return;
  }

  const line = makeGlyph({
    id: `lg_${safeId(options.lower.id)}_${safeId(options.upper.id)}_clivis_hanging_line`,
    semanticId: options.neumeGroupId,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: "neumeConnectorLine",
    kind: "neumeLine",
    x: options.x,
    y,
    width: NEUME_CONNECTOR_LINE_WIDTH,
    height,
    zIndex: 2,
    classes: ["neume-line", "clivis-hanging-line"],
  });

  options.glyphIds.push(line.id);
  options.boxes.push(line.hitBox ?? line);
  options.context.glyphs.push(line);
}

function layoutTorculusConnectorLine(options: LayoutTorculusConnectorLineOptions): void {
  const fromStaffStep = getStaffPosition(options.from.pitch, options.clef, 4).staffStep;
  const toStaffStep = getStaffPosition(options.to.pitch, options.clef, 4).staffStep;

  if (Math.abs(toStaffStep - fromStaffStep) < TORCULUS_CONNECTOR_MIN_INTERVAL_STEPS) {
    return;
  }

  const y = Math.min(options.fromY, options.toY);
  const height = Math.abs(options.toY - options.fromY);

  if (height === 0) {
    return;
  }

  const line = makeGlyph({
    id: `lg_${safeId(options.from.id)}_${safeId(options.to.id)}_torculus_connector`,
    semanticId: options.neumeGroupId,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: "neumeConnectorLine",
    kind: "neumeLine",
    x: options.x,
    y,
    width: NEUME_CONNECTOR_LINE_WIDTH,
    height,
    zIndex: 2,
    classes: ["neume-line", "torculus-connector-line"],
  });

  options.glyphIds.push(line.id);
  options.boxes.push(line.hitBox ?? line);
  options.context.glyphs.push(line);
}

function layoutPorrectusStartLine(options: LayoutPorrectusStartLineOptions): void {
  const y = Math.min(options.firstY, options.secondY);
  const height = Math.abs(options.secondY - options.firstY);
  if (height === 0) {
    return;
  }

  const line = makeGlyph({
    id: `lg_${safeId(options.second.id)}_${safeId(options.first.id)}_start_connector`,
    semanticId: options.neumeGroupId,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: "neumeConnectorLine",
    kind: "neumeLine",
    x: options.x,
    y,
    width: NEUME_CONNECTOR_LINE_WIDTH,
    height,
    zIndex: 2,
    classes: ["neume-line", "porrectus-start-line"],
  });

  options.glyphIds.push(line.id);
  options.boxes.push(line.hitBox ?? line);
  options.context.glyphs.push(line);
}

function layoutPorrectusConnectorLine(options: LayoutPorrectusConnectorLineOptions): void {
  if (porrectusSecondToThirdIntervalSteps(options.second, options.third, options.clef) < PORRECTUS_CONNECTOR_MIN_INTERVAL_STEPS) {
    return;
  }

  const y = Math.min(options.secondY, options.thirdY);
  const height = Math.abs(options.thirdY - options.secondY);
  if (height === 0) {
    return;
  }

  const line = makeGlyph({
    id: `lg_${safeId(options.second.id)}_${safeId(options.third.id)}_connector`,
    semanticId: options.neumeGroupId,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: "neumeConnectorLine",
    kind: "neumeLine",
    x: options.x,
    y,
    width: NEUME_CONNECTOR_LINE_WIDTH,
    height,
    zIndex: 2,
    classes: ["neume-line", "porrectus-ending-connector"],
  });

  options.glyphIds.push(line.id);
  options.boxes.push(line.hitBox ?? line);
  options.context.glyphs.push(line);
}

function layoutVisibleNoteGlyph(options: LayoutVisibleNoteGlyphOptions): void {
  const glyphId = options.glyphId ?? `lg_${safeId(options.note.id)}`;
  const glyphSize = glyphSizeForDef(options.defKey);
  const glyph = makeGlyph({
    id: glyphId,
    semanticId: options.note.id,
    parentId: `ln_${safeId(options.neumeGroupId)}`,
    systemId: options.context.systemId,
    staffId: options.context.staffId,
    defKey: options.defKey,
    kind: options.kind,
    x: options.x,
    y: options.y - (glyphSize.height / 2),
    width: glyphSize.width,
    height: glyphSize.height,
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
    clef: options.clef,
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
  clef: ClefDef | undefined;
  noteX: number;
  noteY: number;
  baseGlyphId: Id;
  glyphIds: Id[];
  boxes: Rect[];
};

function addMoraGlyphs(options: AddMoraGlyphsOptions): void {
  for (let moraIndex = 0; moraIndex < moraGlyphCount(options.note.rhythmicSigns ?? []); moraIndex += 1) {
    const moraY = moraCenterY(options.note, options.clef, options.noteY);
    const moraGlyph = makeGlyph({
      id: `${options.baseGlyphId}_mora${moraIndex === 0 ? "" : `_${moraIndex + 1}`}`,
      semanticId: options.note.id,
      parentId: `ln_${safeId(options.neumeGroupId)}`,
      systemId: options.context.systemId,
      staffId: options.context.staffId,
      defKey: "mora",
      kind: "mora",
      x: options.noteX + NOTE_WIDTH + MORA_GAP + (moraIndex * (MORA_SIZE + MORA_GAP)),
      y: moraY - (MORA_SIZE / 2),
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

function moraCenterY(note: LayoutNoteInput, clef: ClefDef | undefined, noteY: number): number {
  if (clef === undefined) {
    return noteY;
  }

  const position = getStaffPosition(note.pitch, clef, 4);

  if (!position.isOnLine || position.line === undefined) {
    return noteY;
  }

  return noteY + MORA_ON_LINE_Y_OFFSET;
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
    ? STAFF_TOP + (STAFF_HEIGHT / 2)
    : context.lineYs[0] + (getStaffPosition(note.pitch, clef, 4).staffStep * STAFF_STEP_INTERVAL);
}

function layoutSyllables(
  document: ChantDocument,
  systemId: Id,
  textSpanToNeumeIds: Record<Id, Id[]>,
  textSpanRelations: Record<Id, AlignmentRelation>,
  textSpanAnchors: Record<Id, LayoutTextSpanAnchor[]>,
  neumes: LayoutNeume[],
  baselineY: number,
  textSpanToSyllableIds: Record<Id, Id[]>,
  semanticToLayoutIds: Record<Id, Id[]>,
  orderedTextSpanIds?: Id[],
): LayoutSyllable[] {
  const neumeById = Object.fromEntries(neumes.map((neume) => [neume.id, neume]));
  const textSpanIds = orderedTextSpanIds ?? layoutTextSpanOrder(document, textSpanAnchors, textSpanToNeumeIds);
  const explicitAnchors: Record<Id, LayoutTextSpanAnchor> = {};

  for (const textSpanId of textSpanIds) {
    const anchor = explicitTextSpanAnchor(textSpanAnchors[textSpanId]);
    if (anchor !== undefined) {
      explicitAnchors[textSpanId] = anchor;
    }
  }

  return textSpanIds.map((textSpanId, index) => {
    const attachedNeumeIds = unique(textSpanToNeumeIds[textSpanId] ?? []);
    const attachedNeumes = attachedNeumeIds.flatMap((neumeId) => {
      const neume = neumeById[neumeId];
      return neume === undefined ? [] : [neume];
    });
    const firstNeume = attachedNeumes[0];
    const anchor = anchorForTextSpan(textSpanId, index, textSpanIds, explicitAnchors);
    const span = document.text.spans[textSpanId];
    const firstSyllable = span?.syllableIds[0] === undefined ? undefined : document.text.syllables[span.syllableIds[0]];
    const text = getHyphenatedTextForSpan(document, textSpanId);
    const textWidth = measureText(text);
    const relation = textSpanRelations[textSpanId] ?? anchor.relation;
    const hasMelisma = attachedNeumes.length > 0
      && (relation === "melisma" || attachedNeumes.length > 1 || (firstNeume?.noteEventIds.length ?? 0) > 1);
    const anchorX = anchor.x;
    const suffix = layoutIdSuffix(systemId);
    const syllableId = `ls_${safeId(textSpanId)}${suffix}`;
    const lyricRunId = `txt_${safeId(textSpanId)}${suffix}`;
    const syllable: LayoutSyllable = {
      id: syllableId,
      semanticTextSpanId: textSpanId,
      systemId,
      wordId: firstSyllable?.wordId,
      lyricRunId,
      attachedNeumeIds,
      bounds: {
        x: anchorX - (textWidth / 2),
        y: baselineY - LYRIC_TEXT_SIZE,
        width: textWidth,
        height: LYRIC_TEXT_SIZE,
      },
      baselineY,
      anchorPolicy: attachedNeumes.length === 0 ? "editorial" : hasMelisma ? "firstPrincipalNote" : "vowelCentre",
      anchorX,
      melismaExtent: hasMelisma ? { startX: anchor.spanStart, endX: anchor.spanEnd } : undefined,
      continuation: {
        softHyphenBefore: false,
        softHyphenAfter: false,
        lineBreakWithinWord: false,
        elision: firstSyllable?.role === "elision",
      },
    };

    addIndex(textSpanToSyllableIds, textSpanId, syllable.id);
    addIndex(semanticToLayoutIds, textSpanId, syllable.id);
    return syllable;
  }).sort((left, right) => left.anchorX - right.anchorX || left.id.localeCompare(right.id));
}

function layoutTextSpanOrderForSystem(
  document: ChantDocument,
  textSpanAnchors: Record<Id, LayoutTextSpanAnchor[]>,
  textSpanToNeumeIds: Record<Id, Id[]>,
): Id[] {
  const globalTextSpanIds = chantTextSpanOrder(document);
  const anchoredTextSpanIds = Object.keys({
    ...textSpanToNeumeIds,
    ...textSpanAnchors,
  }).filter((textSpanId) => document.text.spans[textSpanId] !== undefined);

  if (anchoredTextSpanIds.length === 0) {
    return globalTextSpanIds;
  }

  const anchoredIndexes = anchoredTextSpanIds
    .map((textSpanId) => globalTextSpanIds.indexOf(textSpanId))
    .filter((index) => index >= 0);
  const systemTextSpanIds = new Set<Id>(anchoredTextSpanIds);

  if (anchoredIndexes.length > 0) {
    const first = Math.min(...anchoredIndexes);
    const last = Math.max(...anchoredIndexes);

    for (const textSpanId of globalTextSpanIds.slice(first, last + 1)) {
      systemTextSpanIds.add(textSpanId);
    }
  }

  return unique([
    ...globalTextSpanIds.filter((textSpanId) => systemTextSpanIds.has(textSpanId)),
    ...anchoredTextSpanIds.filter((textSpanId) => !globalTextSpanIds.includes(textSpanId)),
  ]);
}

function layoutTextSpanOrder(
  document: ChantDocument,
  textSpanAnchors: Record<Id, LayoutTextSpanAnchor[]>,
  textSpanToNeumeIds: Record<Id, Id[]>,
): Id[] {
  const orderedChantTextSpanIds = chantTextSpanOrder(document);
  const anchoredTextSpanIds = Object.keys({
    ...textSpanToNeumeIds,
    ...textSpanAnchors,
  }).filter((textSpanId) => document.text.spans[textSpanId] !== undefined);

  return unique([...orderedChantTextSpanIds, ...anchoredTextSpanIds]);
}

function chantTextSpanOrder(document: ChantDocument): Id[] {
  return document.text.blocks
    .filter((block) => block.kind === "chantText")
    .flatMap((block) => block.orderedSpanIds)
    .filter((textSpanId) => document.text.spans[textSpanId] !== undefined && getHyphenatedTextForSpan(document, textSpanId) !== "");
}

function explicitTextSpanAnchor(anchors: LayoutTextSpanAnchor[] | undefined): LayoutTextSpanAnchor | undefined {
  if (anchors === undefined || anchors.length === 0) {
    return undefined;
  }

  return {
    x: anchors[0].x,
    spanStart: Math.min(...anchors.map((anchor) => anchor.spanStart)),
    spanEnd: Math.max(...anchors.map((anchor) => anchor.spanEnd)),
    relation: anchors[0].relation,
  };
}

function anchorForTextSpan(
  textSpanId: Id,
  index: number,
  textSpanIds: Id[],
  explicitAnchors: Record<Id, LayoutTextSpanAnchor>,
): LayoutTextSpanAnchor {
  const explicitAnchor = explicitAnchors[textSpanId];
  if (explicitAnchor !== undefined) {
    return explicitAnchor;
  }

  const previousIndex = findAnchoredTextSpanIndex(textSpanIds, explicitAnchors, index, -1);
  const nextIndex = findAnchoredTextSpanIndex(textSpanIds, explicitAnchors, index, 1);
  const previousAnchor = previousIndex === undefined ? undefined : explicitAnchors[textSpanIds[previousIndex]];
  const nextAnchor = nextIndex === undefined ? undefined : explicitAnchors[textSpanIds[nextIndex]];
  let x: number;

  if (previousAnchor !== undefined && nextAnchor !== undefined && previousIndex !== undefined && nextIndex !== undefined) {
    x = previousAnchor.x + ((nextAnchor.x - previousAnchor.x) * ((index - previousIndex) / (nextIndex - previousIndex)));
  } else if (previousAnchor !== undefined && previousIndex !== undefined) {
    x = previousAnchor.x + ((index - previousIndex) * TEXT_ONLY_GAP);
  } else if (nextAnchor !== undefined && nextIndex !== undefined) {
    x = nextAnchor.x - ((nextIndex - index) * TEXT_ONLY_GAP);
  } else {
    x = STAFF_LEFT + 2.4 + (index * TEXT_ONLY_GAP);
  }

  return {
    x,
    spanStart: x,
    spanEnd: x,
    relation: "editorialAssociation",
  };
}

function findAnchoredTextSpanIndex(
  textSpanIds: Id[],
  explicitAnchors: Record<Id, LayoutTextSpanAnchor>,
  fromIndex: number,
  direction: -1 | 1,
): number | undefined {
  for (let index = fromIndex + direction; index >= 0 && index < textSpanIds.length; index += direction) {
    if (explicitAnchors[textSpanIds[index]] !== undefined) {
      return index;
    }
  }

  return undefined;
}

function applyUnderlaySpacing(
  document: ChantDocument,
  voiceId: Id,
  eventId: Id,
  x: number,
  anchorOffset: number,
  previous: UnderlayPlacement | undefined,
): number {
  const placement = underlayPlacementForEvent(document, voiceId, eventId, x + anchorOffset, previous);

  if (placement === undefined || previous === undefined) {
    return x;
  }

  const requiredGap = underlayGapBetween(previous, placement);
  const extra = previous.rightX + requiredGap - placement.leftX;

  return extra > 0 ? x + extra : x;
}

function underlayPlacementForEvent(
  document: ChantDocument,
  voiceId: Id,
  eventId: Id,
  anchorX: number,
  previous?: UnderlayPlacement,
): UnderlayPlacement | undefined {
  const text = getTextForEvent(document, voiceId, eventId)
    .map((entry) => entry.link.textSpanId)
    .map((textSpanId) => underlayPlacementForTextSpan(document, textSpanId, anchorX))
    .find((placement) => placement !== undefined && placement.textSpanId !== previous?.textSpanId);

  return text;
}

function underlayPlacementForTextSpan(
  document: ChantDocument,
  textSpanId: Id,
  anchorX: number,
): UnderlayPlacement | undefined {
  const text = getHyphenatedTextForSpan(document, textSpanId);

  if (text === "") {
    return undefined;
  }

  const width = measureText(text);

  return {
    textSpanId,
    wordId: wordIdForTextSpan(document, textSpanId),
    leftX: anchorX - (width / 2),
    rightX: anchorX + (width / 2),
  };
}

function underlayGapBetween(left: UnderlayPlacement, right: UnderlayPlacement): number {
  if (left.wordId !== undefined && right.wordId !== undefined && left.wordId !== right.wordId) {
    return LYRIC_WORD_GAP;
  }

  return LYRIC_MIN_GAP;
}

function wordIdForTextSpan(document: ChantDocument, textSpanId: Id): Id | undefined {
  const span = document.text.spans[textSpanId];
  const firstSyllableId = span?.syllableIds[0];

  return firstSyllableId === undefined ? undefined : document.text.syllables[firstSyllableId]?.wordId;
}

function lyricBaselineForNeumes(neumes: LayoutNeume[], lineYs = defaultLineYs()): number {
  const defaultBaseline = defaultLyricBaseline(lineYs);

  if (neumes.length === 0) {
    return defaultBaseline;
  }

  const lowestNeumeBottom = Math.max(...neumes.map((neume) => neume.rect.y + neume.rect.height));
  return Math.max(defaultBaseline, lowestNeumeBottom + LYRIC_TEXT_SIZE + LYRIC_NEUME_CLEARANCE);
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
      id: `txt_hyphen_${safeId(left.semanticTextSpanId)}_${safeId(right.semanticTextSpanId)}${layoutIdSuffix(systemId)}`,
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
      height: LYRIC_TEXT_SIZE,
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
  const availableGap = right.bounds.x - (left.bounds.x + left.bounds.width);

  return leftLastIndex >= 0
    && rightFirstIndex === leftLastIndex + 1
    && availableGap >= LYRIC_HYPHEN_MIN_GAP;
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

function makeClefGlyph(id: Id, semanticId: Id, systemId: Id, staffId: Id, x: number, clef?: ClefDef, lineYs = defaultLineYs()): LayoutGlyph {
  const line = clef?.line ?? 3;
  const staffLine = Math.min(4, Math.max(1, line));
  const lineY = lineYs[4 - staffLine] ?? lineYs[0] ?? STAFF_TOP;
  const defKey = clef?.shape === "f" ? "clefF" : "clefC";
  const glyphSize = glyphSizeForDef(defKey);
  return makeGlyph({
    id,
    semanticId,
    systemId,
    staffId,
    defKey,
    kind: "clef",
    x,
    y: lineY - (glyphSize.height / 2),
    width: glyphSize.width,
    height: glyphSize.height,
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
    exsurgeGlyphDef("punctum", 100, 123.43799591064453),
    exsurgeGlyphDef("quilisma", 100, 150),
    exsurgeGlyphDef("inclinatum", 100, 150.77999877929688),
    exsurgeGlyphDef("liquescentAscending", 100, 152.343994140625),
    exsurgeGlyphDef("liquescentDescending", 100, 151.56199645996094),
    exsurgeGlyphDef("oriscusAscending", 100, 147.656005859375),
    exsurgeGlyphDef("oriscusDescending", 100, 147.656005859375),
    exsurgeGlyphDef("virgaLong", 100, 326.56201171875),
    exsurgeGlyphDef("virgaShort", 100, 253.12600708007812),
    exsurgeGlyphDef("apostropha", 97.65699768066406, 151.56201171875),
    exsurgeGlyphDef("podatusLower", 100, 103.12399291992188),
    exsurgeGlyphDef("podatusUpper", 91.406005859375, 125.78099822998047),
    exsurgeGlyphDef("porrectus1", 302.343994140625, 215.6269989013672),
    exsurgeGlyphDef("porrectus2", 377.3429870605469, 328.1260070800781),
    exsurgeGlyphDef("porrectus3", 377.343994140625, 427.3450012207031),
    exsurgeGlyphDef("porrectus4", 420, 525.780029296875),
    exsurgeGlyphDef("mora", 48, 48),
    exsurgeGlyphDef("verticalEpisemaAbove", 16, 80),
    exsurgeGlyphDef("verticalEpisemaBelow", 16, 80),
    exsurgeGlyphDef("flat", 97.91699981689453, 267.968994140625),
    exsurgeGlyphDef("natural", 70.31100463867188, 330.468994140625),
    exsurgeGlyphDef("custosLong", 46.35300064086914, 339.5820007324219),
    exsurgeGlyphDef("custosShort", 43.75, 270.052001953125),
    exsurgeGlyphDef("custosDescLong", 46.35300064086914, 339.58197021484375),
    exsurgeGlyphDef("custosDescShort", 43.75, 270.0530090332031),
    exsurgeGlyphDef("clefC", 100, 331.2510070800781),
    exsurgeGlyphDef("clefF", 193.75201416015625, 333.5950012207031),
    glyphDef("barQuarter", LINE_THICKNESS, STAFF_LINE_INTERVAL),
    glyphDef("barHalf", LINE_THICKNESS, STAFF_LINE_INTERVAL * 2),
    glyphDef("barFull", LINE_THICKNESS, STAFF_HEIGHT),
    glyphDef("barDouble", STAFF_STEP_INTERVAL, STAFF_HEIGHT),
    glyphDef("barFinal", STAFF_STEP_INTERVAL, STAFF_HEIGHT),
  ];
}

function defaultLineYs(): number[] {
  return [0, 1, 2, 3].map((offset) => STAFF_TOP + (offset * STAFF_LINE_INTERVAL));
}

function defaultLyricBaseline(lineYs = defaultLineYs()): number {
  return (lineYs[0] ?? STAFF_TOP) + STAFF_HEIGHT + LYRIC_BASELINE_BELOW_STAFF;
}

function exsurgeGlyphDef(key: Id, width: number, height: number): LayoutGlyphDef {
  const size = exsurgeGlyphSize(width, height);
  return glyphDef(key, size.width, size.height);
}

function exsurgeGlyphSize(width: number, height: number): Pick<Rect, "width" | "height"> {
  return {
    width: width / EXSURGE_PUNCTUM_WIDTH,
    height: height / EXSURGE_PUNCTUM_WIDTH,
  };
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

function clivisUpperDefKey(upper: LayoutNoteInput): Id {
  return upper.sign === "oriscus" ? "oriscusDescending" : noteDefKey(upper.sign);
}

function podatusLowerDefKey(lower: LayoutNoteInput): Id {
  return lower.sign === "punctum" ? "podatusLower" : noteDefKey(lower.sign);
}

function podatusUpperDefKey(upper: LayoutNoteInput): Id {
  if (upper.sign === "liquescentAscending") {
    return "liquescentAscending";
  }

  if (upper.sign === "liquescentDescending") {
    return "liquescentDescending";
  }

  return upper.sign === "punctum" ? "podatusUpper" : noteDefKey(upper.sign);
}

function isPodatusNeume(
  neumeGroup: NeumeGroup,
  notes: LayoutNoteInput[],
  clef: ClefDef | undefined,
): boolean {
  if (notes.length !== 2 || clef === undefined) {
    return false;
  }

  const glyphHint = neumeGroup.notationHints.find((hint) => hint.key === "glyph")?.value;
  const explicitPodatus = neumeGroup.neumeKind === "podatus" || glyphHint === "podatus";
  const firstStep = getStaffPosition(notes[0].pitch, clef, 4).staffStep;
  const secondStep = getStaffPosition(notes[1].pitch, clef, 4).staffStep;
  const ascendsVisually = secondStep < firstStep;

  return explicitPodatus || (ascendsVisually && notes.every((note) => note.sign !== "inclinatum"));
}

function isClivisNeume(
  neumeGroup: NeumeGroup,
  notes: LayoutNoteInput[],
  clef: ClefDef | undefined,
): boolean {
  if (notes.length !== 2 || clef === undefined) {
    return false;
  }

  const glyphHint = neumeGroup.notationHints.find((hint) => hint.key === "glyph")?.value;
  const explicitClivis = neumeGroup.neumeKind === "clivis" || glyphHint === "clivis";
  const firstStep = getStaffPosition(notes[0].pitch, clef, 4).staffStep;
  const secondStep = getStaffPosition(notes[1].pitch, clef, 4).staffStep;
  const descendsVisually = secondStep > firstStep;

  return explicitClivis || (descendsVisually && notes.every((note) => note.sign !== "inclinatum"));
}

function isTorculusNeume(
  neumeGroup: NeumeGroup,
  notes: LayoutNoteInput[],
  clef: ClefDef | undefined,
): boolean {
  if (notes.length !== 3 || clef === undefined) {
    return false;
  }

  const glyphHint = neumeGroup.notationHints.find((hint) => hint.key === "glyph")?.value;
  const explicitTorculus = neumeGroup.neumeKind === "torculus" || glyphHint === "torculus";
  const firstStep = getStaffPosition(notes[0].pitch, clef, 4).staffStep;
  const secondStep = getStaffPosition(notes[1].pitch, clef, 4).staffStep;
  const thirdStep = getStaffPosition(notes[2].pitch, clef, 4).staffStep;
  const risesThenFalls = secondStep < firstStep && thirdStep > secondStep;

  return explicitTorculus || (risesThenFalls && notes.every((note) => note.sign !== "inclinatum"));
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

  return neumeGroup.neumeKind === "porrectus"
    || glyphHint === "porrectus"
    || glyphHint === "porrectus1"
    || glyphHint === "porrectus2"
    || glyphHint === "porrectus3"
    || glyphHint === "porrectus4";
}

function porrectusEndingDefKey(third: LayoutNoteInput): Id {
  if (third.sign === "liquescentAscending") {
    return "liquescentAscending";
  }

  if (third.sign === "liquescentDescending") {
    return "liquescentDescending";
  }

  return "podatusUpper";
}

function porrectusEndingOverlap(swashDefKey: Id, endingDefKey: Id): number {
  return PORRECTUS_ENDING_OVERLAPS[swashDefKey] ?? NOTE_WIDTH;
}

function porrectusSecondToThirdIntervalSteps(
  second: LayoutNoteInput,
  third: LayoutNoteInput,
  clef: ClefDef | undefined,
): number {
  if (clef === undefined) {
    return 0;
  }

  const secondStaffStep = getStaffPosition(second.pitch, clef, 4).staffStep;
  const thirdStaffStep = getStaffPosition(third.pitch, clef, 4).staffStep;
  return Math.abs(secondStaffStep - thirdStaffStep);
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

function torculusAdvanceWidth(noteCount: number): number {
  if (noteCount <= 1) {
    return NOTE_WIDTH;
  }

  if (noteCount === 2) {
    return TORCULUS_SECOND_NOTE_X_OFFSET + NOTE_WIDTH;
  }

  return TORCULUS_THIRD_NOTE_X_OFFSET + NOTE_WIDTH + ((noteCount - 3) * NOTE_GAP);
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

function barY(defKey: Id, lineYs = defaultLineYs()): number {
  const staffTop = lineYs[0] ?? STAFF_TOP;
  switch (defKey) {
    case "barQuarter":
      return staffTop - STAFF_STEP_INTERVAL;
    case "barHalf":
      return staffTop + STAFF_STEP_INTERVAL;
    default:
      return staffTop;
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

function cloneIndex<T>(index: Record<Id, T[]>): Record<Id, T[]> {
  return Object.fromEntries(
    Object.entries(index).map(([id, values]) => [id, [...values]]),
  );
}

function cloneAnchorIndex(index: Record<Id, LayoutTextSpanAnchor[]>): Record<Id, LayoutTextSpanAnchor[]> {
  return Object.fromEntries(
    Object.entries(index).map(([id, anchors]) => [id, anchors.map((anchor) => ({ ...anchor }))]),
  );
}

function mergeIndexes<T>(left: Record<Id, T[]>, right: Record<Id, T[]>): Record<Id, T[]> {
  const merged = cloneIndex(left);

  for (const [id, values] of Object.entries(right)) {
    const existing = merged[id] ?? [];
    for (const value of values) {
      if (!existing.includes(value)) {
        existing.push(value);
      }
    }
    merged[id] = existing;
  }

  return merged;
}

function addTextSpanAnchor(context: LayoutContext, textSpanId: Id, anchor: LayoutTextSpanAnchor): void {
  const anchors = context.textSpanAnchors[textSpanId] ?? [];
  anchors.push(anchor);
  context.textSpanAnchors[textSpanId] = anchors;
  context.textSpanRelations[textSpanId] = anchor.relation;
}

function layoutIdSuffix(systemId: Id): string {
  return systemId === "sys_1" ? "" : `_${safeId(systemId)}`;
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
  return Math.max(LYRIC_TEXT_SIZE * 0.8, text.length * LYRIC_TEXT_WIDTH_PER_CHARACTER * LYRIC_TEXT_SIZE);
}

function compareGlyphs(left: LayoutGlyph, right: LayoutGlyph): number {
  return left.zIndex - right.zIndex || left.x - right.x || left.y - right.y || left.id.localeCompare(right.id);
}
