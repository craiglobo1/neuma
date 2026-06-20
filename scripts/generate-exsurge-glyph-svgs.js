const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const glyphSource = path.join(root, "assets", "exsurge-glyphs", "source", "Exsurge.Glyphs.js");
const outputDir = path.join(root, "assets", "exsurge-glyphs", "svg");
const source = fs.readFileSync(glyphSource, "utf8").replace(/export let Glyphs = /, "globalThis.Glyphs = ");
const context = { globalThis: {} };

vm.createContext(context);
vm.runInContext(source, context);

const glyphs = context.globalThis.Glyphs;

fs.mkdirSync(outputDir, { recursive: true });

for (const [name, glyph] of Object.entries(glyphs)) {
  const paths = (glyph.paths ?? []).map((glyphPath) => {
    const fill = glyphPath.type === "negative" ? "#fff" : "#000";
    return `<path fill="${fill}" d="${glyphPath.data}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${glyph.bounds.width} ${glyph.bounds.height}" data-exsurge-glyph="${name}"><title>${name}</title><g transform="translate(${glyph.origin.x} ${glyph.origin.y})">${paths}</g></svg>\n`;

  fs.writeFileSync(path.join(outputDir, `${name}.svg`), svg, "utf8");
}

const manifest = Object.entries(glyphs).map(([name, glyph]) => ({
  name,
  file: `svg/${name}.svg`,
  bounds: glyph.bounds,
  origin: glyph.origin,
  pathCount: (glyph.paths ?? []).length,
}));

fs.writeFileSync(
  path.join(root, "assets", "exsurge-glyphs", "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`Wrote ${Object.keys(glyphs).length} Exsurge glyph SVGs to ${path.relative(root, outputDir)}.`);
