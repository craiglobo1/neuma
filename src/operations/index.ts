import { AlignmentLink, AlignmentPolicy, AlignmentRelation, MusicDistribution, MusicTarget, TextDistribution } from "../alignment";
import type { Id } from "../common";
import { ChantDocument, DocumentMetadata } from "../document";
import {
  BarEvent,
  BarKind,
  ClefDef,
  MusicEvent,
  NeumeKind,
  NeumeGroup,
  NeumeGroupEvent,
  NeumeGroupingRole,
  NoteEvent,
  NoteOrnament,
  NoteSign,
  NotationHint,
  PhraseStrength,
  RhythmicSign,
  Staff,
  StaffLineCount,
  StaffPitch,
  Voice,
  VoiceKind,
} from "../music";
import { TextBlock, TextBlockKind, TextSpan, TextSyllable, TextSyllableRole, TextWord, UnderlayHint } from "../text";

export type IdFactory = (prefix: string) => Id;

export type CreateEmptyChantDocumentOptions = {
  id?: Id;
  revision?: number;
  metadata?: DocumentMetadata;
};

export type CreateStaffOptions = {
  id?: Id;
  lineCount?: StaffLineCount;
  label?: string;
  defaultClef?: ClefDef;
};

export type CreateVoiceOptions = {
  id?: Id;
  staffId: Id;
  kind?: VoiceKind;
  name?: string;
  eventIds?: Id[];
};

export type CreateChantDocumentOptions = CreateEmptyChantDocumentOptions & {
  staff?: CreateStaffOptions;
  voice?: Omit<CreateVoiceOptions, "staffId">;
};

export type CreatedChantDocument = {
  doc: ChantDocument;
  staff: Staff;
  voice: Voice;
};

export type CreateSyllableOptions = {
  id?: Id;
  role?: TextSyllableRole;
  wordId?: Id;
  wordNormalisedText?: string;
  wordDiplomaticText?: string;
  blockId?: Id;
  blockKind?: TextBlockKind;
  spanId?: Id;
  spanLabel?: string;
  elidesWithPrev?: boolean;
  elidesWithNext?: boolean;
  underlayHints?: UnderlayHint[];
};

export type WordSyllableInput = string | {
  id?: Id;
  text: string;
  role?: TextSyllableRole;
  spanId?: Id;
  spanLabel?: string;
  elidesWithPrev?: boolean;
  elidesWithNext?: boolean;
  underlayHints?: UnderlayHint[];
};

export type CreateWordWithSyllablesOptions = {
  id?: Id;
  normalisedText?: string;
  diplomaticText?: string;
  blockId?: Id;
  blockKind?: TextBlockKind;
};

export type CreatedWordWithSyllables = {
  word: TextWord;
  syllables: TextSyllable[];
  spans: TextSpan[];
};

export type NoteInputSign =
  | NoteSign
  | "dotted"
  | "doubleDotted";

export type NoteInput = {
  id?: Id;
  pitch: StaffPitch | number;
  sign?: NoteInputSign;
  ornaments?: NoteOrnament[];
  rhythmicSigns?: RhythmicSign[];
};

export type CreateNeumeGroupOptions = {
  id?: Id;
  eventId?: Id;
  voiceId: Id;
  notes?: NoteInput[];
  neumeKind?: NeumeKind;
  notationHints?: NotationHint[];
  groupingRole?: NeumeGroupingRole;
  insertAt?: number;
};

export type CreatedNeumeGroup = {
  event: NeumeGroupEvent;
  neumeGroup: NeumeGroup;
  notes: NoteEvent[];
};

export type CompactNoteInput = StaffPitch | number | NoteInput;

export type SyllabicNeumeInput = CompactNoteInput | CompactNoteInput[] | {
  id?: Id;
  eventId?: Id;
  pitch?: StaffPitch | number | CompactNoteInput[];
  sign?: NoteInputSign;
  notes?: CompactNoteInput[];
  noteIdPrefix?: string;
  neumeKind?: NeumeKind;
  notationHints?: NotationHint[];
  groupingRole?: NeumeGroupingRole;
};

export type SyllabicBarInput = true | BarKind | {
  id?: Id;
  kind?: BarKind;
  phraseStrength?: PhraseStrength;
};

export type SyllabicSyllableTupleInput = [text: string, notes: CompactNoteInput | CompactNoteInput[]];

