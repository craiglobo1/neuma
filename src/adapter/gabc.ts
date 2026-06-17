import type { Id, SourceSpan, TargetRef } from "../common";
import { FidelityReport } from "../common";

export type GabcCstNodeKind =
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
  | "comment";

export type ResidualKind =
  | "manualSpacing"
  | "manualBreak"
  | "verbatimTex"
  | "brace"
  | "comment"
  | "unsupportedPolyphony"
  | "unknownMarkup";

export type ResidualExportPolicy = "preserveIfUnchanged" | "commentOnly" | "drop";
export type ProjectionKind = "exact" | "normalised" | "derived" | "synthetic";

export class GabcToken {
  constructor(
    public id: Id,
    public kind: string,
    public span: SourceSpan,
    public raw: string,
  ) {}
}

export class SourceComment {
  constructor(
    public id: Id,
    public span: SourceSpan,
    public raw: string,
  ) {}
}

export class LineMap {
  constructor(public lineStarts: number[] = []) {}
}

export class GabcCstNode {
  constructor(
    public id: Id,
    public kind: GabcCstNodeKind,
    public span: SourceSpan,
    public childIds: Id[] = [],
    public rawText = "",
  ) {}
}

export class GabcCst {
  constructor(
    public rootId: Id,
    public nodes: Record<Id, GabcCstNode> = {},
    public tokens: GabcToken[] = [],
    public comments: SourceComment[] = [],
    public lineMap: LineMap = new LineMap(),
  ) {}
}

export class HeaderMapping {
  constructor(
    public fieldName: string,
    public nodeId: Id,
    public semanticTarget?: TargetRef,
  ) {}
}

export class ObjectSourceMapping {
  constructor(
    public semanticRef: TargetRef,
    public sourceNodeIds: Id[] = [],
    public projectionKind: ProjectionKind = "exact",
  ) {}
}

export class ResidualFragment {
  constructor(
    public id: Id,
    public nodeIds: Id[] = [],
    public kind: ResidualKind = "comment",
    public exportPolicy: ResidualExportPolicy = "preserveIfUnchanged",
  ) {}
}

export class GabcProjection {
  constructor(
    public headerMappings: HeaderMapping[] = [],
    public objectMappings: ObjectSourceMapping[] = [],
    public residuals: ResidualFragment[] = [],
  ) {}
}

export class GabcAttachment {
  constructor(
    public id: Id,
    public sourceText: string,
    public cst: GabcCst,
    public projection: GabcProjection = new GabcProjection(),
    public importReport: FidelityReport = new FidelityReport(),
    public stale = false,
  ) {}
}
