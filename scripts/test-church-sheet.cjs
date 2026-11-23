const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../himnario/node_modules/typescript');

const load = (file) => {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = { exports: {} };
  // Resolve bare imports (e.g. "qrcode") against the app's own node_modules.
  const appRequire = (name) =>
    require(name.startsWith('.')
      ? path.join(__dirname, '..', path.dirname(file), name)
      : path.join(__dirname, '../himnario/node_modules', name));
  new Function('require', 'module', 'exports', compiled)(appRequire, loaded, loaded.exports);
  return loaded.exports;
};
const schedule = load('himnario/utils/churchSchedule.ts');
const { serializeSchedule, formatClock } = schedule;
// Display fields only; start/end minutes are covered by the round-trip test.
const parseServiceTimes = (text) => {
  const rows = schedule.parseServiceTimes(text);
  return rows && rows.map(({ day, dayIndex, time, note }) => ({ day, dayIndex, time, note }));
};
const { sheetSnapTarget } = load('himnario/utils/gestureMotion.ts');
const { churchDisplayName, servantDisplayName } = load('himnario/utils/churchName.ts');
const { churchShareUrl } = load('himnario/utils/churchMapUtils.ts');

test('the seeded Riverbank schedule becomes one row per service', () => {
  const rows = parseServiceTimes(
    'Martes 7:00 PM–9:00 PM · Jueves 7:00 PM–9:00 PM · Viernes 7:00 PM–9:00 PM (Estudio bíblico de jóvenes) · Domingo 2:00 PM–5:00 PM',
  );
  assert.deepEqual(rows, [
    { day: 'Martes', dayIndex: 2, time: '7:00 – 9:00 PM', note: null },
    { day: 'Jueves', dayIndex: 4, time: '7:00 – 9:00 PM', note: null },
    { day: 'Viernes', dayIndex: 5, time: '7:00 – 9:00 PM', note: 'Estudio bíblico de jóvenes' },
    { day: 'Domingo', dayIndex: 0, time: '2:00 – 5:00 PM', note: null },
  ]);
});

test('single times, plurals, accents, English days and mixed meridiems parse', () => {
  assert.deepEqual(parseServiceTimes('Domingos 10:00 AM · Miércoles 7 PM'), [
    { day: 'Domingos', dayIndex: 0, time: '10:00 AM', note: null },
    { day: 'Miércoles', dayIndex: 3, time: '7:00 PM', note: null },
  ]);
  assert.deepEqual(parseServiceTimes('Sundays 11:30 am - 1:00 p.m.; Sábado 6:00 PM'), [
    { day: 'Sundays', dayIndex: 0, time: '11:30 AM – 1:00 PM', note: null },
    { day: 'Sábado', dayIndex: 6, time: '6:00 PM', note: null },
  ]);
});

test('text that is not a clean schedule is rejected whole, never half-parsed', () => {
  assert.equal(parseServiceTimes(''), null);
  assert.equal(parseServiceTimes(null), null);
  assert.equal(parseServiceTimes('Llamar al pastor para horarios'), null);
  assert.equal(parseServiceTimes('Martes 7:00 PM · Cultos especiales cada mes'), null);
  assert.equal(parseServiceTimes('Feriado 7:00 PM'), null);
});

test('a released sheet settles on the nearest detent when moving slowly', () => {
  const snaps = [180, 400, 720];
  assert.equal(sheetSnapTarget(190, 0, snaps), 0);
  assert.equal(sheetSnapTarget(300, 100, snaps), 1);
  assert.equal(sheetSnapTarget(600, -200, snaps), 2);
});

test('a flick moves one detent in its direction and stops at the ends', () => {
  const snaps = [180, 400, 720];
  assert.equal(sheetSnapTarget(200, -900, snaps), 1);
  assert.equal(sheetSnapTarget(420, -900, snaps), 2);
  assert.equal(sheetSnapTarget(700, 900, snaps), 1);
  assert.equal(sheetSnapTarget(380, 900, snaps), 0);
  assert.equal(sheetSnapTarget(720, -900, snaps), 2);
  assert.equal(sheetSnapTarget(180, 900, snaps), 0);
});

test('church names drop the shared denomination and keep what tells them apart', () => {
  assert.equal(churchDisplayName('IDDV El Buen Pastor — Riverbank', 'Riverbank'), 'Riverbank');
  assert.equal(churchDisplayName('El Buen Pastor - San José'), 'San José');
  assert.equal(churchDisplayName('Iglesia El Buen Pastor: Modesto Norte'), 'Modesto Norte');
  assert.equal(churchDisplayName('iddv el buen pastor', 'Fresno'), 'Fresno');
  assert.equal(churchDisplayName('IDDV El Buen Pastor'), 'IDDV El Buen Pastor');
  assert.equal(churchDisplayName('Templo Central', 'Tijuana'), 'Templo Central');
  assert.equal(churchDisplayName(null, 'Tijuana'), 'Tijuana');
});

