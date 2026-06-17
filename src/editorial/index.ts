import type { Dictionary, Id, RichTextBlock, SourceReference, TargetRef } from "../common";

export type EditorialAnnotationKind = "comment" | "sourceNote" | "performanceNote" | "analysis";
export type UserGroupExportBehaviour = "ignore" | "comment" | "projectOnly";

export class EditorialAnnotation {
  constructor(
    public id: Id,
    public targets: TargetRef[] = [],
    public kind: EditorialAnnotationKind = "comment",
    public text: RichTextBlock[] = [],
  ) {}
}

export class VariantReading {
  constructor(
    public id: Id,
    public label?: string,
    public replacementTextSpanIds: Id[] = [],
    public replacementMusicTargetIds: Id[] = [],
    public sourceRefs: SourceReference[] = [],
  ) {}
}

export class VariantSite {
  constructor(
    public id: Id,
    public defaultReadingId: Id,
    public targets: TargetRef[] = [],
    public readings: VariantReading[] = [],
  ) {}
}

export class UserGroup {
  constructor(
    public id: Id,
    public label: string,
    public targets: TargetRef[] = [],
    public exportBehaviour: UserGroupExportBehaviour = "projectOnly",
  ) {}
}

export class EditorialPlane {
  constructor(
    public annotations: Dictionary<EditorialAnnotation> = {},
    public variants: Dictionary<VariantSite> = {},
    public userGroups: Dictionary<UserGroup> = {},
  ) {}
}
