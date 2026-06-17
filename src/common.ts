export type Id = string;

export type Dictionary<T> = Record<Id, T>;

export type RichTextInlineKind = "text" | "emphasis" | "strong" | "sourceRef";

export class RichTextInline {
  constructor(
    public text: string,
    public kind: RichTextInlineKind = "text",
    public refId?: Id,
  ) {}
}

export class RichTextBlock {
  constructor(
    public id: Id,
    public inlines: RichTextInline[] = [],
  ) {}
}

export class SourceReference {
  constructor(
    public id: Id,
    public label: string,
    public citation?: string,
    public uri?: string,
    public custom: Record<string, unknown> = {},
  ) {}
}

export class RightsInfo {
  constructor(
    public license?: string,
    public copyright?: string,
    public attribution?: string,
    public custom: Record<string, unknown> = {},
  ) {}
}

export class ProvenanceInfo {
  constructor(
    public createdBy?: string,
    public createdAt?: string,
    public modifiedBy?: string,
    public modifiedAt?: string,
    public sourceDescription?: string,
    public custom: Record<string, unknown> = {},
  ) {}
}

export type TargetKind =
  | "syllable"
  | "word"
  | "textSpan"
  | "staff"
  | "voice"
  | "event"
  | "neumeGroup"
  | "note"
  | "alignment"
  | "phrase"
  | "annotation"
  | "variant"
  | "layoutPreference";

export class TargetRef {
  constructor(
    public kind: TargetKind,
    public id: Id,
  ) {}
}

export class SourceSpan {
  constructor(
    public from: number,
    public to: number,
    public lineFrom: number,
    public colFrom: number,
    public lineTo: number,
    public colTo: number,
  ) {}
}

export type FidelityStatus = "exact" | "normalised" | "lossy" | "blocked";
export type FidelitySeverity = "info" | "warning" | "error";

export class FidelityItem {
  constructor(
    public severity: FidelitySeverity,
    public message: string,
    public semanticRefs: TargetRef[] = [],
    public sourceSpans: SourceSpan[] = [],
    public fallback?: string,
  ) {}
}

export class FidelityReport {
  constructor(
    public status: FidelityStatus = "exact",
    public items: FidelityItem[] = [],
  ) {}
}
