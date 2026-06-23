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
  testMoraAvoidsStaffLine();
  testLowNeumePushesLyricBaseline();
  testWordSpacingPreventsLyricCollision();
  testMultiSystemLayoutWrapsAndConstrainsLyrics();
  testCrampedSyllablesSuppressHyphen();
  testSyllabicPhraseHelpers();
  testSyllabicPhraseCompactWordTuple();
  testSyllabicPhraseArrayPitchObject();
  testSyllabicPhraseReadableIds();
  testSyllabicPhraseBarAndTextOnly();
  testSyllabicPhraseMixedNeumeMelisma();
  testPodatusLayoutMatchesExsurge();
  testClivisLayoutMatchesExsurge();
  testTorculusLayoutMatchesExsurge();
  testPorrectusEndingVariants();
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
  assert.equal(layout.units.lyricTextSize, 1.8);
  assert.deepEqual(layout.systems[0].staffs[0].lineYs, [3, 5, 7, 9]);
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
  assert.equal(clefGlyph.y, 3 - (clefGlyph.height / 2));
  assert.equal(lowerNote.defKey, "podatusLower");
  assert.equal(upperNote.defKey, "podatusUpper");
  assert.equal(lowerNote.width, 1);
  assert.equal(lowerNote.height, 1.0312399291992187);
  assert.ok(upperNote.y < lowerNote.y);
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("data-semantic-id"));
  assert.ok(svg.includes('data-exsurge-glyph="PunctumCuadratum"'));
  assert.ok(svg.includes('data-exsurge-glyph="Quilisma"'));
  assert.ok(svg.includes('id="glyph-clefC"'));
  assert.ok(svg.includes('preserveAspectRatio="xMinYMid meet"'));
  assert.ok(svg.includes("font-size:18px"));
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

function testMoraAvoidsStaffLine() {
  const doc = createEmptyChantDocument({ id: "doc_mora_staff_line" });
  const staff = createStaff(doc, {
    id: "staff_main",
    defaultClef: new ClefDef("c", 4),
  });
  const voice = createVoice(doc, {
    id: "voice_chant",
    staffId: staff.id,
  });

  createNeumeGroup(doc, {
    id: "ng_line_mora",
    eventId: "evt_ng_line_mora",
    voiceId: voice.id,
    notes: [{ id: "note_line_mora", pitch: 0, sign: "dotted" }],
  });

  const layout = layoutChant(doc, { width: 80 });
  const noteGlyph = layout.systems[0].glyphs.find((glyph) => glyph.id === "lg_note_line_mora");
  const moraGlyph = layout.systems[0].glyphs.find((glyph) => glyph.id === "lg_note_line_mora_mora");

  assert.ok(noteGlyph);
  assert.ok(moraGlyph);
  assert.ok(moraGlyph.x - (noteGlyph.x + noteGlyph.width) > 0.3);
  assert.notEqual(moraGlyph.y + (moraGlyph.height / 2), layout.systems[0].staffs[0].lineYs[0]);
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

function testWordSpacingPreventsLyricCollision() {
  const { doc, voice } = createChantDocument({
    id: "doc_word_spacing",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });

  createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      {
        normalisedText: "mater",
        syllables: [
          ["ma", -7],
          ["ter", -6],
        ],
      },
      {
        normalisedText: "misericordiae",
        syllables: [
          ["mi", -6],
          ["se", -6],
        ],
      },
    ],
  });

  const layout = layoutChant(doc, { width: 80 });
  const textRuns = layout.systems[0].textRuns;
  const ter = textRuns.find((run) => run.text === "ter");
  const mi = textRuns.find((run) => run.text === "mi");

  assert.ok(ter);
  assert.ok(mi);
  assert.ok(textRunLeft(mi) - textRunRight(ter) >= 0.69);
}

