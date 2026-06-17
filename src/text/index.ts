import type { Dictionary, Id } from "../common";

export type TextBlockKind = "chantText" | "translation" | "annotation" | "commentary";
export type TextSyllableRole = "lyric" | "punctuation" | "elision" | "editorial";

export class UnderlayHint {
  constructor(
    public key: string,
    public value: string,
  ) {}
}

export class TextSyllable {
  constructor(
    public id: Id,
    public text: string,
    public role: TextSyllableRole = "lyric",
    public wordId?: Id,
    public elidesWithPrev = false,
    public elidesWithNext = false,
    public underlayHints: UnderlayHint[] = [],
  ) {}
}

export class TextWord {
  constructor(
    public id: Id,
    public syllableIds: Id[] = [],
    public normalisedText?: string,
    public diplomaticText?: string,
  ) {}
}

export class TextSpan {
  constructor(
    public id: Id,
    public syllableIds: Id[] = [],
    public label?: string,
  ) {}
}

export class TextBlock {
  constructor(
    public id: Id,
    public kind: TextBlockKind = "chantText",
    public orderedSpanIds: Id[] = [],
  ) {}
}

export class TextPlane {
  constructor(
    public blocks: TextBlock[] = [],
    public syllables: Dictionary<TextSyllable> = {},
    public words: Dictionary<TextWord> = {},
    public spans: Dictionary<TextSpan> = {},
  ) {}
}
