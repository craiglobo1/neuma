const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  addBar,
  AlignmentLink,
  AlignmentPolicy,
  attachTextToMusic,
  BarEvent,
  ChantDocument,
  ClefDef,
  createChantDocument,
  createEmptyChantDocument,
  createNeumeGroup,
  createSyllabicPhrase,
  createStaff,
  createVoice,
  createWordWithSyllables,
  DocumentMetadata,
  kyrieEleisonExampleDocument,
  kyrieExampleDocument,
  layoutChant,
  MusicPlane,
  MusicTarget,
  NeumeGroup,
  NeumeGroupEvent,
  NoteEvent,
  renderSvg,
  Staff,
  StaffPitch,
  TextBlock,
  TextPlane,
  TextSpan,
  TextSyllable,
  TextWord,
  validateChantDocument,
  Voice,
  writeSvgFile,
} = require("../dist");

function run() {
  testKyrieLayoutAndSvg();
  testKyrieEleisonFixtureTransposition();
  testCreateWordWithSyllables();
  testDottedNeumeSigns();
  testLowNeumePushesLyricBaseline();
  testSyllabicPhraseHelpers();
  testSyllabicPhraseMixedNeumeMelisma();
  testMultiNeumeMelisma();
  testWriteSvgFile();
  console.log("All tests passed.");
}

function testKyrieLayoutAndSvg() {
  const before = JSON.stringify(kyrieExampleDocument);
  const layout = layoutChant(kyrieExampleDocument, { width: 80 });
  const svg = renderSvg(layout);
  const svgAgain = renderSvg(layout);

  assert.equal(layout.schema, "neuma.layout");
  assert.equal(layout.systems.length, 1);
  assert.equal(layout.systems[0].staffs[0].lineCount, 4);
  assert.ok(layout.index.semanticToLayoutIds.note_ky_1.length > 0);
  assert.ok(layout.index.semanticToLayoutIds.ng_ky.length > 0);
  assert.ok(layout.index.semanticToLayoutIds.span_ky.length > 0);
  const glyphs = layout.systems[0].glyphs;
  const clefGlyph = glyphs.find((glyph) => glyph.id === "lg_evt_clef_clef");
  const lowerNote = glyphs.find((glyph) => glyph.id === "lg_note_ky_1");
  const upperNote = glyphs.find((glyph) => glyph.id === "lg_note_ky_2");
  assert.ok(clefGlyph);
  assert.ok(lowerNote);
  assert.ok(upperNote);
  assert.equal(clefGlyph.y, 2);
  assert.ok(upperNote.y < lowerNote.y);
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("data-semantic-id"));
  assert.ok(svg.includes('data-exsurge-glyph="PunctumCuadratum"'));
  assert.ok(svg.includes('data-exsurge-glyph="Quilisma"'));
  assert.ok(svg.includes('id="glyph-clefC"'));
  assert.ok(svg.includes('preserveAspectRatio="xMinYMid meet"'));
  assert.ok(layout.systems[0].textRuns.some((run) => run.text === "-"));
  assert.ok(svg.includes(">ri-e<"));
  assert.equal(svg, svgAgain);
  assert.equal(JSON.stringify(kyrieExampleDocument), before);
}

function testKyrieEleisonFixtureTransposition() {
  const clef = kyrieEleisonExampleDocument.music.staves.staff_main.defaultClef;
  const firstNote = kyrieEleisonExampleDocument.music.notes.note_p1_1_1;

  assert.ok(clef);
  assert.ok(firstNote);
  assert.equal(clef.line, 4);
  assert.equal(firstNote.pitch.diatonicIndex, -3);
}

function testCreateWordWithSyllables() {
  const doc = createEmptyChantDocument({ id: "doc_word_helper" });
  const created = createWordWithSyllables(
    doc,
    [
      { id: "syl_al", text: "Al", spanId: "span_al" },
      { id: "syl_le", text: "le", spanId: "span_le" },
      { id: "syl_lu", text: "lu", spanId: "span_lu" },
      { id: "syl_ia", text: "ia", spanId: "span_ia" },
    ],
    {
      id: "word_alleluia",
      normalisedText: "Alleluia",
      blockId: "tb_alleluia",
    },
  );

  assert.equal(created.word, doc.text.words.word_alleluia);
  assert.deepEqual(created.word.syllableIds, ["syl_al", "syl_le", "syl_lu", "syl_ia"]);
  assert.deepEqual(created.syllables.map((syllable) => syllable.wordId), [
    "word_alleluia",
    "word_alleluia",
    "word_alleluia",
    "word_alleluia",
  ]);
  assert.deepEqual(created.spans.map((span) => span.id), ["span_al", "span_le", "span_lu", "span_ia"]);
  assert.deepEqual(doc.text.blocks[0].orderedSpanIds, ["span_al", "span_le", "span_lu", "span_ia"]);
  assert.equal(validateChantDocument(doc).valid, true);
}

