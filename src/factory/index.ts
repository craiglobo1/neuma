import { AlignmentLink, AlignmentPolicy, AlignmentRelation, MusicDistribution, MusicTarget, TextDistribution } from "../alignment";
import type { Id } from "../common";
import { ChantDocument, DocumentMetadata } from "../document";
import {
  BarEvent,
  BarKind,
  ClefDef,
  MusicEvent,
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
  contourKindHint?: string;
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
  pitch?: StaffPitch | number;
  sign?: NoteInputSign;
  notes?: CompactNoteInput[];
  noteIdPrefix?: string;
  contourKindHint?: string;
  notationHints?: NotationHint[];
  groupingRole?: NeumeGroupingRole;
};

export type SyllabicSyllableInput = string | [text: string, notes: CompactNoteInput | CompactNoteInput[]] | {
  id?: Id;
  text: string;
  role?: TextSyllableRole;
  spanId?: Id;
  spanLabel?: string;
  elidesWithPrev?: boolean;
  elidesWithNext?: boolean;
  underlayHints?: UnderlayHint[];
  pitch?: StaffPitch | number;
  sign?: NoteInputSign;
  notes?: CompactNoteInput[];
  neumes?: SyllabicNeumeInput[];
  neumeId?: Id;
  eventId?: Id;
  noteIdPrefix?: string;
  alignmentId?: Id;
  relation?: AlignmentRelation;
  textDistribution?: TextDistribution;
  musicDistribution?: MusicDistribution;
  contourKindHint?: string;
  notationHints?: NotationHint[];
  groupingRole?: NeumeGroupingRole;
};

export type SyllabicWordInput = string | {
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
  alignment?: AlignmentLink;
};

export type CreatedSyllabicPhraseWord = CreatedWordWithSyllables & {
  syllablesWithMusic: CreatedSyllabicPhraseSyllable[];
};

export type CreatedSyllabicPhrase = {
  words: CreatedSyllabicPhraseWord[];
  neumes: CreatedNeumeGroup[];
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
  const staff = new Staff(
    options.id ?? createNextId(doc.music.staves, "staff"),
    options.lineCount ?? 4,
    options.label,
    options.defaultClef,
  );

  doc.music.staves[staff.id] = staff;
  return staff;
}

export function createVoice(doc: ChantDocument, options: CreateVoiceOptions): Voice {
  requireRef(doc.music.staves, options.staffId, "staff");

  const voice = new Voice(
    options.id ?? createNextId(doc.music.voices, "voice"),
    options.staffId,
    options.kind ?? "chant",
    [...(options.eventIds ?? [])],
    options.name,
  );

  doc.music.voices[voice.id] = voice;
  return voice;
}

