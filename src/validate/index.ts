import type { AlignmentLink, MusicTarget } from "../alignment";
import type { Id, TargetRef } from "../common";
import type { ChantDocument } from "../document";
import { NeumeGroupEvent, type MusicEvent } from "../music";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

export function validateChantDocument(doc: ChantDocument): ValidationResult {
  const issues: ValidationIssue[] = [];

  validateTextPlane(doc, issues);
  validateMusicPlane(doc, issues);
  validateAlignmentPlane(doc, issues);
  validateEditorialPlane(doc, issues);
  validateLayoutPreferencePlane(doc, issues);

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}

export function assertValidChantDocument(doc: ChantDocument): void {
  const result = validateChantDocument(doc);

  if (!result.valid) {
    const summary = result.issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => `${issue.code} at ${issue.path}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid ChantDocument:\n${summary}`);
  }
}

function validateTextPlane(doc: ChantDocument, issues: ValidationIssue[]): void {
  for (const [wordId, word] of Object.entries(doc.text.words)) {
    for (const syllableId of word.syllableIds) {
      if (doc.text.syllables[syllableId] === undefined) {
        addIssue(issues, "error", "missing-word-syllable", `Word references unknown syllable '${syllableId}'.`, `text.words.${wordId}.syllableIds`);
      }
    }
  }

  for (const [syllableId, syllable] of Object.entries(doc.text.syllables)) {
    if (syllable.wordId !== undefined && doc.text.words[syllable.wordId] === undefined) {
      addIssue(issues, "error", "missing-syllable-word", `Syllable references unknown word '${syllable.wordId}'.`, `text.syllables.${syllableId}.wordId`);
    }
  }

  for (const [spanId, span] of Object.entries(doc.text.spans)) {
    for (const syllableId of span.syllableIds) {
      if (doc.text.syllables[syllableId] === undefined) {
        addIssue(issues, "error", "missing-span-syllable", `Text span references unknown syllable '${syllableId}'.`, `text.spans.${spanId}.syllableIds`);
      }
    }
  }

  for (const block of doc.text.blocks) {
    for (const spanId of block.orderedSpanIds) {
      if (doc.text.spans[spanId] === undefined) {
        addIssue(issues, "error", "missing-block-span", `Text block references unknown span '${spanId}'.`, `text.blocks.${block.id}.orderedSpanIds`);
      }
    }
  }
}

function validateMusicPlane(doc: ChantDocument, issues: ValidationIssue[]): void {
  for (const [voiceId, voice] of Object.entries(doc.music.voices)) {
    if (doc.music.staves[voice.staffId] === undefined) {
      addIssue(issues, "error", "missing-voice-staff", `Voice references unknown staff '${voice.staffId}'.`, `music.voices.${voiceId}.staffId`);
    }

    for (const eventId of voice.eventIds) {
      if (doc.music.events[eventId] === undefined) {
        addIssue(issues, "error", "missing-voice-event", `Voice references unknown event '${eventId}'.`, `music.voices.${voiceId}.eventIds`);
      }
    }
  }

  for (const [eventId, event] of Object.entries(doc.music.events)) {
    validateMusicEvent(doc, eventId, event, issues);
  }

  for (const [neumeGroupId, neumeGroup] of Object.entries(doc.music.neumeGroups)) {
    if (doc.music.voices[neumeGroup.voiceId] === undefined) {
      addIssue(issues, "error", "missing-neume-group-voice", `Neume group references unknown voice '${neumeGroup.voiceId}'.`, `music.neumeGroups.${neumeGroupId}.voiceId`);
    }

    for (const noteId of neumeGroup.noteIds) {
      if (doc.music.notes[noteId] === undefined) {
        addIssue(issues, "error", "missing-neume-group-note", `Neume group references unknown note '${noteId}'.`, `music.neumeGroups.${neumeGroupId}.noteIds`);
      }
    }
  }

  for (const [phraseId, phrase] of Object.entries(doc.music.phraseRegions)) {
    for (const voiceId of phrase.voiceIds) {
      if (doc.music.voices[voiceId] === undefined) {
        addIssue(issues, "error", "missing-phrase-voice", `Phrase region references unknown voice '${voiceId}'.`, `music.phraseRegions.${phraseId}.voiceIds`);
      }
    }

    if (doc.music.events[phrase.startEventId] === undefined) {
      addIssue(issues, "error", "missing-phrase-start", `Phrase region references unknown start event '${phrase.startEventId}'.`, `music.phraseRegions.${phraseId}.startEventId`);
    }

    if (doc.music.events[phrase.endEventId] === undefined) {
      addIssue(issues, "error", "missing-phrase-end", `Phrase region references unknown end event '${phrase.endEventId}'.`, `music.phraseRegions.${phraseId}.endEventId`);
    }
  }
}

