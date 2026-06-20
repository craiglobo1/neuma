const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  AlignmentLink,
  AlignmentPolicy,
  BarEvent,
  ChantDocument,
  ClefDef,
  DocumentMetadata,
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
  Voice,
  writeSvgFile,
} = require("../dist");

function run() {
  testKyrieLayoutAndSvg();
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
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("data-semantic-id"));
  assert.ok(svg.includes('data-exsurge-glyph="PunctumCuadratum"'));
  assert.ok(svg.includes('data-exsurge-glyph="Quilisma"'));
  assert.equal(svg, svgAgain);
  assert.equal(JSON.stringify(kyrieExampleDocument), before);
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