export function createSyllable(doc: ChantDocument, text: string, options: CreateSyllableOptions = {}): TextSyllable {
  const syllable = new TextSyllable(
    options.id ?? createNextId(doc.text.syllables, "syl"),
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

  const spanId = options.spanId ?? createNextId(doc.text.spans, "span");
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

  const word = new TextWord(
    options.id ?? createNextId(doc.text.words, "word"),
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
  const notes = (options.notes ?? []).map((noteInput) => createNote(doc, noteInput));
  const neumeGroup = new NeumeGroup(
    options.id ?? createNextId(doc.music.neumeGroups, "ng"),
    voice.id,
    notes.map((note) => note.id),
    options.contourKindHint,
    options.notationHints ?? [],
    options.groupingRole,
  );
  const event = new NeumeGroupEvent(
    options.eventId ?? createNextId(doc.music.events, "evt"),
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
  const alignments: AlignmentLink[] = [];

  for (const wordInput of options.words) {
    const normalizedWord = normalizeSyllabicWordInput(wordInput);
    const createdWord = createWordWithSyllables(
      doc,
      normalizedWord.syllables.map((syllable) => ({
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
        id: normalizedWord.id,
        normalisedText: normalizedWord.normalisedText,
        diplomaticText: normalizedWord.diplomaticText,
        blockId: options.blockId,
        blockKind: options.blockKind,
      },
    ) as CreatedSyllabicPhraseWord;

    createdWord.syllablesWithMusic = [];

    normalizedWord.syllables.forEach((syllableInput, index) => {
      const span = createdWord.spans[index];
      const syllable = createdWord.syllables[index];
      const neumeInputs = neumesForSyllabicSyllable(syllableInput);
      const createdNeumes: CreatedNeumeGroup[] = [];
      let alignment: AlignmentLink | undefined;

      if (span !== undefined && neumeInputs.length > 0) {
        neumeInputs.forEach((neumeInput, neumeIndex) => {
          const neume = createNeumeGroup(doc, {
            id: neumeInput.id,
            eventId: neumeInput.eventId,
            voiceId: options.voiceId,
            notes: neumeInput.notes.map((note, noteIndex) => ({
              ...note,
              id: note.id ?? noteIdForNeume(syllableInput, neumeInput, neumeIndex, noteIndex, neumeInputs.length),
            })),
            contourKindHint: neumeInput.contourKindHint,
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
          id: syllableInput.alignmentId,
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

      if (span !== undefined && syllable !== undefined) {
        createdWord.syllablesWithMusic.push({
          syllable,
          span,
          neume: createdNeumes[0],
          neumes: createdNeumes,
          alignment,
        });
      }
    });

    words.push(createdWord);
  }

  return { words, neumes, alignments };
}

export function attachTextToMusic(doc: ChantDocument, options: AttachTextToMusicOptions): AlignmentLink {
  const textSpanId = options.textSpanId ?? createSpanForSyllables(doc, options.syllableIds ?? [], options.spanLabel);
  requireRef(doc.text.spans, textSpanId, "text span");

  for (const target of options.musicTargets) {
    requireRef(doc.music.voices, target.voiceId, "voice");
    requireRef(doc.music.events, target.fromEventId, "music event");
    if (target.toEventId !== undefined) {
      requireRef(doc.music.events, target.toEventId, "music event");
    }
  }

  const link = new AlignmentLink(
    options.id ?? createNextId(doc.alignment.links, "aln"),
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
  const bar = new BarEvent(
    options.id ?? createNextId(doc.music.events, "evt_bar"),
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
  const note = new NoteEvent(
    input.id ?? createNextId(doc.music.notes, "note"),
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

type NormalizedSyllabicSyllableInput = Exclude<SyllabicSyllableInput, string | [text: string, notes: CompactNoteInput | CompactNoteInput[]]>;

type NormalizedSyllabicNeumeInput = {
  id?: Id;
  eventId?: Id;
  notes: NoteInput[];
  noteIdPrefix?: string;
  contourKindHint?: string;
  notationHints?: NotationHint[];
  groupingRole?: NeumeGroupingRole;
};

type NormalizedSyllabicWordInput = {
  id?: Id;
  normalisedText?: string;
  diplomaticText?: string;
  syllables: NormalizedSyllabicSyllableInput[];
};

function normalizeSyllabicWordInput(input: SyllabicWordInput): NormalizedSyllabicWordInput {
  if (typeof input === "string") {
    return {
      normalisedText: input,
      syllables: [{ text: input }],
    };
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
    return [{
      pitch: input.pitch,
      sign: input.sign,
    }];
  }

  return [];
}

function neumesForSyllabicSyllable(input: NormalizedSyllabicSyllableInput): NormalizedSyllabicNeumeInput[] {
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
    contourKindHint: input.contourKindHint,
    notationHints: input.notationHints,
    groupingRole: input.groupingRole,
  }];
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
      notes: [{
        pitch: input.pitch,
        sign: input.sign,
      }],
      noteIdPrefix: input.noteIdPrefix,
      contourKindHint: input.contourKindHint,
      notationHints: input.notationHints,
      groupingRole: input.groupingRole,
    };
  }

  return {
    id: input.id,
    eventId: input.eventId,
    notes: input.notes?.map(normalizeCompactNoteInput) ?? [],
    noteIdPrefix: input.noteIdPrefix,
    contourKindHint: input.contourKindHint,
    notationHints: input.notationHints,
    groupingRole: input.groupingRole,
  };
}

function isSyllabicNeumeGroupObject(input: Exclude<SyllabicNeumeInput, number | StaffPitch | CompactNoteInput[]>): input is Exclude<SyllabicNeumeInput, CompactNoteInput | CompactNoteInput[]> {
  return "eventId" in input
    || "notes" in input
    || "noteIdPrefix" in input
    || "contourKindHint" in input
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
  syllableInput: NormalizedSyllabicSyllableInput,
  neumeInput: NormalizedSyllabicNeumeInput,
  neumeIndex: number,
  noteIndex: number,
  neumeCount: number,
): Id | undefined {
  const noteIdPrefix = neumeInput.noteIdPrefix ?? syllableInput.noteIdPrefix;

  if (noteIdPrefix === undefined) {
    return undefined;
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
