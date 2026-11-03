/**
 * pdfLayout — Pure layout engine for the "Preparar PDF" editor (app port of `docs/js/pdf-export.js`).
 *
 * The same plan drives both the live in-app preview (react-native-svg) and the exported PDF
 * (expo-print), so what the user sees in the preview is exactly what gets printed.
 *
 * Page geometry is in PDF points (72pt = 1in), Letter size:
 * - single: portrait 612 × 792, one copy.
 * - two-up: landscape 792 × 612, two identical 396pt-wide copies with a dashed cut line.
 */

export type PdfFormat = 'single' | 'two-up';

export interface PdfHymn {
  id: string | number;
  number: string | number;
  title: string;
  lyrics?: string;
  author?: string;
  reference?: string;
}

export interface PdfOptions {
  format: PdfFormat;
  columns: 1 | 2;
  includeTitle: boolean;
}

export interface PdfRow {
  text: string;
  /** Horizontal center of the text, relative to the copy's left edge. */
  x: number;
  /** Top of the text box. */
  y: number;
  size: number;
  italic?: boolean;
  bold?: boolean;
  chorus?: boolean;
}

export interface PdfPlan {
  page: PageGeometry;
  fits: boolean;
  rows: PdfRow[];
  titles: string[];
  start: number;
  /** Final font size in pt after shrinking to fit. */
  fontSize: number;
  /** True when the requested size had to be reduced to fit the whole hymn. */
  reduced: boolean;
}

export interface PageGeometry {
  w: number;
  h: number;
  copyW: number;
  margin: number;
  top: number;
  limit: number;
}

export const PDF_MIN_FONT = 4;
export const PDF_MAX_FONT = 28;
export const PDF_DEFAULT_FONT = 13;
export const PDF_AUTO_FIT_START = 20;
const COLUMN_GAP = 14;
const TITLE_SIZE = 21;
const TITLE_LINE = 25;

export function pageGeometry(format: PdfFormat): PageGeometry {
  return format === 'two-up'
    ? { w: 792, h: 612, copyW: 396, margin: 22, top: 72, limit: 574 }
    : { w: 612, h: 792, copyW: 612, margin: 36, top: 70, limit: 752 };
}

export function hymnKindLabel(hymn: PdfHymn): string {
  return `${String(hymn.id).startsWith('E') ? 'Estribillo' : 'Himno'} ${hymn.number}`;
}

/** Default columns used by the website when the editor opens. */
export function defaultColumnsFor(hymn: PdfHymn): 1 | 2 {
  return (hymn.lyrics || '').split('\n').length > 28 ? 2 : 1;
}

// ── Text measurement (serif estimate, slightly generous so lines never overflow) ──
const NARROW = new Set("iljtfrI.,;:'!|()[]-’‘\u00a1".split(''));
const WIDE = new Set('mwMW'.split(''));

export function estimateTextWidth(text: string, size: number, bold = false, italic = false): number {
  let units = 0;
  for (const ch of text) {
    if (ch === ' ') units += 0.26;
    else if (NARROW.has(ch)) units += 0.3;
    else if (WIDE.has(ch)) units += 0.82;
    else if (ch >= 'A' && ch <= 'Z') units += 0.68;
    else if (/[ÁÉÍÓÚÑÜ¿]/.test(ch)) units += 0.68;
    else units += 0.52;
  }
  const weight = bold ? 1.08 : 1;
  const slant = italic ? 0.97 : 1;
  return units * size * weight * slant;
}

function wrap(text: string, width: number, size: number, bold = false, italic = false): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && estimateTextWidth(candidate, size, bold, italic) > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

const CHORUS_RE = /^((?:\d+\s*(?:er|do|ro|to|ndo)?\s*)?coro)[:\s]*/i;

