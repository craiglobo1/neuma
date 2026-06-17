import type { Id, TargetRef } from "../common";

export type BreakPreferenceKind =
  | "preferBreakBefore"
  | "forbidBreakAcross"
  | "preferKeepTogether";

export type SpacingPreferenceKind = "compact" | "expanded" | "manualGapHint";

export class BreakPreference {
  constructor(
    public id: Id,
    public kind: BreakPreferenceKind,
    public targets: TargetRef[] = [],
  ) {}
}

export class SpacingPreference {
  constructor(
    public id: Id,
    public kind: SpacingPreferenceKind,
    public targets: TargetRef[] = [],
    public amount?: number,
  ) {}
}

export class VisibilityPreference {
  constructor(
    public id: Id,
    public targets: TargetRef[] = [],
    public visible = true,
  ) {}
}

export class LayoutPreferencePlane {
  constructor(
    public breakPrefs: BreakPreference[] = [],
    public spacingPrefs: SpacingPreference[] = [],
    public visibilityPrefs: VisibilityPreference[] = [],
    public engravingProfileId?: string,
  ) {}
}
