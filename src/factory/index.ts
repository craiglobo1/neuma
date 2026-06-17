import { AlignmentLink, AlignmentPolicy, AlignmentRelation, MusicDistribution, MusicTarget, TextDistribution } from "../alignment";
import type { Id } from "../common";
import { ChantDocument, DocumentMetadata } from "../document";
import {
  ClefDef,
  MusicEvent,
  NeumeGroup,
  NeumeGroupEvent,
  NeumeGroupingRole,
  NoteEvent,
  NoteOrnament,
  NoteSign,
  NotationHint,
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

export type NoteInput = {
  id?: Id;
  pitch: StaffPitch | number;
  sign?: NoteSign;
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

export function createEmptyChantDocument(options: CreateEmptyChantDocumentOptions = {}): ChantDocument {
  return new ChantDocument(
    options.id ?? "doc_1",
    options.revision ?? 1,
    options.metadata ?? new DocumentMetadata(),
  );
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
  const note = new NoteEvent(
    input.id ?? createNextId(doc.music.notes, "note"),
    typeof input.pitch === "number" ? new StaffPitch(input.pitch) : input.pitch,
    input.sign ?? "punctum",
    input.ornaments ?? [],
    input.rhythmicSigns ?? [],
  );

  doc.music.notes[note.id] = note;
  return note;
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