function measure(hymn: PdfHymn, f: number, opts: PdfOptions) {
  const p = pageGeometry(opts.format);
  const count = opts.columns;
  const width = (p.copyW - p.margin * 2 - (count - 1) * COLUMN_GAP) / count;
  const titles = wrap(hymn.title, p.copyW - p.margin * 2, TITLE_SIZE, true);
  const start = opts.includeTitle
    ? p.top + titles.length * TITLE_LINE + (hymn.author ? 15 : 0) + (hymn.reference ? 15 : 0) + 22
    : 28;

  let col = 0;
  let y = start;
  let verse = 0;
  let maxCol = 0;
  const rows: PdfRow[] = [];
  const blocks = (hymn.lyrics || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  for (const raw of blocks) {
    const match = raw.match(CHORUS_RE);
    const chorus = Boolean(match);
    const body = match ? raw.slice(match[0].length) : raw;
    const lines = body
      .split('\n')
      .flatMap((line) => wrap(line.trim(), width - 8, f, false, chorus));
    const blockHeight = f * 0.8 + lines.length * f * 1.28 + f * 0.9;

    if (y > start && y + blockHeight > p.limit && blockHeight <= p.limit - start) {
      col++;
      y = start;
    }
    maxCol = Math.max(maxCol, col);
    const center = p.margin + col * (width + COLUMN_GAP) + width / 2;
    rows.push({
      text: chorus && match ? match[1].toUpperCase() : String(++verse),
      x: center,
      y,
      size: Math.max(4, f * 0.68),
      bold: true,
      chorus,
    });
    y += f * 0.8;

    for (const line of lines) {
      if (y + f * 1.28 > p.limit) {
        col++;
        y = start;
        maxCol = Math.max(maxCol, col);
      }
      const lineCenter = p.margin + col * (width + COLUMN_GAP) + width / 2;
      rows.push({ text: line, x: lineCenter, y, size: f, italic: chorus });
      y += f * 1.28;
    }
    y += f * 0.9;
  }

  return { page: p, fits: maxCol < count, rows, titles, start };
}

/**
 * Builds a plan at the requested size, shrinking in 0.25pt steps until the whole hymn fits
 * on one page (same rule as the website).
 */
export function buildPdfPlan(hymn: PdfHymn, requested: number, opts: PdfOptions): PdfPlan {
  const req = Number.isFinite(requested)
    ? Math.max(PDF_MIN_FONT, Math.min(PDF_MAX_FONT, requested))
    : PDF_DEFAULT_FONT;
  let actual = req;
  let plan = measure(hymn, actual, opts);
  while (!plan.fits && actual > 1) {
    actual = Math.max(1, actual - 0.25);
    plan = measure(hymn, actual, opts);
  }
  return { ...plan, fontSize: Math.round(actual * 100) / 100, reduced: actual < req };
}

export function pdfStatusText(plan: PdfPlan, opts: PdfOptions, language: 'es' | 'en' = 'es'): string {
  const size = plan.fontSize;
  if (language === 'en') {
    const head = opts.format === 'two-up' ? '2 copies' : '1 page';
    return `${head} · ${size} pt text${plan.reduced ? ' · Size reduced to fit the whole hymn.' : ''}`;
  }
  const head = opts.format === 'two-up' ? '2 copias' : '1 página';
  return `${head} · Letra de ${size} pt${plan.reduced ? ' · Tamaño ajustado para incluir toda la alabanza.' : ''}`;
}

// ── SVG rendering (shared by preview and PDF) ──────────────────────────────

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export interface SvgFonts {
  serif: string;
  sans: string;
}

/** Baseline offset for a text whose box top is `y` (alphabetic baseline ≈ 0.8em). */
const baseline = (y: number, size: number) => (y + size * 0.8).toFixed(2);

function copySvg(hymn: PdfHymn, plan: PdfPlan, opts: PdfOptions, offset: number, fonts: SvgFonts): string {
  const p = plan.page;
  const cx = (offset + p.copyW / 2).toFixed(2);
  const parts: string[] = [];
  const serif = escapeXml(fonts.serif);
  const sans = escapeXml(fonts.sans);

  if (opts.includeTitle) {
    parts.push(
      `<text x="${cx}" y="${baseline(28, 9)}" font-family="${sans}" font-size="9" fill="#555555" text-anchor="middle">${escapeXml(`HIMNARIO EL BUEN PASTOR · ${hymnKindLabel(hymn)}`)}</text>`
    );
    let y = 51;
    for (const line of plan.titles) {
      parts.push(
        `<text x="${cx}" y="${baseline(y, TITLE_SIZE)}" font-family="${serif}" font-size="${TITLE_SIZE}" font-weight="bold" fill="#20201d" text-anchor="middle">${escapeXml(line)}</text>`
      );
      y += TITLE_LINE;
    }
    for (const meta of [hymn.author, hymn.reference]) {
      if (!meta) continue;
      parts.push(
        `<text x="${cx}" y="${baseline(y, 9)}" font-family="${sans}" font-size="9" fill="#555555" text-anchor="middle">${escapeXml(meta)}</text>`
      );
      y += 15;
    }
    const ruleY = (plan.start - 14).toFixed(2);
    parts.push(
      `<line x1="${offset + p.margin}" y1="${ruleY}" x2="${offset + p.copyW - p.margin}" y2="${ruleY}" stroke="#dddddd" stroke-width="0.5"/>`
    );
  }

  for (const row of plan.rows) {
    const attrs = [
      `x="${(offset + row.x).toFixed(2)}"`,
      `y="${baseline(row.y, row.size)}"`,
      `font-family="${serif}"`,
      `font-size="${row.size.toFixed(2)}"`,
      `fill="${row.chorus ? '#6e1619' : '#20201d'}"`,
      'text-anchor="middle"',
    ];
    if (row.bold) attrs.push('font-weight="bold"');
    if (row.italic) attrs.push('font-style="italic"');
    parts.push(`<text ${attrs.join(' ')}>${escapeXml(row.text)}</text>`);
  }
  return parts.join('');
}

export function buildPdfSvg(hymn: PdfHymn, plan: PdfPlan, opts: PdfOptions, fonts: SvgFonts): string {
  const p = plan.page;
  let body = `<rect x="0" y="0" width="${p.w}" height="${p.h}" fill="#ffffff"/>`;
  body += copySvg(hymn, plan, opts, 0, fonts);
  if (opts.format === 'two-up') {
    body += copySvg(hymn, plan, opts, p.copyW, fonts);
    body += `<line x1="${p.copyW}" y1="0" x2="${p.copyW}" y2="${p.h}" stroke="#999999" stroke-width="0.8" stroke-dasharray="5,4"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p.w} ${p.h}" width="${p.w}" height="${p.h}">${body}</svg>`;
}

/**
 * HTML document for expo-print. The SVG scales to the page width, so the output is correct
 * regardless of how the platform maps CSS pixels to PDF points. `widthPercent` lets the caller
 * shrink slightly if rounding ever spills onto a second page.
 */
export function buildPdfHtml(svg: string, plan: PdfPlan, widthPercent = 99.6): string {
  const p = plan.page;
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>
    @page { size: ${p.w / 72}in ${p.h / 72}in; margin: 0; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    .page { width: 100%; overflow: hidden; page-break-after: avoid; break-after: avoid; }
    .page svg { display: block; width: ${widthPercent}%; height: auto; margin: 0 auto; }
  </style></head><body><div class="page">${svg.replace(/ width="\d+" height="\d+">/, '>')}</div></body></html>`;
}

export function pdfFileBaseName(hymn: PdfHymn): string {
  return `${hymnKindLabel(hymn)} - ${hymn.title}`.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim();
}