export type SyllabicSyllableInput = string | SyllabicSyllableTupleInput | {
  id?: Id;
  text?: string;
  role?: TextSyllableRole;
  spanId?: Id;
  spanLabel?: string;
  elidesWithPrev?: boolean;
  elidesWithNext?: boolean;
  underlayHints?: UnderlayHint[];
  pitch?: StaffPitch | number | CompactNoteInput[];
  sign?: NoteInputSign;
  notes?: CompactNoteInput[];
  neumes?: SyllabicNeumeInput[];
  music?: "bar" | "none";
  bar?: SyllabicBarInput;
  kind?: BarKind;
  barKind?: BarKind;
  phraseStrength?: PhraseStrength;
  neumeId?: Id;
  eventId?: Id;
  noteIdPrefix?: string;
  alignmentId?: Id;
  relation?: AlignmentRelation;
  textDistribution?: TextDistribution;
  musicDistribution?: MusicDistribution;
  neumeKind?: NeumeKind;
  notationHints?: NotationHint[];
  groupingRole?: NeumeGroupingRole;
};

export type SyllabicWordInput = string | SyllabicSyllableTupleInput | {
  id?: Id;
  text?: string;
  normalisedText?: string;
  diplomaticText?: string;
  syllables: SyllabicSyllableInput[];
};

export type CreateSyllabicPhraseOptions = {
  voiceId: Id;
  blockId?: Id;
  blockKind?: TextBlockKind;
  words: SyllabicWordInput[];
};

export type CreatedSyllabicPhraseSyllable = {
  syllable: TextSyllable;
  span: TextSpan;
  neume?: CreatedNeumeGroup;
  neumes: CreatedNeumeGroup[];
  bar?: BarEvent;
  alignment?: AlignmentLink;
};

export type CreatedSyllabicPhraseWord = CreatedWordWithSyllables & {
  syllablesWithMusic: CreatedSyllabicPhraseSyllable[];
};

export type CreatedSyllabicPhrase = {
  words: CreatedSyllabicPhraseWord[];
  neumes: CreatedNeumeGroup[];
  bars: BarEvent[];
  alignments: AlignmentLink[];
};

export type AttachTextToMusicOptions = {
  id?: Id;
  textSpanId?: Id;
  syllableIds?: Id[];
  spanLabel?: string;
  musicTargets: MusicTarget[];
  relation?: AlignmentRelation;
  textDistribution?: TextDistribution;
  musicDistribution?: MusicDistribution;
};

export type AddBarOptions = {
  id?: Id;
  voiceId?: Id;
  kind?: BarKind;
  phraseStrength?: PhraseStrength;
  insertAt?: number;
};

export function createEmptyChantDocument(options: CreateEmptyChantDocumentOptions = {}): ChantDocument {
  return new ChantDocument(
    options.id ?? "doc_1",
    options.revision ?? 1,
    options.metadata ?? new DocumentMetadata(),
  );
}

export function createChantDocument(options: CreateChantDocumentOptions = {}): CreatedChantDocument {
  const doc = createEmptyChantDocument(options);
  const staff = createStaff(doc, {
    id: options.staff?.id ?? "staff_main",
    lineCount: options.staff?.lineCount,
    label: options.staff?.label ?? "Main staff",
    defaultClef: options.staff?.defaultClef ?? new ClefDef("c", 4),
  });
  const voice = createVoice(doc, {
    id: options.voice?.id ?? "voice_chant",
    staffId: staff.id,
    kind: options.voice?.kind ?? "chant",
    name: options.voice?.name ?? "Chant",
    eventIds: options.voice?.eventIds,
  });

  return { doc, staff, voice };
}

export function createStaff(doc: ChantDocument, options: CreateStaffOptions = {}): Staff {
  const id = options.id ?? createNextId(doc.music.staves, "staff");
  requireAvailableId(doc.music.staves, id, "staff");

  const staff = new Staff(
    id,
    options.lineCount ?? 4,
    options.label,
    options.defaultClef,
  );

  doc.music.staves[staff.id] = staff;
  return staff;
}

export function createVoice(doc: ChantDocument, options: CreateVoiceOptions): Voice {
  requireRef(doc.music.staves, options.staffId, "staff");
  const id = options.id ?? createNextId(doc.music.voices, "voice");
  requireAvailableId(doc.music.voices, id, "voice");

  const voice = new Voice(
    id,
    options.staffId,
    options.kind ?? "chant",
    [...(options.eventIds ?? [])],
    options.name,
  );

  doc.music.voices[voice.id] = voice;
  return voice;
}

