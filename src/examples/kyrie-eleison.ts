import { MusicTarget } from "../alignment";
import type { Id } from "../common";
import { DocumentMetadata } from "../document";
import {
  attachTextToMusic,
  createEmptyChantDocument,
  createNeumeGroup,
  createStaff,
  createSyllable,
  createVoice,
} from "../operations";
import { BarEvent, ClefChange, ClefDef, StaffPitch } from "../music";

type SourceSyllable = {
  word: string;
  text: string;
  gabc?: string;
};

type SourcePhrase = {
  id: string;
  words: Record<string, string>;
  syllables: SourceSyllable[];
};

const GABC_PITCH_TRANSPOSE = -7;

export const kyrieEleisonGabc =
  "(c4) Ký(g)ri(hi)e,(ii) e(g)lé(h)i(i)son.(i) <i>ij.</i>(::) Chri(k)ste,(ij) e(h)lé(h)i(i)son.(i) <i>ij.</i>(::) Ký(g)ri(hi)e,(ii) e(g)lé(h)i(i)son.(i) (::) Ký(g)ri(hi)e,(ii) e(g)lé(hj)i(h)son.(ig/hvGFE) (::)";

export function createKyrieEleisonExampleDocument() {
  const doc = createEmptyChantDocument({
    id: "doc_kyrie_eleison_gabc",
    metadata: new DocumentMetadata(
      "Kyrie eleison",
      "grc",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [],
      [],
      [],
      undefined,
      undefined,
      {
        gabc: kyrieEleisonGabc,
        note: "HTML tags from the source GABC have been ignored.",
      },
    ),
  });
  const staff = createStaff(doc, {
    id: "staff_main",
    lineCount: 4,
    label: "Main staff",
    defaultClef: new ClefDef("c", 4),
  });
  const voice = createVoice(doc, {
    id: "voice_chant",
    staffId: staff.id,
    kind: "chant",
    name: "Chant",
  });
  const clef = new ClefChange("evt_clef", new ClefDef("c", 4));

  doc.music.events[clef.id] = clef;
  voice.eventIds.push(clef.id);

  for (const phrase of sourcePhrases) {
    addPhrase(doc, voice.id, phrase);
  }

  return doc;
}

const sourcePhrases: SourcePhrase[] = [
  {
    id: "p1",
    words: {
      kyrie: "Kyrie",
      eleison: "eleison",
      ij: "ij.",
    },
    syllables: [
      { word: "kyrie", text: "Ký", gabc: "g" },
      { word: "kyrie", text: "ri", gabc: "hi" },
      { word: "kyrie", text: "e,", gabc: "ii" },
      { word: "eleison", text: "e", gabc: "g" },
      { word: "eleison", text: "lé", gabc: "h" },
      { word: "eleison", text: "i", gabc: "i" },
      { word: "eleison", text: "son.", gabc: "i" },
      { word: "ij", text: "ij." },
    ],
  },
  {
    id: "p2",
    words: {
      christe: "Christe",
      eleison: "eleison",
      ij: "ij.",
    },
    syllables: [
      { word: "christe", text: "Chri", gabc: "k" },
      { word: "christe", text: "ste,", gabc: "ij" },
      { word: "eleison", text: "e", gabc: "h" },
      { word: "eleison", text: "lé", gabc: "h" },
      { word: "eleison", text: "i", gabc: "i" },
      { word: "eleison", text: "son.", gabc: "i" },
      { word: "ij", text: "ij." },
    ],
  },
  {
    id: "p3",
    words: {
      kyrie: "Kyrie",
      eleison: "eleison",
    },
    syllables: [
      { word: "kyrie", text: "Ký", gabc: "g" },
      { word: "kyrie", text: "ri", gabc: "hi" },
      { word: "kyrie", text: "e,", gabc: "ii" },
      { word: "eleison", text: "e", gabc: "g" },
      { word: "eleison", text: "lé", gabc: "h" },
      { word: "eleison", text: "i", gabc: "i" },
      { word: "eleison", text: "son.", gabc: "i" },
    ],
  },
  {
    id: "p4",
    words: {
      kyrie: "Kyrie",
      eleison: "eleison",
    },
    syllables: [
      { word: "kyrie", text: "Ký", gabc: "g" },
      { word: "kyrie", text: "ri", gabc: "hi" },
      { word: "kyrie", text: "e,", gabc: "ii" },
      { word: "eleison", text: "e", gabc: "g" },
      { word: "eleison", text: "lé", gabc: "hj" },
      { word: "eleison", text: "i", gabc: "h" },
      { word: "eleison", text: "son.", gabc: "ig/hvGFE" },
    ],
  },
];

export const kyrieEleisonExampleDocument = createKyrieEleisonExampleDocument();

function addPhrase(doc: ReturnType<typeof createEmptyChantDocument>, voiceId: Id, phrase: SourcePhrase): void {
  phrase.syllables.forEach((sourceSyllable, index) => {
    const syllableId = `syl_${phrase.id}_${index + 1}`;
    const spanId = `span_${phrase.id}_${index + 1}`;
    const wordId = `word_${phrase.id}_${sourceSyllable.word}`;

    createSyllable(doc, sourceSyllable.text, {
      id: syllableId,
      wordId,
      wordNormalisedText: phrase.words[sourceSyllable.word],
      spanId,
      blockId: "tb_kyrie_eleison",
      blockKind: "chantText",
    });

    if (sourceSyllable.gabc === undefined) {
      return;
    }

    const neume = createNeumeGroup(doc, {
      id: `ng_${phrase.id}_${index + 1}`,
      eventId: `evt_${phrase.id}_${index + 1}`,
      voiceId,
      notationHints: [{ key: "gabc", value: sourceSyllable.gabc }],
      notes: gabcPitches(sourceSyllable.gabc).map((pitch, noteIndex) => ({
        id: `note_${phrase.id}_${index + 1}_${noteIndex + 1}`,
        pitch,
      })),
    });

    attachTextToMusic(doc, {
      id: `aln_${phrase.id}_${index + 1}`,
      textSpanId: spanId,
      musicTargets: [new MusicTarget(voiceId, neume.event.id)],
      relation: neume.notes.length > 1 ? "melisma" : "syllabic",
      textDistribution: neume.notes.length > 1 ? "acrossSpan" : "singleSyllable",
      musicDistribution: "singleGroup",
    });
  });

  const bar = new BarEvent(`evt_${phrase.id}_bar`, "double", "major");
  const voice = doc.music.voices[voiceId];

  doc.music.events[bar.id] = bar;
  voice?.eventIds.push(bar.id);
}

function gabcPitches(gabc: string): StaffPitch[] {
  return (gabc.match(/[a-mA-M]/g) ?? []).map((pitch) => new StaffPitch(pitchToDiatonicIndex(pitch)));
}

function pitchToDiatonicIndex(pitch: string): number {
  const pitchMap: Record<string, number> = {
    a: -2,
    b: -1,
    c: 0,
    d: 1,
    e: 2,
    f: 3,
    g: 4,
    h: 5,
    i: 6,
    j: 7,
    k: 8,
    l: 9,
    m: 10,
  };

  return (pitchMap[pitch.toLowerCase()] ?? 0) + GABC_PITCH_TRANSPOSE;
}