function testDottedNeumeSigns() {
  const doc = createEmptyChantDocument({ id: "doc_dotted_neumes" });
  const staff = createStaff(doc, {
    id: "staff_main",
    defaultClef: new ClefDef("c", 4),
  });
  const voice = createVoice(doc, {
    id: "voice_chant",
    staffId: staff.id,
  });
  const group = createNeumeGroup(doc, {
    id: "ng_dotted",
    eventId: "evt_ng_dotted",
    voiceId: voice.id,
    notes: [
      { id: "note_dotted", pitch: 0, sign: "dotted" },
      { id: "note_double_dotted", pitch: 1, sign: "doubleDotted" },
    ],
  });
  const layout = layoutChant(doc, { width: 80 });
  const glyphs = layout.systems[0].glyphs;
  const moraGlyphs = glyphs.filter((glyph) => glyph.kind === "mora");
  const noteGlyph = glyphs.find((glyph) => glyph.id === "lg_note_dotted");
  const firstMoraGlyph = glyphs.find((glyph) => glyph.id === "lg_note_dotted_mora");
  const svg = renderSvg(layout);

  assert.equal(group.notes[0].sign, "punctum");
  assert.deepEqual(group.notes[0].rhythmicSigns, ["mora"]);
  assert.equal(group.notes[1].sign, "punctum");
  assert.deepEqual(group.notes[1].rhythmicSigns, ["doubleMora"]);
  assert.equal(moraGlyphs.length, 3);
  assert.ok(noteGlyph);
  assert.ok(firstMoraGlyph);
  assert.equal(firstMoraGlyph.semanticId, "note_dotted");
  assert.ok(firstMoraGlyph.x > noteGlyph.x);
  assert.ok(svg.includes('href="#glyph-mora"'));
}

function testLowNeumePushesLyricBaseline() {
  const regularLayout = layoutChant(createUnderlaySpacingDocument("regular", [
    { suffix: "first", pitch: 0 },
    { suffix: "second", pitch: 1 },
  ]), { width: 80 });
  const lowLayout = layoutChant(createUnderlaySpacingDocument("low", [
    { suffix: "first", pitch: 0 },
    { suffix: "second", pitch: -8 },
  ]), { width: 80 });
  const regularFirstSyllable = regularLayout.systems[0].syllables.find((item) => item.semanticTextSpanId === "span_regular_first");
  const lowFirstSyllable = lowLayout.systems[0].syllables.find((item) => item.semanticTextSpanId === "span_low_first");
  const lowSyllable = lowLayout.systems[0].syllables.find((item) => item.semanticTextSpanId === "span_low_second");
  const lowNeume = lowLayout.systems[0].neumes.find((item) => item.semanticNeumeId === "ng_low_second");
  const lowTextRuns = lowLayout.systems[0].textRuns.filter((item) => item.semanticId?.startsWith("span_low_"));

  assert.ok(regularFirstSyllable);
  assert.ok(lowFirstSyllable);
  assert.ok(lowSyllable);
  assert.ok(lowNeume);
  assert.equal(lowTextRuns.length, 2);
  assert.ok(lowFirstSyllable.baselineY > regularFirstSyllable.baselineY);
  assert.equal(lowFirstSyllable.baselineY, lowSyllable.baselineY);
  assert.deepEqual(lowTextRuns.map((item) => item.baselineY), [lowSyllable.baselineY, lowSyllable.baselineY]);
  assert.ok(lowSyllable.bounds.y > lowNeume.rect.y + lowNeume.rect.height);
  assert.ok(lowLayout.viewport.height > regularLayout.viewport.height);
}

