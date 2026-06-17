import type { Dictionary, Id } from "../common";

export type StaffLineCount = 2 | 3 | 4 | 5;
export type ClefShape = "c" | "f";
export type StaffLine = 1 | 2 | 3 | 4 | 5;
export type VoiceKind = "chant" | "organal" | "drone" | "editorial" | "other";
export type AccidentalKind = "flat" | "natural" | "sharp";
export type BarKind = "quarter" | "half" | "full" | "double" | "final";
export type PhraseStrength = "minor" | "medium" | "major";
export type SpacerReason = "sharedGestureSplit" | "editorialGap";
export type NeumeGroupingRole = "primary" | "secondary" | "ornamental" | "editorial";

export type NoteSign =
  | "punctum"
  | "virga"
  | "inclinatum"
  | "quilisma"
  | "oriscus"
  | "stropha"
  | "liquescentSmall"
  | "liquescentAscending"
  | "liquescentDescending"
  | "initioDebilis";

export type NoteOrnament =
  | "cavum"
  | "linea"
  | "accentus"
  | "circulus"
  | "semiCirculus";

export type RhythmicSign =
  | "mora"
  | "doubleMora"
  | "verticalEpisema"
  | "horizontalEpisema";

export class ClefDef {
  constructor(
    public shape: ClefShape,
    public line: StaffLine,
    public flatOnClef = false,
  ) {}
}

export class StaffPitch {
  constructor(
    public diatonicIndex: number,
    public chromaticOffset = 0,
  ) {}
}

export class Staff {
  constructor(
    public id: Id,
    public lineCount: StaffLineCount = 4,
    public label?: string,
    public defaultClef?: ClefDef,
  ) {}
}

export class Voice {
  constructor(
    public id: Id,
    public staffId: Id,
    public kind: VoiceKind = "chant",
    public eventIds: Id[] = [],
    public name?: string,
  ) {}
}

export abstract class BaseMusicEvent {
  protected constructor(
    public id: Id,
    public type: MusicEventType,
  ) {}
}

export type MusicEventType =
  | "clefChange"
  | "accidental"
  | "bar"
  | "custos"
  | "neumeGroup"
  | "semanticSpacer";

export class ClefChange extends BaseMusicEvent {
  constructor(
    id: Id,
    public clef: ClefDef,
  ) {
    super(id, "clefChange");
  }
}

export class AccidentalEvent extends BaseMusicEvent {
  constructor(
    id: Id,
    public kind: AccidentalKind,
    public pitch: StaffPitch,
    public editorial = false,
  ) {
    super(id, "accidental");
  }
}

export class BarEvent extends BaseMusicEvent {
  constructor(
    id: Id,
    public kind: BarKind,
    public phraseStrength: PhraseStrength,
  ) {
    super(id, "bar");
  }
}

export class CustosEvent extends BaseMusicEvent {
  constructor(
    id: Id,
    public generated: boolean,
    public targetPitch?: StaffPitch,
  ) {
    super(id, "custos");
  }
}

export class NeumeGroupEvent extends BaseMusicEvent {
  constructor(
    id: Id,
    public neumeGroupId: Id,
  ) {
    super(id, "neumeGroup");
  }
}

export class SpacerSemanticEvent extends BaseMusicEvent {
  constructor(
    id: Id,
    public reason: SpacerReason,
  ) {
    super(id, "semanticSpacer");
  }
}

export type MusicEvent =
  | ClefChange
  | AccidentalEvent
  | BarEvent
  | CustosEvent
  | NeumeGroupEvent
  | SpacerSemanticEvent;

export class NotationHint {
  constructor(
    public key: string,
    public value: string,
  ) {}
}

export class EditorialFlag {
  constructor(
    public kind: string,
    public note?: string,
  ) {}
}

export class NoteEvent {
  constructor(
    public id: Id,
    public pitch: StaffPitch,
    public sign: NoteSign = "punctum",
    public ornaments: NoteOrnament[] = [],
    public rhythmicSigns: RhythmicSign[] = [],
    public editorial: EditorialFlag[] = [],
  ) {}
}

export class NeumeGroup {
  constructor(
    public id: Id,
    public voiceId: Id,
    public noteIds: Id[] = [],
    public contourKindHint?: string,
    public notationHints: NotationHint[] = [],
    public groupingRole?: NeumeGroupingRole,
  ) {}
}

export class PhraseRegion {
  constructor(
    public id: Id,
    public voiceIds: Id[] = [],
    public startEventId: Id = "",
    public endEventId: Id = "",
    public label?: string,
  ) {}
}

export class MusicPlane {
  constructor(
    public staves: Dictionary<Staff> = {},
    public voices: Dictionary<Voice> = {},
    public events: Dictionary<MusicEvent> = {},
    public neumeGroups: Dictionary<NeumeGroup> = {},
    public notes: Dictionary<NoteEvent> = {},
    public phraseRegions: Dictionary<PhraseRegion> = {},
  ) {}
}
