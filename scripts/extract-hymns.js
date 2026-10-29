/**
 * extract-hymns.js
 * Parses himnario/data/alabanzasPaginas.js and extracts all hymn data
 * into a single JSON file for the web frontend.
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'himnario', 'data', 'alabanzasPaginas.js');
const OUTPUT = path.join(__dirname, '..', 'docs', 'data/hymns-data.js');

console.log('Reading source file...');
const raw = fs.readFileSync(SOURCE, 'utf8');

// ── Step 1: Extract the `letras` object ──────────────────────────
// Find the block: const letras = { ... };
const letrasStart = raw.indexOf('const letras = {');
if (letrasStart === -1) throw new Error('Could not find "const letras" in source');

// Find the matching closing brace by counting braces
let braceCount = 0;
let letrasEnd = -1;
for (let i = letrasStart; i < raw.length; i++) {
  if (raw[i] === '{') braceCount++;
  if (raw[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      letrasEnd = i + 1;
      break;
    }
  }
}

const letrasBlock = raw.substring(letrasStart, letrasEnd);

// Evaluate the letras object safely using Function constructor
// We wrap it so it returns the object
let letras;
try {
  const fn = new Function(letrasBlock + '\nreturn letras;');
  letras = fn();
} catch (e) {
  console.error('Failed to eval letras block:', e.message);
  process.exit(1);
}

console.log(`Extracted ${Object.keys(letras).length} lyrics entries`);

// ── Step 2: Extract the hymnsData array ──────────────────────────
// The _letra helper and hymnsData array follow the letras object
const _letra = (id) =>
  letras[id] ||
  'Las letras de este himno serán agregadas pronto.\n\nVuelve más tarde.';

const hymnsDataStart = raw.indexOf('export const hymnsData = [');
if (hymnsDataStart === -1) throw new Error('Could not find "export const hymnsData" in source');

// Find the closing ];
let bracketCount = 0;
let hymnsDataEnd = -1;
for (let i = hymnsDataStart; i < raw.length; i++) {
  if (raw[i] === '[') bracketCount++;
  if (raw[i] === ']') {
    bracketCount--;
    if (bracketCount === 0) {
      hymnsDataEnd = i + 1;
      break;
    }
  }
}

let hymnsDataBlock = raw.substring(hymnsDataStart, hymnsDataEnd);

// Remove the 'export' keyword
hymnsDataBlock = hymnsDataBlock.replace('export const hymnsData', 'const hymnsData');

// Evaluate with _letra available
let hymnsData;
try {
  const fn2 = new Function('_letra', hymnsDataBlock + '\nreturn hymnsData;');
  hymnsData = fn2(_letra);
} catch (e) {
  console.error('Failed to eval hymnsData block:', e.message);
  process.exit(1);
}

console.log(`Extracted ${hymnsData.length} main hymn entries`);

// ── Step 2b: Extract the estribillosData array (extras) ──────────
const estribillosStart = raw.indexOf('export const estribillosData = [');
let estribillosData = [];

if (estribillosStart !== -1) {
  let ebCount = 0;
  let estribillosEnd = -1;
  for (let i = estribillosStart; i < raw.length; i++) {
    if (raw[i] === '[') ebCount++;
    if (raw[i] === ']') {
      ebCount--;
      if (ebCount === 0) {
        estribillosEnd = i + 1;
        break;
      }
    }
  }

  let estribillosBlock = raw.substring(estribillosStart, estribillosEnd);
  estribillosBlock = estribillosBlock.replace('export const estribillosData', 'const estribillosData');

  try {
    const fn3 = new Function('_letra', estribillosBlock + '\nreturn estribillosData;');
    estribillosData = fn3(_letra);
  } catch (e) {
    console.error('Failed to eval estribillosData block:', e.message);
  }

  console.log(`Extracted ${estribillosData.length} extras/estribillos entries`);
} else {
  console.log('No estribillosData found');
}

// Merge both arrays
hymnsData = [...hymnsData, ...estribillosData];

// ── Step 3: Check which audio files exist ──────────────────────────
const audioDir = path.join(__dirname, '..', 'docs', 'audio');
const audioFiles = new Set(fs.readdirSync(audioDir).filter(f => f.endsWith('.m4a')));

// Recordings whose file name is not hymn_{id}.m4a. Keep in sync with
// himnario/data/audioRegistry.ts and audioRegistry.android.ts.
const AUDIO_FILE_EXCEPTIONS = {
  '315 A': 'hymn_315.m4a',
};

// ── Step 4: Build the output JSON ──────────────────────────────────
const allCategories = new Set();

const hymns = hymnsData.map(h => {
  const cats = h.categories
    ? (Array.isArray(h.categories) ? h.categories : h.categories.split(/[•,]/)).map(c => c.trim()).filter(Boolean)
    : [];
  cats.forEach(c => allCategories.add(c));

  // Check if audio file exists (a few recordings use a different file name)
  const audioFileName = AUDIO_FILE_EXCEPTIONS[h.id] || `hymn_${h.id}.m4a`;
  const hasAudio = audioFiles.has(audioFileName);

  return {
    id: h.id,
    number: h.number,
    title: h.title,
    categories: cats,
    author: h.author || '',
    reference: h.reference || '',
    audioCredit: h.audioCredit?.name ? { name: h.audioCredit.name, url: h.audioCredit.url || '' } : null,
    lyrics: h.lyrics || '',
    hasAudio,
    audioFile: hasAudio ? audioFileName : null,
  };
});

// Separate main hymns (numeric IDs) from extras (E-prefixed IDs)
const mainHymns = hymns.filter(h => !h.id.startsWith('E')).sort((a, b) => a.number - b.number);
const extraHymns = hymns.filter(h => h.id.startsWith('E')).sort((a, b) => a.number - b.number);

const output = {
  generated: new Date().toISOString(),
  stats: {
    totalHymns: hymns.length,
    mainHymns: mainHymns.length,
    extraHymns: extraHymns.length,
    withAudio: hymns.filter(h => h.hasAudio).length,
    categories: [...allCategories].sort(),
  },
  hymns: [...mainHymns, ...extraHymns],
};

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, "window.HYMNS_DB = " + JSON.stringify(output, null, 0) + ";", 'utf8');

const fileSizeMB = (fs.statSync(OUTPUT).size / (1024 * 1024)).toFixed(2);
console.log(`\nDone! Written to ${OUTPUT}`);
console.log(`File size: ${fileSizeMB} MB`);
console.log(`Total hymns: ${output.stats.totalHymns}`);
console.log(`  Main: ${output.stats.mainHymns}`);
console.log(`  Extras: ${output.stats.extraHymns}`);
console.log(`  With audio: ${output.stats.withAudio}`);
console.log(`Categories: ${output.stats.categories.join(', ')}`);