function testSyllabicPhraseHelpers() {
  const { doc, staff, voice } = createChantDocument({
    id: "doc_helper_salve",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });
  const phrase = createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      {
        id: "word_salve",
        normalisedText: "Salve",
        syllables: [
          ["Sal", -7],
          ["ve", -5],
        ],
      },
      {
        id: "word_regina",
        normalisedText: "Regina",
        syllables: [
          ["Re", -3],
          ["gi", -2],
          { text: "na", pitch: -3, sign: "dotted", noteIdPrefix: "note_na" },
        ],
      },
    ],
  });
  const bar = addBar(doc, { id: "evt_bar", voiceId: voice.id, kind: "full" });

  assert.equal(staff.id, "staff_main");
  assert.equal(voice.id, "voice_chant");
  assert.equal(phrase.words.length, 2);
  assert.equal(phrase.neumes.length, 5);
  assert.equal(phrase.alignments.length, 5);
  assert.deepEqual(doc.text.words.word_salve.syllableIds, ["syl_1", "syl_2"]);
  assert.deepEqual(doc.text.blocks[0].orderedSpanIds, ["span_1", "span_2", "span_3", "span_4", "span_5"]);
  assert.equal(doc.music.notes.note_na.sign, "punctum");
  assert.deepEqual(doc.music.notes.note_na.rhythmicSigns, ["mora"]);
  assert.equal(voice.eventIds.at(-1), bar.id);
  assert.equal(validateChantDocument(doc).valid, true);
}

function testSyllabicPhraseMixedNeumeMelisma() {
  const { doc, voice } = createChantDocument({
    id: "doc_helper_mixed_melisma",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });
  const phrase = createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      {
        id: "word_salve",
        normalisedText: "Salve",
        syllables: [
          {
            text: "Sal",
            spanId: "span_sal",
            neumes: [
              { id: "ng_sal_punctum", eventId: "evt_sal_punctum", pitch: -2, noteIdPrefix: "note_sal_punctum" },
              {
                id: "ng_sal_porrectus",
                eventId: "evt_sal_porrectus",
                notes: [-2, -3, -2],
                noteIdPrefix: "note_sal_porrectus",
                contourKindHint: "porrectus",
                notationHints: [{ key: "glyph", value: "porrectus" }],
              },
            ],
          },
          ["ve", -5],
        ],
      },
    ],
  });
  const layout = layoutChant(doc, { width: 80 });
  const salSyllable = layout.systems[0].syllables.find((item) => item.semanticTextSpanId === "span_sal");
  const porrectusSwash = layout.systems[0].glyphs.find((glyph) => glyph.id === "lg_note_sal_porrectus_porrectus1");
  const hiddenSecondNote = layout.systems[0].glyphs.find((glyph) => glyph.id === "lg_note_sal_porrectus_2_hidden");
  const endingNote = layout.systems[0].glyphs.find((glyph) => glyph.id === "lg_note_sal_porrectus_3");
  const svg = renderSvg(layout);

  assert.equal(phrase.neumes.length, 3);
  assert.deepEqual(phrase.words[0].syllablesWithMusic[0].neumes.map((neume) => neume.neumeGroup.id), [
    "ng_sal_punctum",
    "ng_sal_porrectus",
  ]);
  assert.equal(phrase.alignments[0].relation, "melisma");
  assert.equal(phrase.alignments[0].policy.musicDistribution, "sequentialGroups");
  assert.deepEqual(voice.eventIds.slice(0, 2), ["evt_sal_punctum", "evt_sal_porrectus"]);
  assert.deepEqual(doc.alignment.links.aln_1.musicTargets.map((target) => [target.fromEventId, target.toEventId]), [
    ["evt_sal_punctum", "evt_sal_porrectus"],
  ]);
  assert.ok(salSyllable);
  assert.deepEqual(salSyllable.attachedNeumeIds, ["ln_ng_sal_punctum", "ln_ng_sal_porrectus"]);
  assert.ok(porrectusSwash);
  assert.equal(porrectusSwash.semanticId, "note_sal_porrectus");
  assert.equal(porrectusSwash.defKey, "porrectus1");
  assert.ok(hiddenSecondNote);
  assert.equal(hiddenSecondNote.semanticId, "note_sal_porrectus_2");
  assert.equal(hiddenSecondNote.defKey, "none");
  assert.equal(hiddenSecondNote.width, 0);
  assert.ok(endingNote);
  assert.equal(endingNote.semanticId, "note_sal_porrectus_3");
  assert.equal(endingNote.defKey, "podatusUpper");
  assert.ok(endingNote.x < porrectusSwash.x + porrectusSwash.width);
  assert.ok(endingNote.x + endingNote.width > porrectusSwash.x + porrectusSwash.width);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_sal_porrectus, ["lg_note_sal_porrectus_porrectus1"]);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_sal_porrectus_2, ["lg_note_sal_porrectus_2_hidden"]);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_sal_porrectus_3, ["lg_note_sal_porrectus_3"]);
  assert.ok(svg.includes('href="#glyph-porrectus1"'));
  assert.ok(svg.includes('href="#glyph-podatusUpper"'));
  assert.equal(validateChantDocument(doc).valid, true);
}

