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

test('leaders are entered as a plain name and shown as "SDD Hno <name>"', () => {
  const { servantBareName } = load('himnario/utils/churchName.ts');
  // What the form saves → what the card shows.
  assert.equal(servantDisplayName('Azael Tapia'), 'SDD Hno Azael Tapia');
  // Older records and people who type the title anyway end up the same.
  assert.equal(servantDisplayName('Hno Azael Tapia'), 'SDD Hno Azael Tapia');
  assert.equal(servantDisplayName('Co-Pastor Azael Tapia'), 'SDD Hno Azael Tapia');
  assert.equal(servantDisplayName('SDD Hno. Juan Pérez'), 'SDD Hno Juan Pérez');
  assert.equal(servantDisplayName('Siervo de Dios Hermano Pedro'), 'SDD Hno Pedro');
  // A sister keeps Hna.
  assert.equal(servantDisplayName('Hna María López'), 'SDD Hna María López');
  assert.equal(servantDisplayName('  '), '');
  assert.equal(servantDisplayName(null), '');

  // The form field shows and stores only the name.
  assert.equal(servantBareName('SDD Hno Azael Tapia'), 'Azael Tapia');
  assert.equal(servantBareName('Hno Azael Tapia'), 'Azael Tapia');
  assert.equal(servantBareName('Azael Tapia'), 'Azael Tapia');
  assert.equal(servantBareName('Hernán Hnos'), 'Hernán Hnos');
  assert.equal(servantBareName(''), '');
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

test('the printed QR page escapes its text and carries the code as vector', () => {
  const { buildQrPath } = load('himnario/utils/qrPath.ts');
  const { qrPrintHtml } = load('himnario/utils/qrPrint.ts');
  const qr = buildQrPath('https://himnarioebp.com/hymn/315%20A/');
  const html = qrPrintHtml({
    title: 'Roca <de> la Eternidad & "más"',
    subtitle: 'Himno 315 A',
    hint: 'Escanea este código',
    brand: 'Himnario El Buen Pastor',
    qr,
  });
  assert.ok(html.includes('Roca &lt;de&gt; la Eternidad &amp; &quot;más&quot;'));
  assert.ok(!html.includes('<de>'));
  assert.ok(html.includes(`viewBox="0 0 ${qr.extent} ${qr.extent}"`));
  assert.ok(html.includes(`<path d="${qr.path}"`));
  assert.ok(!html.includes('<img'), 'the code must be inline SVG, not a fetched image');
});

test("a hymn's web QR link is also one the app's scanner opens as that hymn", () => {
  // Same address ShareSheet builds, and the same match app/churches.tsx applies.
  const hymnUrl = (id) => `https://himnarioebp.com/hymn/${encodeURIComponent(String(id))}/`;
  const scanHymn = (raw) => {
    const m = raw.match(/\/hymn\/([a-zA-Z0-9%_-]+)/i);
    return m ? decodeURIComponent(m[1]) : null;
  };
  assert.equal(scanHymn(hymnUrl(243)), '243');
  assert.equal(scanHymn(hymnUrl('315 A')), '315 A');
  assert.equal(scanHymn(hymnUrl('E12')), 'E12');
});

test('distances show miles and kilometres together', () => {
  const { formatDistance } = load('himnario/utils/churchMapUtils.ts');
  assert.equal(formatDistance(38), '38 mi (61 km)');
  assert.equal(formatDistance(3.2), '3.2 mi (5.1 km)');
  assert.equal(formatDistance(7), '7.0 mi (11 km)');
  assert.equal(formatDistance(0.05), '< 0.2 mi (< 0.3 km)');
});

test('"near me" picks the closest church, including across the date line', () => {
  const { nearestIndex } = load('himnario/utils/churchMapUtils.ts');
  const merced = { lat: 37.33, lng: -120.46 };
  const churches = [
    { lat: 19.43, lng: -99.13 },   // Mexico City
    { lat: 37.7361, lng: -120.9387 }, // Riverbank
    { lat: 34.05, lng: -118.24 },  // Los Angeles
  ];
  assert.equal(nearestIndex(merced, churches), 1);
  assert.equal(nearestIndex(merced, []), -1);
  assert.equal(nearestIndex(merced, [churches[0]]), 0);
  assert.equal(nearestIndex({ lat: 0, lng: 179.5 }, [{ lat: 0, lng: 170 }, { lat: 0, lng: -179.5 }]), 1);
});

test('"Más gustados" keeps only liked hymns, most-liked first, ties in hymnal order', () => {
  const { rankByLikes, parseTopHymns, hymnSlug } = load('himnario/utils/hymnRanking.ts');
  assert.equal(hymnSlug('315 A'), '315-a');
  assert.equal(hymnSlug('E12'), 'e12');
  assert.equal(hymnSlug(7), '7');

  const likes = parseTopHymns({
    hymns: [
      { hymnId: '7', likesCount: 3 },
      { hymnId: '315-a', likesCount: 5 },
      { hymnId: '2', likesCount: 3 },
      { hymnId: 'bad', likesCount: 'many' },
      { hymnId: '9', likesCount: 0 },
      { likesCount: 4 },
    ],
  });
  assert.deepEqual(likes, { 7: 3, '315-a': 5, 2: 3 });
  assert.deepEqual(parseTopHymns(null), {});
  assert.deepEqual(parseTopHymns({ hymns: 'nope' }), {});

  const results = [1, 2, 7, 9, '315 A'].map((id) => ({ hymn: { id }, snippet: '' }));
  const ranked = rankByLikes(results, likes);
  assert.deepEqual(ranked.map((r) => [r.hymn.id, r.likes]), [['315 A', 5], [2, 3], [7, 3]]);
  assert.deepEqual(rankByLikes(results, {}), []);
});

test('"member since" shows month and year in the app language, and nothing for bad input', () => {
  const { memberSinceLabel, parseFriendStatus, parseFriendLists } = load('himnario/utils/friends.ts');
  assert.equal(memberSinceLabel('2026-11', true), 'Miembro desde noviembre de 2026');
  assert.equal(memberSinceLabel('2026-11', false), 'Member since November 2026');
  assert.equal(memberSinceLabel('2027-01', true), 'Miembro desde enero de 2027');
  for (const bad of [null, undefined, '', '2026', '2026-13', '2026-00', '2026-11-22', 'nov 2026']) {
    assert.equal(memberSinceLabel(bad, true), '');
  }

  assert.equal(parseFriendStatus('friends'), 'friends');
  assert.equal(parseFriendStatus('incoming'), 'incoming');
  assert.equal(parseFriendStatus('admin'), null);
  assert.equal(parseFriendStatus(undefined), null);

  // A server without the feature, or a malformed reply, reads as empty lists.
  assert.deepEqual(parseFriendLists(null), { friends: [], incoming: [], outgoing: [] });
  assert.deepEqual(parseFriendLists({ friends: 'x', incoming: [{ id: 1 }] }), { friends: [], incoming: [], outgoing: [] });
  const parsed = parseFriendLists({
    friends: [{ id: 'u1', name: 'Ana', initials: 'A', memberSince: '2026-11', churchName: 'IDDV El Buen Pastor — Riverbank', badgeVerified: 1 }],
  });
  assert.equal(parsed.friends[0].name, 'Ana');
  assert.equal(parsed.friends[0].churchName, 'IDDV El Buen Pastor — Riverbank');
  assert.equal(parsed.friends[0].badgeVerified, false); // only a real boolean counts
  assert.equal(parsed.friends[0].ministry, null);
});
