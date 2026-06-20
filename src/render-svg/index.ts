import type { LayoutDocument, LayoutGlyph, LayoutGlyphDef, LayoutSystem, Rect } from "../layout";

type FileSystemModule = {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  readFileSync(path: string, encoding: "utf8"): string;
  writeFileSync(path: string, data: string, encoding: "utf8"): void;
};

type PathModule = {
  dirname(path: string): string;
  join(...paths: string[]): string;
  resolve(...paths: string[]): string;
};

declare const require: (moduleName: string) => unknown;
declare const __dirname: string;

type SvgGlyphAsset = {
  viewBox: string;
  body: string;
};

const GLYPH_ASSET_NAMES: Record<string, string> = {
  clefC: "DoClef",
  clefF: "FaClef",
  punctum: "PunctumCuadratum",
  quilisma: "Quilisma",
  inclinatum: "PunctumInclinatum",
  liquescentAscending: "PunctumCuadratumAscLiquescent",
  liquescentDescending: "PunctumCuadratumDesLiquescent",
  oriscusAscending: "OriscusAsc",
  oriscusDescending: "OriscusDes",
  virgaLong: "VirgaLong",
  virgaShort: "VirgaShort",
  apostropha: "Apostropha",
  podatusLower: "PodatusLower",
  podatusUpper: "PodatusUpper",
  porrectus1: "Porrectus1",
  porrectus2: "Porrectus2",
  porrectus3: "Porrectus3",
  porrectus4: "Porrectus4",
  mora: "Mora",
  verticalEpisemaAbove: "VerticalEpisemaAbove",
  verticalEpisemaBelow: "VerticalEpisemaBelow",
  flat: "Flat",
  natural: "Natural",
  custosLong: "CustodLong",
  custosShort: "CustodShort",
  custosDescLong: "CustodDescLong",
  custosDescShort: "CustodDescShort",
};

const glyphAssetCache: Record<string, SvgGlyphAsset | undefined> = {};

export function renderSvg(layout: LayoutDocument): string {
  const scale = layout.units.pxPerStaffSpace;
  const width = toPx(layout.viewport.width, scale);
  const height = toPx(layout.viewport.height, scale);
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(width)} ${fmt(height)}" width="${fmt(width)}" height="${fmt(height)}" data-layout-id="${escapeAttr(layout.layoutId)}" data-source-document-id="${escapeAttr(layout.sourceDocumentId)}">`);
  parts.push("<defs>");
  parts.push("<style>.neuma-staff-line{stroke:#161616;stroke-linecap:square}.neuma-glyph{fill:#161616}.neuma-lyric{font-family:serif;font-size:12px;fill:#161616}.neuma-hit-box{fill:transparent;stroke:none;pointer-events:all}</style>");
  for (const def of layout.defs) {
    parts.push(renderSymbol(def, scale));
  }
  parts.push("</defs>");

  for (const system of [...layout.systems].sort(compareSystems)) {
    parts.push(renderSystem(system, scale, layout.units.lineThickness));
  }

  parts.push("</svg>");
  return parts.join("");
}

export function writeSvgFile(layout: LayoutDocument, filePath: string): string {
  const svg = renderSvg(layout);
  const fs = require("node:fs") as FileSystemModule;
  const path = require("node:path") as PathModule;
  const directory = path.dirname(filePath);

  if (directory !== "." && directory !== "") {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, svg, "utf8");
  return svg;
}

