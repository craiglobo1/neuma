import type { Dictionary, Id, ProvenanceInfo, RichTextBlock, RightsInfo, SourceReference } from "../common";
import { AlignmentPlane } from "../alignment";
import { EditorialPlane } from "../editorial";
import { LayoutPreferencePlane } from "../layout";
import { MusicPlane } from "../music";
import { TextPlane } from "../text";

export class DocumentMetadata {
  constructor(
    public title?: string,
    public language?: string,
    public officePart?: string,
    public occasion?: string,
    public modeLabel?: string,
    public modeModifier?: string,
    public modeDifferentia?: string,
    public commentary: RichTextBlock[] = [],
    public annotationLines: RichTextBlock[] = [],
    public sourceRefs: SourceReference[] = [],
    public rights?: RightsInfo,
    public provenance?: ProvenanceInfo,
    public custom: Record<string, unknown> = {},
  ) {}
}

export class ExternalAttachmentIndex {
  constructor(public gabcAttachmentIds: Id[] = []) {}
}

export type ChantOperationKind =
  | "insertSyllable"
  | "splitSyllable"
  | "mergeSyllables"
  | "moveSyllable"
  | "insertNeumeGroup"
  | "deleteNeumeGroup"
  | "changeNotePitch"
  | "addRhythmicSign"
  | "changeClef"
  | "insertBar"
  | "attachTextSpan"
  | "extendMelisma"
  | "splitAlignment"
  | "mergeAlignments"
  | "convertToSharedGesture"
  | "addAnnotation"
  | "addVariantSite"
  | "toggleUserGroup"
  | "preferBreakBefore"
  | "keepTogether"
  | "setVisibility";

export class ChantOperation {
  constructor(
    public id: Id,
    public kind: ChantOperationKind,
    public payload: Record<string, unknown> = {},
    public timestamp?: string,
    public actorId?: string,
  ) {}
}

export class OperationLog {
  constructor(public operations: ChantOperation[] = []) {}

  append(operation: ChantOperation): void {
    this.operations.push(operation);
  }
}

export class ChantDocument {
  constructor(
    public id: Id,
    public revision = 1,
    public metadata: DocumentMetadata = new DocumentMetadata(),
    public text: TextPlane = new TextPlane(),
    public music: MusicPlane = new MusicPlane(),
    public alignment: AlignmentPlane = new AlignmentPlane(),
    public editorial: EditorialPlane = new EditorialPlane(),
    public layoutPrefs: LayoutPreferencePlane = new LayoutPreferencePlane(),
    public attachments: ExternalAttachmentIndex = new ExternalAttachmentIndex(),
    public operationLog: OperationLog = new OperationLog(),
    public custom: Dictionary<unknown> = {},
  ) {}
}
