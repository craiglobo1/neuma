import { AlignmentLink, AlignmentPolicy, MusicTarget } from "../alignment";
import { ChantDocument, DocumentMetadata } from "../document";
import { BarEvent, ClefChange, ClefDef, MusicPlane, NeumeGroup, NeumeGroupEvent, NoteEvent, Staff, StaffPitch, Voice } from "../music";
import { TextBlock, TextPlane, TextSpan, TextSyllable, TextWord } from "../text";

export const kyrieExampleDocument = new ChantDocument(
  "doc_kyrie",
  1,
  new DocumentMetadata("Kyrie", "la", undefined, undefined, "VIII"),
  new TextPlane(
    [new TextBlock("tb_kyrie", "chantText", ["span_ky", "span_rie"])],
    {
      syl_ky: new TextSyllable("syl_ky", "Ky", "lyric", "word_kyrie"),
      syl_ri: new TextSyllable("syl_ri", "ri", "lyric", "word_kyrie"),
      syl_e: new TextSyllable("syl_e", "e", "lyric", "word_kyrie"),
    },
    {
      word_kyrie: new TextWord("word_kyrie", ["syl_ky", "syl_ri", "syl_e"], "Kyrie"),
    },
    {
      span_ky: new TextSpan("span_ky", ["syl_ky"]),
      span_rie: new TextSpan("span_rie", ["syl_ri", "syl_e"]),
    },
  ),
  new MusicPlane(
    {
      staff_main: new Staff("staff_main", 4, "Main staff", new ClefDef("c", 4)),
    },
    {
      voice_chant: new Voice(
        "voice_chant",
        "staff_main",
        "chant",
        ["evt_clef", "evt_ng_ky", "evt_ng_rie", "evt_bar"],
        "Chant",
      ),
    },
    {
      evt_clef: new ClefChange("evt_clef", new ClefDef("c", 4)),
      evt_ng_ky: new NeumeGroupEvent("evt_ng_ky", "ng_ky"),
      evt_ng_rie: new NeumeGroupEvent("evt_ng_rie", "ng_rie"),
      evt_bar: new BarEvent("evt_bar", "full", "major"),
    },
    {
      ng_ky: new NeumeGroup("ng_ky", "voice_chant", ["note_ky_1", "note_ky_2"]),
      ng_rie: new NeumeGroup("ng_rie", "voice_chant", ["note_rie_1", "note_rie_2", "note_rie_3"]),
    },
    {
      note_ky_1: new NoteEvent("note_ky_1", new StaffPitch(0), "punctum"),
      note_ky_2: new NoteEvent("note_ky_2", new StaffPitch(1), "punctum"),
      note_rie_1: new NoteEvent("note_rie_1", new StaffPitch(1), "punctum"),
      note_rie_2: new NoteEvent("note_rie_2", new StaffPitch(0), "punctum"),
      note_rie_3: new NoteEvent("note_rie_3", new StaffPitch(1), "quilisma"),
    },
  ),
);

kyrieExampleDocument.alignment.links = {
  aln_ky: new AlignmentLink(
    "aln_ky",
    "span_ky",
    [new MusicTarget("voice_chant", "evt_ng_ky")],
    "syllabic",
    new AlignmentPolicy("singleSyllable", "singleGroup"),
  ),
  aln_rie: new AlignmentLink(
    "aln_rie",
    "span_rie",
    [new MusicTarget("voice_chant", "evt_ng_rie")],
    "melisma",
    new AlignmentPolicy("acrossSpan", "singleGroup"),
  ),
};