export function createSyllable(doc: ChantDocument, text: string, options: CreateSyllableOptions = {}): TextSyllable {
  const id = options.id ?? createNextId(doc.text.syllables, "syl");
  const spanId = options.spanId ?? createNextId(doc.text.spans, "span");

  requireAvailableId(doc.text.syllables, id, "syllable");
  requireAvailableId(doc.text.spans, spanId, "text span");

  const syllable = new TextSyllable(
    id,
    text,
    options.role ?? "lyric",
    options.wordId,
    options.elidesWithPrev ?? false,
    options.elidesWithNext ?? false,
    options.underlayHints ?? [],
  );

  doc.text.syllables[syllable.id] = syllable;

  if (options.wordId !== undefined) {
    const word = doc.text.words[options.wordId] ?? new TextWord(
      options.wordId,
      [],
      options.wordNormalisedText,
      options.wordDiplomaticText,
    );

    if (!word.syllableIds.includes(syllable.id)) {
      word.syllableIds.push(syllable.id);
    }

    doc.text.words[word.id] = word;
  }

  doc.text.spans[spanId] = new TextSpan(spanId, [syllable.id], options.spanLabel);

  if (options.blockId !== undefined) {
    const block = getOrCreateTextBlock(doc, options.blockId, options.blockKind ?? "chantText");
    if (!block.orderedSpanIds.includes(spanId)) {
      block.orderedSpanIds.push(spanId);
    }
  }

  return syllable;
}

export function createWordWithSyllables(
  doc: ChantDocument,
  syllables: WordSyllableInput[],
  options: CreateWordWithSyllablesOptions = {},
): CreatedWordWithSyllables {
  if (syllables.length === 0) {
    throw new Error("createWordWithSyllables requires at least one syllable.");
  }

  const id = options.id ?? createNextId(doc.text.words, "word");
  requireAvailableId(doc.text.words, id, "word");

  const word = new TextWord(
    id,
    [],
    options.normalisedText,
    options.diplomaticText,
  );
  const createdSyllables: TextSyllable[] = [];
  const createdSpans: TextSpan[] = [];

  doc.text.words[word.id] = word;

  for (const input of syllables) {
    const syllableInput = normalizeWordSyllableInput(input);
    const spanId = syllableInput.spanId ?? createNextId(doc.text.spans, "span");
    const syllable = createSyllable(doc, syllableInput.text, {
      id: syllableInput.id,
      role: syllableInput.role,
      wordId: word.id,
      wordNormalisedText: word.normalisedText,
      wordDiplomaticText: word.diplomaticText,
      blockId: options.blockId,
      blockKind: options.blockKind,
      spanId,
      spanLabel: syllableInput.spanLabel,
      elidesWithPrev: syllableInput.elidesWithPrev,
      elidesWithNext: syllableInput.elidesWithNext,
      underlayHints: syllableInput.underlayHints,
    });
    const span = doc.text.spans[spanId];

    createdSyllables.push(syllable);
    if (span !== undefined) {
      createdSpans.push(span);
    }
  }

  return {
    word,
    syllables: createdSyllables,
    spans: createdSpans,
  };
}

export function createNeumeGroup(doc: ChantDocument, options: CreateNeumeGroupOptions): CreatedNeumeGroup {
  const voice = requireRef(doc.music.voices, options.voiceId, "voice");
  const neumeGroupId = options.id ?? createNextId(doc.music.neumeGroups, "ng");
  const eventId = options.eventId ?? createNextId(doc.music.events, "evt");

  requireAvailableId(doc.music.neumeGroups, neumeGroupId, "neume group");
  requireAvailableId(doc.music.events, eventId, "music event");

  const notes = (options.notes ?? []).map((noteInput) => createNote(doc, noteInput));
  const neumeGroup = new NeumeGroup(
    neumeGroupId,
    voice.id,
    notes.map((note) => note.id),
    options.neumeKind,
    options.notationHints ?? [],
    options.groupingRole,
  );
  const event = new NeumeGroupEvent(
    eventId,
    neumeGroup.id,
  );

  doc.music.neumeGroups[neumeGroup.id] = neumeGroup;
  doc.music.events[event.id] = event;
  insertEventId(voice.eventIds, event.id, options.insertAt);

  return { event, neumeGroup, notes };
}