function validateMusicEvent(doc: ChantDocument, eventId: Id, event: MusicEvent, issues: ValidationIssue[]): void {
  if (event instanceof NeumeGroupEvent && doc.music.neumeGroups[event.neumeGroupId] === undefined) {
    addIssue(issues, "error", "missing-event-neume-group", `Neume group event references unknown group '${event.neumeGroupId}'.`, `music.events.${eventId}.neumeGroupId`);
  }
}

function validateAlignmentPlane(doc: ChantDocument, issues: ValidationIssue[]): void {
  for (const [linkId, link] of Object.entries(doc.alignment.links)) {
    if (doc.text.spans[link.textSpanId] === undefined) {
      addIssue(issues, "error", "missing-alignment-text-span", `Alignment references unknown text span '${link.textSpanId}'.`, `alignment.links.${linkId}.textSpanId`);
    }

    for (const target of link.musicTargets) {
      validateMusicTarget(doc, linkId, target, issues);
    }

    if (link.musicTargets.length === 0) {
      addIssue(issues, "warning", "empty-alignment-targets", "Alignment has no music targets.", `alignment.links.${linkId}.musicTargets`);
    }
  }
}

function validateMusicTarget(doc: ChantDocument, linkId: Id, target: MusicTarget, issues: ValidationIssue[]): void {
  const voice = doc.music.voices[target.voiceId];

  if (voice === undefined) {
    addIssue(issues, "error", "missing-target-voice", `Music target references unknown voice '${target.voiceId}'.`, `alignment.links.${linkId}.musicTargets`);
    return;
  }

  if (doc.music.events[target.fromEventId] === undefined) {
    addIssue(issues, "error", "missing-target-start-event", `Music target references unknown start event '${target.fromEventId}'.`, `alignment.links.${linkId}.musicTargets`);
  }

  if (!voice.eventIds.includes(target.fromEventId)) {
    addIssue(issues, "error", "target-start-not-in-voice", `Start event '${target.fromEventId}' is not ordered in voice '${target.voiceId}'.`, `alignment.links.${linkId}.musicTargets`);
  }

  if (target.toEventId !== undefined) {
    if (doc.music.events[target.toEventId] === undefined) {
      addIssue(issues, "error", "missing-target-end-event", `Music target references unknown end event '${target.toEventId}'.`, `alignment.links.${linkId}.musicTargets`);
    }

    if (!voice.eventIds.includes(target.toEventId)) {
      addIssue(issues, "error", "target-end-not-in-voice", `End event '${target.toEventId}' is not ordered in voice '${target.voiceId}'.`, `alignment.links.${linkId}.musicTargets`);
    }

    if (voice.eventIds.indexOf(target.toEventId) < voice.eventIds.indexOf(target.fromEventId)) {
      addIssue(issues, "error", "target-range-reversed", `Music target end event '${target.toEventId}' occurs before start event '${target.fromEventId}'.`, `alignment.links.${linkId}.musicTargets`);
    }
  }
}

