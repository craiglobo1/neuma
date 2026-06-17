import type { AlignmentLink, MusicTarget } from "../alignment";
import type { Id } from "../common";
import type { ChantDocument } from "../document";
import { ClefChange, NeumeGroupEvent, type ClefDef, type MusicEvent, type NeumeGroup, type NoteEvent, type Staff, type StaffPitch, type Voice } from "../music";

export type ResolvedVoiceEvent = {
  eventId: Id;
  event: MusicEvent;
  index: number;
  voice: Voice;
  staff: Staff;
  activeClef?: ClefDef;
};

export type ResolvedNeumeGroup = {
  eventId: Id;
  event: MusicEvent;
  neumeGroup: NeumeGroup;
  notes: NoteEvent[];
};

export type StaffPosition = {
  staffStep: number;
  chromaticOffset: number;
  isOnLine: boolean;
  line?: number;
  ledgerSteps: number;
};

export type EventText = {
  link: AlignmentLink;
  syllableIds: Id[];
  text: string;
};

export function getVoice(doc: ChantDocument, voiceId: Id): Voice | undefined {
  return doc.music.voices[voiceId];
}

export function getStaffForVoice(doc: ChantDocument, voiceId: Id): Staff | undefined {
  const voice = getVoice(doc, voiceId);
  return voice === undefined ? undefined : doc.music.staves[voice.staffId];
}

export function getVoiceEvents(doc: ChantDocument, voiceId: Id): ResolvedVoiceEvent[] {
  const voice = doc.music.voices[voiceId];

  if (voice === undefined) {
    return [];
  }

  const staff = doc.music.staves[voice.staffId];

  if (staff === undefined) {
    return [];
  }

  let activeClef = staff.defaultClef;

  return voice.eventIds.flatMap((eventId, index) => {
    const event = doc.music.events[eventId];

    if (event === undefined) {
      return [];
    }

    if (event instanceof ClefChange) {
      activeClef = event.clef;
    }

    return [{ eventId, event, index, voice, staff, activeClef }];
  });
}

export function getEventRange(doc: ChantDocument, target: MusicTarget): ResolvedVoiceEvent[] {
  const events = getVoiceEvents(doc, target.voiceId);
  const startIndex = events.findIndex((entry) => entry.eventId === target.fromEventId);

  if (startIndex < 0) {
    return [];
  }

  if (target.toEventId === undefined) {
    return [events[startIndex]];
  }

  const endIndex = events.findIndex((entry) => entry.eventId === target.toEventId);

  if (endIndex < startIndex) {
    return [];
  }

  return events.slice(startIndex, endIndex + 1);
}

export function getNeumeGroupForEvent(doc: ChantDocument, eventId: Id): NeumeGroup | undefined {
  const event = doc.music.events[eventId];

  if (!(event instanceof NeumeGroupEvent)) {
    return undefined;
  }

  return doc.music.neumeGroups[event.neumeGroupId];
}

export function getNotesForNeumeGroup(doc: ChantDocument, neumeGroupId: Id): NoteEvent[] {
  const neumeGroup = doc.music.neumeGroups[neumeGroupId];

  if (neumeGroup === undefined) {
    return [];
  }

  return neumeGroup.noteIds.flatMap((noteId) => {
    const note = doc.music.notes[noteId];
    return note === undefined ? [] : [note];
  });
}

export function getResolvedNeumeGroup(doc: ChantDocument, eventId: Id): ResolvedNeumeGroup | undefined {
  const event = doc.music.events[eventId];

  if (!(event instanceof NeumeGroupEvent)) {
    return undefined;
  }

  const neumeGroup = doc.music.neumeGroups[event.neumeGroupId];

  if (neumeGroup === undefined) {
    return undefined;
  }

  return {
    eventId,
    event,
    neumeGroup,
    notes: getNotesForNeumeGroup(doc, neumeGroup.id),
  };
}

export function getAlignmentLinksForEvent(doc: ChantDocument, voiceId: Id, eventId: Id): AlignmentLink[] {
  return Object.values(doc.alignment.links).filter((link) =>
    link.musicTargets.some((target) => targetIncludesEvent(doc, target, voiceId, eventId)),
  );
}

export function getAlignmentLinksForTextSpan(doc: ChantDocument, textSpanId: Id): AlignmentLink[] {
  return Object.values(doc.alignment.links).filter((link) => link.textSpanId === textSpanId);
}

export function getTextForEvent(doc: ChantDocument, voiceId: Id, eventId: Id): EventText[] {
  return getAlignmentLinksForEvent(doc, voiceId, eventId).map((link) => {
    const span = doc.text.spans[link.textSpanId];
    const syllableIds = span?.syllableIds ?? [];

    return {
      link,
      syllableIds,
      text: syllableIds
        .map((syllableId) => doc.text.syllables[syllableId]?.text ?? "")
        .join(""),
    };
  });
}

export function getTextForSpan(doc: ChantDocument, textSpanId: Id): string {
  const span = doc.text.spans[textSpanId];

  if (span === undefined) {
    return "";
  }

  return span.syllableIds
    .map((syllableId) => doc.text.syllables[syllableId]?.text ?? "")
    .join("");
}

export function getActiveClefAtEvent(doc: ChantDocument, voiceId: Id, eventId: Id): ClefDef | undefined {
  return getVoiceEvents(doc, voiceId).find((entry) => entry.eventId === eventId)?.activeClef;
}

export function getStaffPosition(pitch: StaffPitch, clef: ClefDef, staffLineCount = 4): StaffPosition {
  const clefStep = (clef.line - 1) * 2;
  const staffStep = clefStep + pitch.diatonicIndex;
  const maxStaffStep = (staffLineCount - 1) * 2;
  const isOnLine = staffStep % 2 === 0;
  const line = isOnLine && staffStep >= 0 && staffStep <= maxStaffStep
    ? (staffStep / 2) + 1
    : undefined;
  const ledgerSteps = staffStep < 0
    ? staffStep
    : staffStep > maxStaffStep
      ? staffStep - maxStaffStep
      : 0;

  return {
    staffStep,
    chromaticOffset: pitch.chromaticOffset,
    isOnLine,
    line,
    ledgerSteps,
  };
}

function targetIncludesEvent(doc: ChantDocument, target: MusicTarget, voiceId: Id, eventId: Id): boolean {
  if (target.voiceId !== voiceId) {
    return false;
  }

  if (target.fromEventId === eventId || target.toEventId === eventId) {
    return true;
  }

  if (target.toEventId === undefined) {
    return false;
  }

  return getEventRange(doc, target).some((entry) => entry.eventId === eventId);
}