export function createSyllabicPhrase(doc: ChantDocument, options: CreateSyllabicPhraseOptions): CreatedSyllabicPhrase {
  requireRef(doc.music.voices, options.voiceId, "voice");

  const words: CreatedSyllabicPhraseWord[] = [];
  const neumes: CreatedNeumeGroup[] = [];
  const bars: BarEvent[] = [];
  const alignments: AlignmentLink[] = [];
  const ids = createPhraseIdState();

  options.words.forEach((wordInput, wordIndex) => {
    const normalizedWord = normalizeSyllabicWordInput(wordInput);
    const wordBase = baseForSyllabicWord(normalizedWord, wordIndex);
    const wordId = normalizedWord.id ?? reservePhraseId(doc.text.words, ids.words, "word", wordBase);
    const normalizedSyllables = normalizedWord.syllables.map((syllable, index) =>
      withGeneratedSyllableIds(doc, ids, syllable, wordBase, index),
    );
    const createdWord = createWordWithSyllables(
      doc,
      normalizedSyllables.map((syllable) => ({
        id: syllable.id,
        text: syllable.text,
        role: syllable.role,
        spanId: syllable.spanId,
        spanLabel: syllable.spanLabel,
        elidesWithPrev: syllable.elidesWithPrev,
        elidesWithNext: syllable.elidesWithNext,
        underlayHints: syllable.underlayHints,
      })),
      {
        id: wordId,
        normalisedText: normalizedWord.normalisedText,
        diplomaticText: normalizedWord.diplomaticText,
        blockId: options.blockId,
        blockKind: options.blockKind,
      },
    ) as CreatedSyllabicPhraseWord;

    createdWord.syllablesWithMusic = [];

    normalizedSyllables.forEach((syllableInput, index) => {
      const span = createdWord.spans[index];
      const syllable = createdWord.syllables[index];
      const barInput = barForSyllabicSyllable(syllableInput);
      const neumeInputs = neumesForSyllabicSyllable(syllableInput);
      const createdNeumes: CreatedNeumeGroup[] = [];
      let bar: BarEvent | undefined;
      let alignment: AlignmentLink | undefined;

      if (barInput !== undefined && hasSyllabicMusicInput(syllableInput)) {
        throw new Error("createSyllabicPhrase syllables cannot create both neumes and a bar.");
      }

      if (span !== undefined && neumeInputs.length > 0) {
        neumeInputs.forEach((neumeInput, neumeIndex) => {
          const neumeBase = baseForSyllabicNeume(syllableInput, neumeInput, neumeIndex, neumeInputs.length);
          const neume = createNeumeGroup(doc, {
            id: neumeInput.id ?? reservePhraseId(doc.music.neumeGroups, ids.neumeGroups, "ng", neumeBase),
            eventId: neumeInput.eventId ?? reservePhraseId(doc.music.events, ids.events, "evt", neumeBase),
            voiceId: options.voiceId,
            notes: neumeInput.notes.map((note, noteIndex) => ({
              ...note,
              id: note.id ?? noteIdForNeume(doc, ids, syllableInput, neumeInput, neumeIndex, noteIndex, neumeInputs.length),
            })),
            neumeKind: neumeInput.neumeKind,
            notationHints: neumeInput.notationHints,
            groupingRole: neumeInput.groupingRole,
          });

          createdNeumes.push(neume);
          neumes.push(neume);
        });

        const totalNoteCount = createdNeumes.reduce((count, neume) => count + neume.notes.length, 0);
        const firstEventId = createdNeumes[0].event.id;
        const lastEventId = createdNeumes[createdNeumes.length - 1].event.id;
        alignment = attachTextToMusic(doc, {
          id: syllableInput.alignmentId ?? reservePhraseId(doc.alignment.links, ids.alignments, "aln", baseForSyllabicAlignment(syllableInput, "music")),
          textSpanId: span.id,
          musicTargets: [
            new MusicTarget(
              options.voiceId,
              firstEventId,
              createdNeumes.length > 1 ? lastEventId : undefined,
            ),
          ],
          relation: syllableInput.relation ?? (createdNeumes.length > 1 || totalNoteCount > 1 ? "melisma" : "syllabic"),
          textDistribution: syllableInput.textDistribution ?? (createdNeumes.length > 1 || totalNoteCount > 1 ? "acrossSpan" : "singleSyllable"),
          musicDistribution: syllableInput.musicDistribution ?? (createdNeumes.length > 1 ? "sequentialGroups" : "singleGroup"),
        });
        alignments.push(alignment);
      }

      if (span !== undefined && barInput !== undefined) {
        const barBase = baseForSyllabicBar(syllableInput, barInput, index);
        bar = addBar(doc, {
          id: barInput.id ?? reservePhraseId(doc.music.events, ids.events, "evt", barBase),
          voiceId: options.voiceId,
          kind: barInput.kind,
          phraseStrength: barInput.phraseStrength,
        });
        bars.push(bar);

        alignment = attachTextToMusic(doc, {
          id: syllableInput.alignmentId ?? reservePhraseId(doc.alignment.links, ids.alignments, "aln", baseForSyllabicAlignment(syllableInput, "bar")),
          textSpanId: span.id,
          musicTargets: [new MusicTarget(options.voiceId, bar.id)],
          relation: syllableInput.relation ?? "editorialAssociation",
          textDistribution: syllableInput.textDistribution ?? "singleSyllable",
          musicDistribution: syllableInput.musicDistribution ?? "singleGroup",
        });
        alignments.push(alignment);
      }

      if (span !== undefined && syllable !== undefined) {
        createdWord.syllablesWithMusic.push({
          syllable,
          span,
          neume: createdNeumes[0],
          neumes: createdNeumes,
          bar,
          alignment,
        });
      }
    });

    words.push(createdWord);
  });

  return { words, neumes, bars, alignments };
}