function renderSystem(system: LayoutSystem, scale: number, lineThickness: number): string {
  const parts: string[] = [];
  parts.push(`<g id="${escapeAttr(system.id)}" class="neuma-system">`);

  for (const staff of [...system.staffs].sort((left, right) => left.id.localeCompare(right.id))) {
    parts.push(`<g id="${escapeAttr(staff.id)}" class="neuma-staff" data-semantic-id="${escapeAttr(staff.semanticStaffId)}">`);
    staff.lineYs.forEach((lineY, index) => {
      parts.push(`<line id="${escapeAttr(staff.id)}_line_${index + 1}" class="neuma-staff-line" data-semantic-id="${escapeAttr(staff.semanticStaffId)}" x1="${fmt(toPx(staff.origin.x, scale))}" y1="${fmt(toPx(lineY, scale))}" x2="${fmt(toPx(staff.origin.x + staff.width, scale))}" y2="${fmt(toPx(lineY, scale))}" stroke-width="${fmt(toPx(lineThickness, scale))}"/>`);
    });
    parts.push("</g>");
  }

  const glyphsByParent = groupGlyphsByParent(system.glyphs);
  const unparentedGlyphs = glyphsByParent.get("") ?? [];
  for (const glyph of unparentedGlyphs) {
    parts.push(renderGlyph(glyph, scale));
  }

  for (const neume of [...system.neumes].sort((left, right) => left.id.localeCompare(right.id))) {
    parts.push(`<g id="${escapeAttr(neume.id)}" class="neuma-neume" data-semantic-id="${escapeAttr(neume.semanticNeumeId)}">`);
    for (const glyph of glyphsByParent.get(neume.id) ?? []) {
      parts.push(renderGlyph(glyph, scale));
    }
    parts.push(renderHitBox(`${neume.id}_hit`, neume.rect, scale, neume.semanticNeumeId));
    parts.push("</g>");
  }

  for (const syllable of [...system.syllables].sort((left, right) => left.id.localeCompare(right.id))) {
    parts.push(`<g id="${escapeAttr(syllable.id)}" class="neuma-syllable" data-semantic-id="${escapeAttr(syllable.semanticTextSpanId)}">`);
    parts.push(renderHitBox(`${syllable.id}_hit`, syllable.bounds, scale, syllable.semanticTextSpanId));
    parts.push("</g>");
  }

  for (const textRun of [...system.textRuns].sort((left, right) => left.id.localeCompare(right.id))) {
    const anchor = textRun.align === "centre" ? "middle" : textRun.align === "right" ? "end" : "start";
    const semanticAttr = textRun.semanticId === undefined ? "" : ` data-semantic-id="${escapeAttr(textRun.semanticId)}"`;
    parts.push(`<text id="${escapeAttr(textRun.id)}" class="neuma-lyric ${escapeAttr(textRun.classes.join(" "))}"${semanticAttr} x="${fmt(toPx(textRun.x, scale))}" y="${fmt(toPx(textRun.baselineY, scale))}" text-anchor="${anchor}">${escapeText(textRun.text)}</text>`);
  }

  parts.push("</g>");
  return parts.join("");
}

function renderGlyph(glyph: LayoutGlyph, scale: number): string {
  const href = `#glyph-${glyph.defKey}`;
  const classes = ["neuma-glyph", ...glyph.classes].join(" ");
  const semanticAttr = glyph.semanticId === undefined ? "" : ` data-semantic-id="${escapeAttr(glyph.semanticId)}"`;
  const parts = [
    `<use id="${escapeAttr(glyph.id)}" class="${escapeAttr(classes)}"${semanticAttr} href="${escapeAttr(href)}" x="${fmt(toPx(glyph.x, scale))}" y="${fmt(toPx(glyph.y, scale))}" width="${fmt(toPx(glyph.width, scale))}" height="${fmt(toPx(glyph.height, scale))}"/>`,
  ];

  if (glyph.hitBox !== undefined) {
    parts.push(renderHitBox(`${glyph.id}_hit`, glyph.hitBox, scale, glyph.semanticId));
  }

  return parts.join("");
}

function renderHitBox(id: string, rect: Rect, scale: number, semanticId?: string): string {
  const semanticAttr = semanticId === undefined ? "" : ` data-semantic-id="${escapeAttr(semanticId)}"`;
  return `<rect id="${escapeAttr(id)}" class="neuma-hit-box"${semanticAttr} x="${fmt(toPx(rect.x, scale))}" y="${fmt(toPx(rect.y, scale))}" width="${fmt(toPx(rect.width, scale))}" height="${fmt(toPx(rect.height, scale))}"/>`;
}

function renderSymbol(def: LayoutGlyphDef, scale: number): string {
  const width = toPx(def.bbox.width, scale);
  const height = toPx(def.bbox.height, scale);
  const id = `glyph-${def.key}`;
  const asset = loadGlyphAsset(def.key);

  if (asset !== undefined) {
    return `<symbol id="${escapeAttr(id)}" viewBox="${escapeAttr(asset.viewBox)}">${asset.body}</symbol>`;
  }

  return `<symbol id="${escapeAttr(id)}" viewBox="0 0 ${fmt(width)} ${fmt(height)}">${symbolBody(def.key, width, height)}</symbol>`;
}