function testMultiNeumeMelisma() {
  const doc = createMelismaDocument();
  const layout = layoutChant(doc, { width: 80 });
  const syllable = layout.systems[0].syllables.find((item) => item.semanticTextSpanId === "span_a");

  assert.ok(syllable);
  assert.deepEqual(syllable.attachedNeumeIds, ["ln_ng_a_1", "ln_ng_a_2"]);
  assert.ok(syllable.melismaExtent);
  assert.ok(syllable.melismaExtent.endX > syllable.melismaExtent.startX);
  assert.ok(renderSvg(layout).includes('data-semantic-id="span_a"'));
}

function testWriteSvgFile() {
  const layout = layoutChant(kyrieExampleDocument, { width: 80 });
  const expected = renderSvg(layout);
  const outputPath = path.join(__dirname, "output", "kyrie.svg");
  const returned = writeSvgFile(layout, outputPath);
  const actual = fs.readFileSync(outputPath, "utf8");

  assert.equal(returned, expected);
  assert.equal(actual, expected);
}

function createUnderlaySpacingDocument(documentSuffix, neumes) {
  const doc = createEmptyChantDocument({ id: `doc_underlay_spacing_${documentSuffix}` });
  const staff = createStaff(doc, {
    id: "staff_main",
    defaultClef: new ClefDef("c", 4),
  });
  const voice = createVoice(doc, {
    id: "voice_chant",
    staffId: staff.id,
  });

  neumes.forEach((neume, index) => {
    const idSuffix = `${documentSuffix}_${neume.suffix}`;
    const created = createWordWithSyllables(
      doc,
      [{ id: `syl_${idSuffix}`, text: index === 0 ? "Lo" : "rem", spanId: `span_${idSuffix}` }],
      {
        id: `word_${idSuffix}`,
        blockId: `tb_${documentSuffix}`,
      },
    );
    const group = createNeumeGroup(doc, {
      id: `ng_${idSuffix}`,
      eventId: `evt_ng_${idSuffix}`,
      voiceId: voice.id,
      notes: [{ id: `note_${idSuffix}`, pitch: neume.pitch, sign: "punctum" }],
    });

    attachTextToMusic(doc, {
      id: `aln_${idSuffix}`,
      textSpanId: created.spans[0].id,
      musicTargets: [new MusicTarget(voice.id, group.event.id)],
    });
  });

  return doc;
}

function createMelismaDocument() {
  const doc = new ChantDocument(
    "doc_melisma",
    1,
    new DocumentMetadata("Melisma", "la"),
    new TextPlane(
      [new TextBlock("tb_melisma", "chantText", ["span_a"])],
      {
        syl_a: new TextSyllable("syl_a", "A", "lyric", "word_a"),
      },
      {
        word_a: new TextWord("word_a", ["syl_a"], "A"),
      },
      {
        span_a: new TextSpan("span_a", ["syl_a"]),
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
          ["evt_ng_a_1", "evt_ng_a_2", "evt_bar"],
        ),
      },
      {
        evt_ng_a_1: new NeumeGroupEvent("evt_ng_a_1", "ng_a_1"),
        evt_ng_a_2: new NeumeGroupEvent("evt_ng_a_2", "ng_a_2"),
        evt_bar: new BarEvent("evt_bar", "full", "major"),
      },
      {
        ng_a_1: new NeumeGroup("ng_a_1", "voice_chant", ["note_a_1"]),
        ng_a_2: new NeumeGroup("ng_a_2", "voice_chant", ["note_a_2", "note_a_3"]),
      },
      {
        note_a_1: new NoteEvent("note_a_1", new StaffPitch(0), "punctum"),
        note_a_2: new NoteEvent("note_a_2", new StaffPitch(1), "punctum"),
        note_a_3: new NoteEvent("note_a_3", new StaffPitch(0), "punctum"),
      },
    ),
  );

  doc.alignment.links = {
    aln_a: new AlignmentLink(
      "aln_a",
      "span_a",
      [
        new MusicTarget("voice_chant", "evt_ng_a_1"),
        new MusicTarget("voice_chant", "evt_ng_a_2"),
      ],
      "melisma",
      new AlignmentPolicy("singleSyllable", "sequentialGroups"),
    ),
  };

  return doc;
}

run();