export function attachTextToMusic(doc: ChantDocument, options: AttachTextToMusicOptions): AlignmentLink {
  const textSpanId = options.textSpanId ?? createSpanForSyllables(doc, options.syllableIds ?? [], options.spanLabel);
  const id = options.id ?? createNextId(doc.alignment.links, "aln");

  requireRef(doc.text.spans, textSpanId, "text span");
  requireAvailableId(doc.alignment.links, id, "alignment");

  for (const target of options.musicTargets) {
    requireRef(doc.music.voices, target.voiceId, "voice");
    requireRef(doc.music.events, target.fromEventId, "music event");
    if (target.toEventId !== undefined) {
      requireRef(doc.music.events, target.toEventId, "music event");
    }
  }

  const link = new AlignmentLink(
    id,
    textSpanId,
    options.musicTargets,
    options.relation ?? "syllabic",
    new AlignmentPolicy(
      options.textDistribution ?? "singleSyllable",
      options.musicDistribution ?? "singleGroup",
    ),
  );

  doc.alignment.links[link.id] = link;
  return link;
}

export function addBar(doc: ChantDocument, options: AddBarOptions = {}): BarEvent {
  const id = options.id ?? createNextId(doc.music.events, "evt_bar");
  requireAvailableId(doc.music.events, id, "music event");

  const bar = new BarEvent(
    id,
    options.kind ?? "full",
    options.phraseStrength ?? "major",
  );

  doc.music.events[bar.id] = bar;

  if (options.voiceId !== undefined) {
    const voice = requireRef(doc.music.voices, options.voiceId, "voice");
    insertEventId(voice.eventIds, bar.id, options.insertAt);
  }

  return bar;
}

export function createNextId(collection: Record<Id, unknown>, prefix: string): Id {
  let next = Object.keys(collection).length + 1;
  let id = `${prefix}_${next}`;

  while (Object.prototype.hasOwnProperty.call(collection, id)) {
    next += 1;
    id = `${prefix}_${next}`;
  }

  return id;
}

function createNote(doc: ChantDocument, input: NoteInput): NoteEvent {
  const noteSign = normalizeNoteInputSign(input.sign);
  const id = input.id ?? createNextId(doc.music.notes, "note");

  requireAvailableId(doc.music.notes, id, "note");

  const note = new NoteEvent(
    id,
    typeof input.pitch === "number" ? new StaffPitch(input.pitch) : input.pitch,
    noteSign.sign,
    input.ornaments ?? [],
    [...noteSign.rhythmicSigns, ...(input.rhythmicSigns ?? [])],
  );

  doc.music.notes[note.id] = note;
  return note;
}

function normalizeNoteInputSign(sign: NoteInputSign | undefined): { sign: NoteSign; rhythmicSigns: RhythmicSign[] } {
  switch (sign) {
    case "dotted":
      return { sign: "punctum", rhythmicSigns: ["mora"] };
    case "doubleDotted":
      return { sign: "punctum", rhythmicSigns: ["doubleMora"] };
    default:
      return { sign: sign ?? "punctum", rhythmicSigns: [] };
  }
}

type NormalizedSyllabicSyllableInput = Exclude<SyllabicSyllableInput, string | SyllabicSyllableTupleInput>;
type GeneratedSyllabicSyllableInput = NormalizedSyllabicSyllableInput & {
  id: Id;
  spanId: Id;
  text: string;
};