function loadGlyphAsset(defKey: string): SvgGlyphAsset | undefined {
  if (Object.prototype.hasOwnProperty.call(glyphAssetCache, defKey)) {
    return glyphAssetCache[defKey];
  }

  const assetName = GLYPH_ASSET_NAMES[defKey];

  if (assetName === undefined) {
    glyphAssetCache[defKey] = undefined;
    return undefined;
  }

  const fs = require("node:fs") as FileSystemModule;

  for (const candidate of glyphAssetPathCandidates(assetName)) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    glyphAssetCache[defKey] = parseGlyphAsset(fs.readFileSync(candidate, "utf8"));
    return glyphAssetCache[defKey];
  }

  glyphAssetCache[defKey] = undefined;
  return undefined;
}

function glyphAssetPathCandidates(assetName: string): string[] {
  const path = require("node:path") as PathModule;
  const fileName = `${assetName}.svg`;

  return [
    path.resolve("assets", "svg", fileName),
    path.resolve(__dirname, "..", "..", "assets", "svg", fileName),
    path.resolve(__dirname, "..", "..", "..", "assets", "svg", fileName),
  ];
}

function parseGlyphAsset(svg: string): SvgGlyphAsset {
  const viewBox = svg.match(/\sviewBox="([^"]+)"/)?.[1] ?? "0 0 0 0";
  const dataGlyph = svg.match(/\sdata-exsurge-glyph="([^"]+)"/)?.[1];
  const body = svg
    .replace(/^[\s\S]*?<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .trim();
  const assetAttr = dataGlyph === undefined ? "" : ` data-exsurge-glyph="${escapeAttr(dataGlyph)}"`;

  return {
    viewBox,
    body: `<g${assetAttr}>${body}</g>`,
  };
}

function symbolBody(key: string, width: number, height: number): string {
  switch (key) {
    case "clefC":
      return `<path d="M${fmt(width * 0.8)} ${fmt(height * 0.08)}H${fmt(width * 0.3)}C${fmt(width * 0.08)} ${fmt(height * 0.08)} ${fmt(width * 0.08)} ${fmt(height * 0.92)} ${fmt(width * 0.3)} ${fmt(height * 0.92)}H${fmt(width * 0.8)}V${fmt(height * 0.72)}H${fmt(width * 0.34)}V${fmt(height * 0.28)}H${fmt(width * 0.8)}Z"/>`;
    case "clefF":
      return `<path d="M${fmt(width * 0.15)} ${fmt(height * 0.08)}H${fmt(width * 0.85)}V${fmt(height * 0.28)}H${fmt(width * 0.38)}V${fmt(height * 0.45)}H${fmt(width * 0.72)}V${fmt(height * 0.65)}H${fmt(width * 0.38)}V${fmt(height * 0.95)}H${fmt(width * 0.15)}Z"/>`;
    case "quilisma":
      return `<path d="M0 ${fmt(height * 0.55)}L${fmt(width * 0.2)} ${fmt(height * 0.25)}L${fmt(width * 0.4)} ${fmt(height * 0.55)}L${fmt(width * 0.6)} ${fmt(height * 0.25)}L${fmt(width * 0.8)} ${fmt(height * 0.55)}L${fmt(width)} ${fmt(height * 0.25)}V${fmt(height * 0.8)}H0Z"/>`;
    case "barDouble":
    case "barFinal":
      return `<rect x="0" y="0" width="${fmt(width * 0.25)}" height="${fmt(height)}"/><rect x="${fmt(width * 0.65)}" y="0" width="${fmt(width * 0.35)}" height="${fmt(height)}"/>`;
    case "barQuarter":
    case "barHalf":
    case "barFull":
      return `<rect x="0" y="0" width="${fmt(width)}" height="${fmt(height)}"/>`;
    default:
      return `<rect x="0" y="0" width="${fmt(width)}" height="${fmt(height)}"/>`;
  }
}

function groupGlyphsByParent(glyphs: LayoutGlyph[]): Map<string, LayoutGlyph[]> {
  const map = new Map<string, LayoutGlyph[]>();
  for (const glyph of [...glyphs].sort(compareGlyphs)) {
    const key = glyph.parentId ?? "";
    const group = map.get(key) ?? [];
    group.push(glyph);
    map.set(key, group);
  }
  return map;
}

function compareSystems(left: LayoutSystem, right: LayoutSystem): number {
  return left.index - right.index || left.id.localeCompare(right.id);
}

function compareGlyphs(left: LayoutGlyph, right: LayoutGlyph): number {
  return left.zIndex - right.zIndex || left.x - right.x || left.y - right.y || left.id.localeCompare(right.id);
}

function toPx(value: number, scale: number): number {
  return value * scale;
}

function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
