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
  new Function('module', 'exports', compiled)(loaded, loaded.exports);
  return loaded.exports;
};
const { parseServiceTimes } = load('himnario/utils/churchSchedule.ts');
const { sheetSnapTarget } = load('himnario/utils/gestureMotion.ts');

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