function testMultiSystemLayoutWrapsAndConstrainsLyrics() {
  const { doc, voice } = createChantDocument({
    id: "doc_multi_system_wrap",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });

  createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      ["sal", -2],
      ["ve", -3],
      ["re", -4],
      ["gi", -5],
      ["na", -4],
      ["ma", -5],
      ["ter", -6],
      ["mi", -5],
      ["se", -4],
      ["ri", -3],
      ["cor", -4],
      ["di", -5],
      ["ae", -6],
    ],
  });

  const layout = layoutChant(doc, { width: 24 });
  const semanticLyricRuns = layout.systems.flatMap((system) =>
    system.textRuns.filter((run) => run.semanticId?.startsWith("span_")));

  assert.ok(layout.systems.length > 1);
  assert.ok(layout.viewport.height > layout.systems[0].rect.height);
  assert.ok(layout.systems[1].staffs[0].lineYs[0] > layout.systems[0].staffs[0].lineYs[0]);
  assert.equal(semanticLyricRuns.length, Object.keys(doc.text.spans).length);

  for (const system of layout.systems) {
    for (const run of system.textRuns) {
      assert.ok(textRunRight(run) <= 22.000001);
    }
    for (const glyph of system.glyphs) {
      assert.ok(glyph.x + glyph.width <= 22.000001);
    }
  }
}

function testCrampedSyllablesSuppressHyphen() {
  const { doc, voice } = createChantDocument({
    id: "doc_cramped_hyphen",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });

  createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      {
        normalisedText: "longword",
        syllables: [
          ["longone", -1],
          ["longtwo", -1],
        ],
      },
    ],
  });

  const layout = layoutChant(doc, { width: 80 });
  const hyphenRuns = layout.systems[0].textRuns.filter((run) => run.classes.includes("lyric-hyphen"));
  const longone = layout.systems[0].textRuns.find((run) => run.text === "longone");
  const longtwo = layout.systems[0].textRuns.find((run) => run.text === "longtwo");

  assert.ok(longone);
  assert.ok(longtwo);
  assert.ok(textRunLeft(longtwo) - textRunRight(longone) < 0.4);
  assert.equal(hyphenRuns.length, 0);
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
  assert.deepEqual(doc.text.words.word_salve.syllableIds, ["syl_sal", "syl_ve"]);
  assert.deepEqual(doc.text.blocks[0].orderedSpanIds, ["span_sal", "span_ve", "span_re", "span_gi", "span_na"]);
  assert.equal(doc.music.notes.note_na.sign, "punctum");
  assert.deepEqual(doc.music.notes.note_na.rhythmicSigns, ["mora"]);
  assert.equal(voice.eventIds.at(-1), bar.id);
  assert.equal(validateChantDocument(doc).valid, true);
}

function testSyllabicPhraseCompactWordTuple() {
  const { doc, voice } = createChantDocument({
    id: "doc_compact_word_tuple",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });
  const phrase = createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      ["te", -2],
    ],
  });

  assert.equal(phrase.words.length, 1);
  assert.deepEqual(phrase.words[0].word.syllableIds, ["syl_te"]);
  assert.equal(phrase.words[0].word.normalisedText, "te");
  assert.equal(doc.text.syllables.syl_te.text, "te");
  assert.deepEqual(doc.text.blocks[0].orderedSpanIds, ["span_te"]);
  assert.deepEqual(voice.eventIds, ["evt_te"]);
  assert.equal(doc.music.notes.note_te.pitch.diatonicIndex, -2);
  assert.equal(validateChantDocument(doc).valid, true);
}

function testSyllabicPhraseArrayPitchObject() {
  const { doc, voice } = createChantDocument({
    id: "doc_array_pitch_object",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });
  const phrase = createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      {
        normalisedText: "nostra",
        syllables: [
          { text: "no", pitch: [-5, -4], neumeKind: "podatus" },
        ],
      },
    ],
  });
  const layout = layoutChant(doc, { width: 80 });
  const glyphs = layout.systems[0].glyphs;
  const lower = glyphs.find((glyph) => glyph.id === "lg_note_no_podatus");
  const upper = glyphs.find((glyph) => glyph.id === "lg_note_no_podatus_2");

  assert.equal(phrase.neumes[0].notes.length, 2);
  assert.ok(lower);
  assert.ok(upper);
  assert.equal(lower.defKey, "podatusLower");
  assert.equal(upper.defKey, "podatusUpper");
  assert.ok(Number.isFinite(lower.y));
  assert.ok(Number.isFinite(upper.y));
}