test('the schedule editor writes text the church card reads back unchanged', () => {
  const entries = [
    { dayIndex: 0, start: 14 * 60, end: 17 * 60, note: '' },
    { dayIndex: 5, start: 19 * 60, end: 21 * 60, note: 'Estudio bíblico (jóvenes) · ' },
    { dayIndex: 2, start: 19 * 60, end: 21 * 60, note: '' },
    { dayIndex: 2, start: 10 * 60 + 30, end: null, note: '' },
  ];
  const text = serializeSchedule(entries);
  assert.equal(
    text,
    'Martes 10:30 AM · Martes 7:00 PM–9:00 PM · Viernes 7:00 PM–9:00 PM (Estudio bíblico jóvenes) · Domingo 2:00 PM–5:00 PM',
  );
  const back = schedule.parseServiceTimes(text);
  assert.deepEqual(
    back.map(({ dayIndex, start, end, note }) => ({ dayIndex, start, end, note: note ?? '' })),
    [
      { dayIndex: 2, start: 630, end: null, note: '' },
      { dayIndex: 2, start: 1140, end: 1260, note: '' },
      { dayIndex: 5, start: 1140, end: 1260, note: 'Estudio bíblico jóvenes' },
      { dayIndex: 0, start: 840, end: 1020, note: '' },
    ],
  );
  assert.equal(formatClock(0), '12:00 AM');
  assert.equal(formatClock(12 * 60 + 5), '12:05 PM');
});

test('congregation leaders are shown with the SDD title, replacing older titles', () => {
  assert.equal(servantDisplayName('Hno Azael Tapia'), 'SDD Hno Azael Tapia');
  assert.equal(servantDisplayName('Co-Pastor Azael Tapia'), 'SDD Azael Tapia');
  assert.equal(servantDisplayName('Pastor Juan Pérez'), 'SDD Juan Pérez');
  assert.equal(servantDisplayName('SDD Hna. María López'), 'SDD Hna. María López');
  assert.equal(servantDisplayName('Siervo de Dios Hno Pedro'), 'SDD Hno Pedro');
  assert.equal(servantDisplayName('Pastora Ana'), 'SDD Ana');
  assert.equal(servantDisplayName('  '), '');
  assert.equal(servantDisplayName(null), '');
});

test("the QR link a church shares is one the app's own scanner accepts", () => {
  const url = churchShareUrl('church-riverbank-ca');
  assert.equal(url, 'https://himnarioebp.com/churches?id=church-riverbank-ca');

  // The same matching app/churches.tsx applies to a scanned code.
  const scan = (raw) => {
    const m =
      raw.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
      raw.match(/\/churches\/([a-zA-Z0-9_-]+)/i) ||
      raw.match(/^church:([a-zA-Z0-9_-]+)$/i);
    return m && (raw.includes('church') || raw.startsWith('church:'))
      ? decodeURIComponent(m[1])
      : null;
  };
  assert.equal(scan(url), 'church-riverbank-ca');
  assert.equal(scan(churchShareUrl('iglesia_centro-2')), 'iglesia_centro-2');
  assert.equal(scan('https://himnarioebp.com/hymn/429'), null);
});

test('the drawn QR path matches the encoder matrix module for module', () => {
  const { buildQrPath } = load('himnario/utils/qrPath.ts');
  const url = churchShareUrl('church-riverbank-ca');
  const margin = 2;
  const { path, extent, size } = buildQrPath(url, margin);

  // Version 4 code: 33 modules a side, plus the quiet zone on both sides.
  assert.equal(size, 33);
  assert.equal(extent, 33 + margin * 2);

  // Rebuild the grid from the path and compare against the encoder itself.
  const drawn = new Uint8Array(size * size);
  const run = /M(\d+) (\d+)h(\d+)v1h-\3z/g;
  let m;
  let covered = 0;
  while ((m = run.exec(path)) !== null) {
    const [x, y, len] = [+m[1] - margin, +m[2] - margin, +m[3]];
    for (let i = 0; i < len; i++) drawn[y * size + x + i] = 1;
    covered += len;
  }
  assert.ok(covered > 0, 'path drew nothing');
  // Nothing outside the recognised command shape.
  assert.equal(path.replace(run, '').length, 0);

  const reference = require('../himnario/node_modules/qrcode/lib/core/qrcode')
    .create(url, { errorCorrectionLevel: 'M' }).modules;
  for (let i = 0; i < size * size; i++) {
    assert.equal(drawn[i], reference.data[i] ? 1 : 0, `module ${i} differs`);
  }

  // A finder pattern sits in three corners; the fourth has none.
  const dark = (x, y) => drawn[y * size + x] === 1;
  for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
    assert.ok(dark(ox, oy) && dark(ox + 6, oy) && dark(ox + 3, oy + 3), 'missing finder pattern');
    assert.ok(!dark(ox + 1, oy + 1), 'finder pattern should be hollow');
  }
});

test('encoding is deterministic and distinguishes churches', () => {
  const { buildQrPath } = load('himnario/utils/qrPath.ts');
  const a = buildQrPath(churchShareUrl('church-riverbank-ca'));
  const b = buildQrPath(churchShareUrl('church-riverbank-ca'));
  const c = buildQrPath(churchShareUrl('church-modesto-ca'));
  assert.equal(a.path, b.path);
  assert.notEqual(a.path, c.path);
});
