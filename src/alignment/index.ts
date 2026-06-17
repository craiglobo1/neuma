import type { Dictionary, Id } from "../common";

export type AlignmentRelation =
  | "syllabic"
  | "melisma"
  | "sharedGesture"
  | "coSung"
  | "editorialAssociation";

export type TextDistribution = "singleSyllable" | "acrossSpan" | "elided";
export type MusicDistribution = "singleGroup" | "sequentialGroups" | "simultaneousBundle";

export class MusicTarget {
  constructor(
    public voiceId: Id,
    public fromEventId: Id,
    public toEventId?: Id,
    public bundleId?: Id,
  ) {}
}

export class AlignmentPolicy {
  constructor(
    public textDistribution: TextDistribution = "singleSyllable",
    public musicDistribution: MusicDistribution = "singleGroup",
  ) {}
}

export class AlignmentLink {
  constructor(
    public id: Id,
    public textSpanId: Id,
    public musicTargets: MusicTarget[] = [],
    public relation: AlignmentRelation = "syllabic",
    public policy: AlignmentPolicy = new AlignmentPolicy(),
  ) {}
}

export class AlignmentPlane {
  constructor(public links: Dictionary<AlignmentLink> = {}) {}
}