function testSyllabicPhraseReadableIds() {
  const { doc, voice } = createChantDocument({
    id: "doc_readable_ids",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });
  const phrase = createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      {
        normalisedText: "Amen",
        syllables: [
          ["A", 0],
          ["men", 1],
        ],
      },
      {
        normalisedText: "Amen",
        syllables: [
          ["A", 2],
          ["men", 3],
        ],
      },
      {
        syllables: [
          {
            music: "bar",
            bar: { kind: "half", phraseStrength: "minor" },
          },
        ],
      },
    ],
  });

  assert.equal(phrase.words[0].word.id, "word_amen");
  assert.equal(phrase.words[1].word.id, "word_amen_2");
  assert.deepEqual(phrase.words[0].word.syllableIds, ["syl_a", "syl_men"]);
  assert.deepEqual(phrase.words[1].word.syllableIds, ["syl_a_2", "syl_men_2"]);
  assert.deepEqual(doc.text.blocks[0].orderedSpanIds, ["span_a", "span_men", "span_a_2", "span_men_2", "span_bar_half"]);
  assert.deepEqual(voice.eventIds, ["evt_a", "evt_men", "evt_a_2", "evt_men_2", "evt_bar_half"]);
  assert.deepEqual(doc.music.neumeGroups.ng_a.noteIds, ["note_a"]);
  assert.deepEqual(doc.music.neumeGroups.ng_a_2.noteIds, ["note_a_2"]);
  assert.equal(doc.text.syllables.syl_bar_half.text, "*");
  assert.equal(doc.music.events.evt_bar_half.kind, "half");
  assert.equal(validateChantDocument(doc).valid, true);
  assert.throws(
    () => createSyllabicPhrase(doc, {
      voiceId: voice.id,
      words: [
        {
          syllables: [
            { id: "syl_a", text: "A", pitch: 0 },
          ],
        },
      ],
    }),
    /Duplicate syllable id: syl_a/,
  );
}