function validateEditorialPlane(doc: ChantDocument, issues: ValidationIssue[]): void {
  for (const [annotationId, annotation] of Object.entries(doc.editorial.annotations)) {
    validateTargetRefs(doc, annotation.targets, `editorial.annotations.${annotationId}.targets`, issues);
  }

  for (const [variantId, variant] of Object.entries(doc.editorial.variants)) {
    validateTargetRefs(doc, variant.targets, `editorial.variants.${variantId}.targets`, issues);

    if (!variant.readings.some((reading) => reading.id === variant.defaultReadingId)) {
      addIssue(issues, "error", "missing-default-reading", `Variant default reading '${variant.defaultReadingId}' is not present in readings.`, `editorial.variants.${variantId}.defaultReadingId`);
    }

    for (const reading of variant.readings) {
      for (const spanId of reading.replacementTextSpanIds) {
        if (doc.text.spans[spanId] === undefined) {
          addIssue(issues, "error", "missing-reading-text-span", `Variant reading references unknown text span '${spanId}'.`, `editorial.variants.${variantId}.readings.${reading.id}.replacementTextSpanIds`);
        }
      }
    }
  }

  for (const [groupId, group] of Object.entries(doc.editorial.userGroups)) {
    validateTargetRefs(doc, group.targets, `editorial.userGroups.${groupId}.targets`, issues);
  }
}

function validateLayoutPreferencePlane(doc: ChantDocument, issues: ValidationIssue[]): void {
  for (const pref of doc.layoutPrefs.breakPrefs) {
    validateTargetRefs(doc, pref.targets, `layoutPrefs.breakPrefs.${pref.id}.targets`, issues);
  }

  for (const pref of doc.layoutPrefs.spacingPrefs) {
    validateTargetRefs(doc, pref.targets, `layoutPrefs.spacingPrefs.${pref.id}.targets`, issues);
  }

  for (const pref of doc.layoutPrefs.visibilityPrefs) {
    validateTargetRefs(doc, pref.targets, `layoutPrefs.visibilityPrefs.${pref.id}.targets`, issues);
  }
}

function validateTargetRefs(doc: ChantDocument, targets: TargetRef[], path: string, issues: ValidationIssue[]): void {
  for (const target of targets) {
    if (!targetExists(doc, target)) {
      addIssue(issues, "error", "missing-target-ref", `Target reference '${target.kind}:${target.id}' does not exist.`, path);
    }
  }
}

function targetExists(doc: ChantDocument, target: TargetRef): boolean {
  switch (target.kind) {
    case "syllable":
      return doc.text.syllables[target.id] !== undefined;
    case "word":
      return doc.text.words[target.id] !== undefined;
    case "textSpan":
      return doc.text.spans[target.id] !== undefined;
    case "staff":
      return doc.music.staves[target.id] !== undefined;
    case "voice":
      return doc.music.voices[target.id] !== undefined;
    case "event":
      return doc.music.events[target.id] !== undefined;
    case "neumeGroup":
      return doc.music.neumeGroups[target.id] !== undefined;
    case "note":
      return doc.music.notes[target.id] !== undefined;
    case "alignment":
      return doc.alignment.links[target.id] !== undefined;
    case "phrase":
      return doc.music.phraseRegions[target.id] !== undefined;
    case "annotation":
      return doc.editorial.annotations[target.id] !== undefined;
    case "variant":
      return doc.editorial.variants[target.id] !== undefined;
    case "layoutPreference":
      return layoutPreferenceExists(doc, target.id);
  }
}

function layoutPreferenceExists(doc: ChantDocument, id: Id): boolean {
  return doc.layoutPrefs.breakPrefs.some((pref) => pref.id === id)
    || doc.layoutPrefs.spacingPrefs.some((pref) => pref.id === id)
    || doc.layoutPrefs.visibilityPrefs.some((pref) => pref.id === id);
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  message: string,
  path: string,
): void {
  issues.push({ severity, code, message, path });
}