type NormalizedSyllabicNeumeInput = {
  id?: Id;
  eventId?: Id;
  notes: NoteInput[];
  noteIdPrefix?: string;
  neumeKind?: NeumeKind;
  notationHints?: NotationHint[];
  groupingRole?: NeumeGroupingRole;
};

type NormalizedSyllabicBarInput = {
  id?: Id;
  kind?: BarKind;
  phraseStrength?: PhraseStrength;
};

type NormalizedSyllabicWordInput = {
  id?: Id;
  normalisedText?: string;
  diplomaticText?: string;
  syllables: NormalizedSyllabicSyllableInput[];
};

type PhraseIdState = {
  words: Set<Id>;
  syllables: Set<Id>;
  spans: Set<Id>;
  neumeGroups: Set<Id>;
  events: Set<Id>;
  notes: Set<Id>;
  alignments: Set<Id>;
};

function createPhraseIdState(): PhraseIdState {
  return {
    words: new Set(),
    syllables: new Set(),
    spans: new Set(),
    neumeGroups: new Set(),
    events: new Set(),
    notes: new Set(),
    alignments: new Set(),
  };
}

function withGeneratedSyllableIds(
  doc: ChantDocument,
  ids: PhraseIdState,
  input: NormalizedSyllabicSyllableInput,
  wordBase: string,
  index: number,
): GeneratedSyllabicSyllableInput {
  const text = textForSyllabicSyllable(input);
  const base = baseForSyllabicSyllable({ ...input, text }, wordBase, index);

  return {
    ...input,
    text,
    id: input.id ?? reservePhraseId(doc.text.syllables, ids.syllables, "syl", base),
    spanId: input.spanId ?? reservePhraseId(doc.text.spans, ids.spans, "span", base),
  };
}

function reservePhraseId(
  collection: Record<Id, unknown>,
  reserved: Set<Id>,
  prefix: string,
  base: string,
): Id {
  const cleanBase = toIdPart(base) || prefix;
  const root = cleanBase === prefix || cleanBase.startsWith(`${prefix}_`)
    ? cleanBase
    : `${prefix}_${cleanBase}`;
  let id = root;
  let suffix = 2;

  while (Object.prototype.hasOwnProperty.call(collection, id) || reserved.has(id)) {
    id = `${root}_${suffix}`;
    suffix += 1;
  }

  reserved.add(id);
  return id;
}

function baseForSyllabicWord(input: NormalizedSyllabicWordInput, index: number): string {
  const textBase = input.normalisedText
    ?? input.syllables.map(textForSyllabicSyllable).join("_");

  if (toIdPart(textBase) !== "") {
    return textBase;
  }

  const barInput = input.syllables.map(barForSyllabicSyllable).find((bar) => bar !== undefined);
  if (barInput !== undefined) {
    return baseForSyllabicBar({ text: "*" }, barInput, index);
  }

  return `word_${index + 1}`;
}

function baseForSyllabicSyllable(
  input: Pick<NormalizedSyllabicSyllableInput, "text" | "music" | "bar" | "kind" | "barKind">,
  wordBase: string,
  index: number,
): string {
  const textBase = toIdPart(input.text);

  if (textBase !== "") {
    return textBase;
  }

  const barInput = barForSyllabicSyllable({ ...input, text: input.text ?? "*" });
  if (barInput !== undefined) {
    return baseForSyllabicBar({ text: "*" }, barInput, index);
  }

  return `${wordBase}_${index + 1}`;
}

function baseForSyllabicNeume(
  syllableInput: GeneratedSyllabicSyllableInput,
  neumeInput: NormalizedSyllabicNeumeInput,
  neumeIndex: number,
  neumeCount: number,
): string {
  const syllableBase = toIdPart(syllableInput.text) || toIdPart(syllableInput.id) || `neume_${neumeIndex + 1}`;
  const neumeKind = toIdPart(neumeInput.neumeKind)
    || (neumeCount > 1 ? `neume_${neumeIndex + 1}` : "");

  return neumeKind === "" || neumeKind === syllableBase
    ? syllableBase
    : `${syllableBase}_${neumeKind}`;
}

function baseForSyllabicBar(
  syllableInput: Pick<NormalizedSyllabicSyllableInput, "text">,
  barInput: NormalizedSyllabicBarInput,
  index: number,
): string {
  const syllableBase = toIdPart(syllableInput.text);
  const kindBase = toIdPart(barInput.kind) || `bar_${index + 1}`;

  return syllableBase !== "" && syllableBase !== "bar"
    ? `bar_${syllableBase}_${kindBase}`
    : `bar_${kindBase}`;
}