function testSyllabicPhraseBarAndTextOnly() {
  const { doc, voice } = createChantDocument({
    id: "doc_helper_bar_text",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });
  const phrase = createSyllabicPhrase(doc, {
    voiceId: voice.id,
    blockId: "tb_main",
    words: [
      {
        id: "word_alleluia",
        normalisedText: "Alleluia",
        syllables: [
          { text: "Al", spanId: "span_al", neumeId: "ng_al", eventId: "evt_al", pitch: -2 },
          { text: "le", spanId: "span_le", music: "none" },
          {
            text: "lu",
            spanId: "span_lu",
            music: "bar",
            eventId: "evt_lu_bar",
            alignmentId: "aln_lu_bar",
            kind: "quarter",
            phraseStrength: "minor",
          },
          { text: "ia", spanId: "span_ia", neumeId: "ng_ia", eventId: "evt_ia", pitch: -1 },
        ],
      },
    ],
  });
  const layout = layoutChant(doc, { width: 80 });
  const textRuns = layout.systems[0].textRuns;
  const semanticTextRuns = textRuns.filter((run) => run.semanticId?.startsWith("span_"));
  const barGlyph = layout.systems[0].glyphs.find((glyph) => glyph.id === "lg_evt_lu_bar_bar");
  const alNoteGlyph = layout.systems[0].glyphs.find((glyph) => glyph.semanticId === doc.music.neumeGroups.ng_al.noteIds[0]);
  const iaNoteGlyph = layout.systems[0].glyphs.find((glyph) => glyph.semanticId === doc.music.neumeGroups.ng_ia.noteIds[0]);
  const luRun = semanticTextRuns.find((run) => run.semanticId === "span_lu");
  const leRun = semanticTextRuns.find((run) => run.semanticId === "span_le");
  const leSyllable = layout.systems[0].syllables.find((syllable) => syllable.semanticTextSpanId === "span_le");

  assert.equal(phrase.neumes.length, 2);
  assert.equal(phrase.bars.length, 1);
  assert.equal(phrase.alignments.length, 3);
  assert.equal(phrase.words[0].syllablesWithMusic[2].bar.id, "evt_lu_bar");
  assert.deepEqual(voice.eventIds, ["evt_al", "evt_lu_bar", "evt_ia"]);
  assert.equal(doc.music.events.evt_lu_bar.kind, "quarter");
  assert.equal(doc.music.events.evt_lu_bar.phraseStrength, "minor");
  assert.equal(doc.alignment.links.aln_lu_bar.musicTargets[0].fromEventId, "evt_lu_bar");
  assert.equal(doc.alignment.links.aln_lu_bar.relation, "editorialAssociation");
  assert.deepEqual(doc.text.blocks[0].orderedSpanIds, ["span_al", "span_le", "span_lu", "span_ia"]);
  assert.deepEqual(semanticTextRuns.map((run) => run.text), ["Al", "le", "lu", "ia"]);
  assert.deepEqual(textRuns.map((run) => run.text), ["Al", "le", "lu", "-", "ia"]);
  assert.ok(barGlyph);
  assert.equal(barGlyph.defKey, "barQuarter");
  assert.equal(barGlyph.y, 2);
  assert.equal(barGlyph.height, 2);
  assert.ok(alNoteGlyph);
  assert.ok(iaNoteGlyph);
  assert.ok(barGlyph.x > alNoteGlyph.x + alNoteGlyph.width);
  assert.ok(iaNoteGlyph.x > barGlyph.x + barGlyph.width);
  assert.ok(
    barGlyph.x - (alNoteGlyph.x + alNoteGlyph.width) >
      iaNoteGlyph.x - (barGlyph.x + barGlyph.width),
  );
  assert.ok(luRun);
  assert.equal(luRun.x, barGlyph.x + (barGlyph.width / 2));
  assert.ok(leRun);
  assert.ok(leSyllable);
  assert.equal(leSyllable.anchorPolicy, "editorial");
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
                neumeKind: "porrectus",
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
  assert.deepEqual(doc.alignment.links.aln_sal.musicTargets.map((target) => [target.fromEventId, target.toEventId]), [
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

function testPorrectusEndingVariants() {
  const overlaps = [2, 3, 4].map((porrectusSize) => {
    const layout = layoutPorrectusNeume(`podatus_${porrectusSize}`, [
      -2,
      -2 - porrectusSize,
      -1 - porrectusSize,
    ]);
    const swash = layout.systems[0].glyphs.find((glyph) =>
      glyph.id === `lg_note_podatus_${porrectusSize}_1_porrectus${porrectusSize}`);
    const ending = layout.systems[0].glyphs.find((glyph) => glyph.id === `lg_note_podatus_${porrectusSize}_3`);
    const startLine = layout.systems[0].glyphs.find((glyph) => glyph.classes.includes("porrectus-start-line"));
    const endingConnector = layout.systems[0].glyphs.find((glyph) => glyph.classes.includes("porrectus-ending-connector"));

    assert.ok(swash);
    assert.ok(ending);
    assert.ok(startLine);
    assert.equal(startLine.defKey, "neumeConnectorLine");
    assert.equal(endingConnector, undefined);
    assert.equal(swash.defKey, `porrectus${porrectusSize}`);
    assert.equal(ending.defKey, "podatusUpper");
    assert.ok(ending.x < swash.x + swash.width);
    assert.ok(ending.x > swash.x);

    return (swash.x + swash.width) - ending.x;
  });

  assert.ok(overlaps.every((overlap) => overlap > 0));

  const connectorLayout = layoutPorrectusNeume("connector", [-2, -5, -2]);
  const connectorEnding = connectorLayout.systems[0].glyphs.find((glyph) => glyph.id === "lg_note_connector_3");
  const startLine = connectorLayout.systems[0].glyphs.find((glyph) => glyph.classes.includes("porrectus-start-line"));
  const connectorLine = connectorLayout.systems[0].glyphs.find((glyph) => glyph.classes.includes("porrectus-ending-connector"));
  const hiddenSecondNote = connectorLayout.systems[0].glyphs.find((glyph) => glyph.id === "lg_note_connector_2_hidden");
  const svg = renderSvg(connectorLayout);

  assert.ok(connectorEnding);
  assert.equal(connectorEnding.defKey, "podatusUpper");
  assert.ok(startLine);
  assert.equal(startLine.defKey, "neumeConnectorLine");
  assert.ok(connectorLine);
  assert.equal(connectorLine.defKey, "neumeConnectorLine");
  assert.ok(connectorLine.height > 0);
  assert.ok(svg.includes("neuma-neume-line"));
  assert.ok(hiddenSecondNote);
  assert.equal(hiddenSecondNote.defKey, "none");
}

function testClivisLayoutMatchesExsurge() {
  const { doc, voice } = createChantDocument({
    id: "doc_clivis",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });

  createNeumeGroup(doc, {
    id: "ng_clivis",
    eventId: "evt_clivis",
    voiceId: voice.id,
    notes: [
      { id: "note_clivis_1", pitch: -2 },
      { id: "note_clivis_2", pitch: -3 },
    ],
    neumeKind: "clivis",
  });

  const layout = layoutChant(doc, { width: 80 });
  const glyphs = layout.systems[0].glyphs;
  const upper = glyphs.find((glyph) => glyph.id === "lg_note_clivis_1");
  const lower = glyphs.find((glyph) => glyph.id === "lg_note_clivis_2");
  const line = glyphs.find((glyph) => glyph.id === "lg_note_clivis_2_note_clivis_1_clivis_hanging_line");
  const svg = renderSvg(layout);

  assert.ok(upper);
  assert.ok(lower);
  assert.ok(line);
  assert.equal(upper.defKey, "punctum");
  assert.equal(lower.defKey, "punctum");
  assert.equal(line.defKey, "neumeConnectorLine");
  assert.ok(line.classes.includes("clivis-hanging-line"));
  assert.equal(lower.x, upper.x + upper.width);
  assert.equal(line.x, upper.x + (line.width / 2));
  assert.equal(line.y, upper.y + (upper.height / 2));
  assert.ok(line.height > (lower.y + (lower.height / 2)) - line.y);
  assert.equal(
    Number(line.height.toFixed(6)),
    Number((((lower.y + (lower.height / 2)) + 1 + (upper.height / 2.2)) - line.y).toFixed(6)),
  );
  assert.deepEqual(layout.index.semanticToLayoutIds.note_clivis_1, ["lg_note_clivis_1"]);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_clivis_2, ["lg_note_clivis_2"]);
  assert.ok(svg.includes("clivis-hanging-line"));
}

function testTorculusLayoutMatchesExsurge() {
  const { doc, voice } = createChantDocument({
    id: "doc_torculus",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });

  createNeumeGroup(doc, {
    id: "ng_torculus",
    eventId: "evt_torculus",
    voiceId: voice.id,
    notes: [
      { id: "note_torculus_1", pitch: -4 },
      { id: "note_torculus_2", pitch: -1 },
      { id: "note_torculus_3", pitch: -4 },
    ],
    neumeKind: "torculus",
  });

  const before = JSON.stringify(doc);
  const layout = layoutChant(doc, { width: 80 });
  const glyphs = layout.systems[0].glyphs;
  const first = glyphs.find((glyph) => glyph.id === "lg_note_torculus_1");
  const second = glyphs.find((glyph) => glyph.id === "lg_note_torculus_2");
  const third = glyphs.find((glyph) => glyph.id === "lg_note_torculus_3");
  const connectors = glyphs.filter((glyph) => glyph.classes.includes("torculus-connector-line"));
  const firstConnector = glyphs.find((glyph) => glyph.id === "lg_note_torculus_1_note_torculus_2_torculus_connector");
  const secondConnector = glyphs.find((glyph) => glyph.id === "lg_note_torculus_2_note_torculus_3_torculus_connector");
  const svg = renderSvg(layout);

  assert.ok(first);
  assert.ok(second);
  assert.ok(third);
  assert.equal(first.defKey, "punctum");
  assert.equal(second.defKey, "punctum");
  assert.equal(third.defKey, "punctum");
  assert.ok(second.x > first.x);
  assert.ok(second.x < first.x + first.width);
  assert.ok(third.x > second.x);
  assert.ok(third.x < second.x + second.width);
  assert.equal(connectors.length, 2);
  assert.ok(firstConnector);
  assert.ok(secondConnector);
  assert.equal(firstConnector.defKey, "neumeConnectorLine");
  assert.equal(secondConnector.defKey, "neumeConnectorLine");
  assert.ok(firstConnector.x > second.x);
  assert.ok(firstConnector.x < first.x + first.width);
  assert.ok(secondConnector.x > third.x);
  assert.ok(secondConnector.x < second.x + second.width);
  assert.ok(firstConnector.height > 0);
  assert.ok(secondConnector.height > 0);
  assert.ok(firstConnector.classes.includes("neume-line"));
  assert.ok(secondConnector.classes.includes("neume-line"));
  assert.deepEqual(layout.index.semanticToLayoutIds.note_torculus_1, ["lg_note_torculus_1"]);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_torculus_2, ["lg_note_torculus_2"]);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_torculus_3, ["lg_note_torculus_3"]);
  assert.ok(svg.includes("torculus-connector-line"));
  assert.equal(JSON.stringify(doc), before);
}