function baseForSyllabicAlignment(syllableInput: GeneratedSyllabicSyllableInput, kind: "bar" | "music"): string {
  const syllableBase = toIdPart(syllableInput.text) || toIdPart(syllableInput.id);
  return kind === "bar" ? `bar_${syllableBase}` : syllableBase;
}

function textForSyllabicSyllable(input: NormalizedSyllabicSyllableInput): string {
  if (input.text !== undefined) {
    return input.text;
  }

  return barForSyllabicSyllable({ ...input, text: "*" }) !== undefined ? "*" : "";
}

function toIdPart(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeSyllabicWordInput(input: SyllabicWordInput): NormalizedSyllabicWordInput {
  if (typeof input === "string") {
    return {
      normalisedText: input,
      syllables: [{ text: input }],
    };
  }

  if (Array.isArray(input)) {
    return {
      normalisedText: input[0],
      syllables: [normalizeSyllabicSyllableInput(input)],
    };
  }

  if (!Array.isArray(input.syllables)) {
    throw new Error("createSyllabicPhrase word inputs require a syllables array.");
  }

  const normalisedText = input.normalisedText ?? input.text;
  return {
    id: input.id,
    normalisedText,
    diplomaticText: input.diplomaticText,
    syllables: input.syllables.map(normalizeSyllabicSyllableInput),
  };
}

function normalizeSyllabicSyllableInput(input: SyllabicSyllableInput): NormalizedSyllabicSyllableInput {
  if (typeof input === "string") {
    return { text: input };
  }

  if (Array.isArray(input)) {
    return {
      text: input[0],
      notes: Array.isArray(input[1]) ? input[1] : [input[1]],
    };
  }

  return input;
}

function notesForSyllabicSyllable(input: NormalizedSyllabicSyllableInput): NoteInput[] {
  if (input.notes !== undefined) {
    return input.notes.map(normalizeCompactNoteInput);
  }

  if (input.pitch !== undefined) {
    return Array.isArray(input.pitch)
      ? input.pitch.map(normalizeCompactNoteInput)
      : [{
        pitch: input.pitch,
        sign: input.sign,
      }];
  }

  return [];
}

function neumesForSyllabicSyllable(input: NormalizedSyllabicSyllableInput): NormalizedSyllabicNeumeInput[] {
  if (input.music === "none" || input.music === "bar" || input.bar !== undefined) {
    return [];
  }

  if (input.neumes !== undefined) {
    return input.neumes
      .map((neume) => normalizeSyllabicNeumeInput(neume))
      .filter((neume) => neume.notes.length > 0);
  }

  const notes = notesForSyllabicSyllable(input);
  if (notes.length === 0) {
    return [];
  }

  return [{
    id: input.neumeId,
    eventId: input.eventId,
    notes,
    noteIdPrefix: input.noteIdPrefix,
    neumeKind: input.neumeKind,
    notationHints: input.notationHints,
    groupingRole: input.groupingRole,
  }];
}

function barForSyllabicSyllable(input: NormalizedSyllabicSyllableInput): NormalizedSyllabicBarInput | undefined {
  if (input.music !== "bar" && input.bar === undefined && input.kind === undefined && input.barKind === undefined) {
    return undefined;
  }

  if (input.bar === undefined || input.bar === true) {
    return {
      id: input.eventId,
      kind: input.barKind ?? input.kind,
      phraseStrength: input.phraseStrength,
    };
  }

  if (typeof input.bar === "string") {
    return {
      id: input.eventId,
      kind: input.bar,
      phraseStrength: input.phraseStrength,
    };
  }

  return {
    id: input.bar.id ?? input.eventId,
    kind: input.bar.kind ?? input.barKind ?? input.kind,
    phraseStrength: input.bar.phraseStrength ?? input.phraseStrength,
  };
}

function hasSyllabicMusicInput(input: NormalizedSyllabicSyllableInput): boolean {
  return input.neumes !== undefined
    || input.notes !== undefined
    || input.pitch !== undefined;
}

function normalizeSyllabicNeumeInput(input: SyllabicNeumeInput): NormalizedSyllabicNeumeInput {
  if (Array.isArray(input)) {
    return {
      notes: input.map(normalizeCompactNoteInput),
    };
  }

  if (typeof input === "number" || input instanceof StaffPitch) {
    const noteInput = normalizeCompactNoteInput(input);
    return {
      notes: [noteInput],
    };
  }

  if (!isSyllabicNeumeGroupObject(input)) {
    return {
      notes: [normalizeCompactNoteInput(input)],
    };
  }

  if (input.pitch !== undefined) {
    return {
      id: input.id,
      eventId: input.eventId,
      notes: Array.isArray(input.pitch)
        ? input.pitch.map(normalizeCompactNoteInput)
        : [{
          pitch: input.pitch,
          sign: input.sign,
        }],
      noteIdPrefix: input.noteIdPrefix,
      neumeKind: input.neumeKind,
      notationHints: input.notationHints,
      groupingRole: input.groupingRole,
    };
  }

  return {
    id: input.id,
    eventId: input.eventId,
    notes: input.notes?.map(normalizeCompactNoteInput) ?? [],
    noteIdPrefix: input.noteIdPrefix,
    neumeKind: input.neumeKind,
    notationHints: input.notationHints,
    groupingRole: input.groupingRole,
  };
}

function isSyllabicNeumeGroupObject(input: Exclude<SyllabicNeumeInput, number | StaffPitch | CompactNoteInput[]>): input is Exclude<SyllabicNeumeInput, CompactNoteInput | CompactNoteInput[]> {
  return "eventId" in input
    || "notes" in input
    || "noteIdPrefix" in input
    || "neumeKind" in input
    || "notationHints" in input
    || "groupingRole" in input;
}

function normalizeCompactNoteInput(input: CompactNoteInput): NoteInput {
  if (typeof input === "number" || input instanceof StaffPitch) {
    return { pitch: input };
  }

  return input;
}

function noteIdForNeume(
  doc: ChantDocument,
  ids: PhraseIdState,
  syllableInput: GeneratedSyllabicSyllableInput,
  neumeInput: NormalizedSyllabicNeumeInput,
  neumeIndex: number,
  noteIndex: number,
  neumeCount: number,
): Id | undefined {
  const noteIdPrefix = neumeInput.noteIdPrefix ?? syllableInput.noteIdPrefix;

  if (noteIdPrefix === undefined) {
    const neumeBase = baseForSyllabicNeume(syllableInput, neumeInput, neumeIndex, neumeCount);
    const noteBase = neumeInput.notes.length === 1 || noteIndex === 0
      ? neumeBase
      : `${neumeBase}_${noteIndex + 1}`;
    return reservePhraseId(doc.music.notes, ids.notes, "note", noteBase);
  }

  if (neumeInput.noteIdPrefix !== undefined || neumeCount === 1) {
    return noteIndex === 0 ? noteIdPrefix : `${noteIdPrefix}_${noteIndex + 1}`;
  }

  const neumePrefix = `${noteIdPrefix}_${neumeIndex + 1}`;
  return noteIndex === 0 ? neumePrefix : `${neumePrefix}_${noteIndex + 1}`;
}

function normalizeWordSyllableInput(input: WordSyllableInput): Exclude<WordSyllableInput, string> {
  return typeof input === "string" ? { text: input } : input;
}

function createSpanForSyllables(doc: ChantDocument, syllableIds: Id[], label?: string): Id {
  if (syllableIds.length === 0) {
    throw new Error("attachTextToMusic requires textSpanId or at least one syllableId.");
  }

  for (const syllableId of syllableIds) {
    requireRef(doc.text.syllables, syllableId, "syllable");
  }

  const spanId = createNextId(doc.text.spans, "span");
  doc.text.spans[spanId] = new TextSpan(spanId, [...syllableIds], label);
  return spanId;
}

function getOrCreateTextBlock(doc: ChantDocument, blockId: Id, kind: TextBlockKind): TextBlock {
  const existing = doc.text.blocks.find((block) => block.id === blockId);

  if (existing !== undefined) {
    return existing;
  }

  const block = new TextBlock(blockId, kind);
  doc.text.blocks.push(block);
  return block;
}

function insertEventId(eventIds: Id[], eventId: Id, insertAt?: number): void {
  if (insertAt === undefined) {
    eventIds.push(eventId);
    return;
  }

  eventIds.splice(insertAt, 0, eventId);
}

function requireRef<T>(collection: Record<Id, T>, id: Id, label: string): T {
  const value = collection[id];

  if (value === undefined) {
    throw new Error(`Unknown ${label}: ${id}`);
  }

  return value;
}

function requireAvailableId(collection: Record<Id, unknown>, id: Id, label: string): void {
  if (Object.prototype.hasOwnProperty.call(collection, id)) {
    throw new Error(`Duplicate ${label} id: ${id}`);
  }
}