function testPodatusLayoutMatchesExsurge() {
  const { doc, voice } = createChantDocument({
    id: "doc_podatus",
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });

  createNeumeGroup(doc, {
    id: "ng_podatus",
    eventId: "evt_podatus",
    voiceId: voice.id,
    notes: [
      { id: "note_podatus_1", pitch: -3 },
      { id: "note_podatus_2", pitch: -2 },
    ],
    neumeKind: "podatus",
  });

  const layout = layoutChant(doc, { width: 80 });
  const glyphs = layout.systems[0].glyphs;
  const lower = glyphs.find((glyph) => glyph.id === "lg_note_podatus_1");
  const upper = glyphs.find((glyph) => glyph.id === "lg_note_podatus_2");
  const connector = glyphs.find((glyph) => glyph.id === "lg_note_podatus_1_note_podatus_2_podatus_connector");
  const svg = renderSvg(layout);

  assert.ok(lower);
  assert.ok(upper);
  assert.ok(connector);
  assert.equal(lower.defKey, "podatusLower");
  assert.equal(upper.defKey, "podatusUpper");
  assert.equal(connector.defKey, "neumeConnectorLine");
  assert.ok(connector.classes.includes("podatus-connector-line"));
  assert.ok(connector.height > 0);
  assert.equal(Number(connector.x.toFixed(6)), Number((lower.x + lower.width - (connector.width / 2)).toFixed(6)));
  assert.ok(lower.classes.includes("note-podatus-lower"));
  assert.ok(upper.classes.includes("note-podatus-upper"));
  assert.equal(Number((upper.x + upper.width).toFixed(6)), Number((lower.x + lower.width).toFixed(6)));
  assert.ok(upper.y < lower.y);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_podatus_1, ["lg_note_podatus_1"]);
  assert.deepEqual(layout.index.semanticToLayoutIds.note_podatus_2, ["lg_note_podatus_2"]);
  assert.ok(svg.includes('href="#glyph-podatusLower"'));
  assert.ok(svg.includes('href="#glyph-podatusUpper"'));
  assert.ok(svg.includes("podatus-connector-line"));
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

function layoutPorrectusNeume(suffix, pitches) {
  const { doc, voice } = createChantDocument({
    id: `doc_porrectus_${suffix}`,
    staff: {
      defaultClef: new ClefDef("c", 4),
    },
  });

  createNeumeGroup(doc, {
    id: `ng_${suffix}`,
    eventId: `evt_${suffix}`,
    voiceId: voice.id,
    notes: pitches.map((pitch, index) => ({
      id: `note_${suffix}_${index + 1}`,
      pitch,
    })),
    neumeKind: "porrectus",
  });

  return layoutChant(doc, { width: 80 });
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

function textRunLeft(run) {
  return run.x - (run.width / 2);
}

function textRunRight(run) {
  return run.x + (run.width / 2);
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
