const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../himnario/node_modules/typescript');

const filename = path.join(__dirname, '../himnario/utils/gestureMotion.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { tabReleaseTarget, shouldCollapsePlayer, miniPlayerFrame } = loaded.exports;

test('slow partial swipes cancel; completed drags select either neighbor', () => {
  assert.equal(tabReleaseTarget(1.35, 0, 1, 4), 1);
  assert.equal(tabReleaseTarget(1.65, 0, 1, 4), 2);
  assert.equal(tabReleaseTarget(0.35, 0, 1, 4), 0);
});
test('flicks advance, direction reversal returns to the original tab', () => {
  assert.equal(tabReleaseTarget(1.25, 2, 1, 4), 2);
  assert.equal(tabReleaseTarget(1.6, -2, 1, 4), 1);
});
test('large velocity cannot skip tabs or escape the first/last page', () => {
  assert.equal(tabReleaseTarget(1.1, 100, 1, 4), 2);
  assert.equal(tabReleaseTarget(1.1, -100, 1, 4), 0);
  assert.equal(tabReleaseTarget(0, -100, 0, 4), 0);
  assert.equal(tabReleaseTarget(3, 100, 3, 4), 3);
});
test('player short drags and accidental velocity without movement do not dismiss', () => {
  assert.equal(shouldCollapsePlayer(70, 0, 700), false);
  assert.equal(shouldCollapsePlayer(4, 1600, 700), false);
});
test('player long drags or deliberate flicks minimize; upward reversal cancels', () => {
  assert.equal(shouldCollapsePlayer(220, 0, 700), true);
  assert.equal(shouldCollapsePlayer(40, 1000, 700), true);
  assert.equal(shouldCollapsePlayer(350, -900, 700), false);
});
test('collapse threshold scales to a smaller phone', () => {
  assert.equal(shouldCollapsePlayer(150, 0, 500), true);
  assert.equal(shouldCollapsePlayer(150, 0, 850), false);
});
test('iOS endpoint rests directly above the 49pt bar and home indicator', () => {
  const frame = miniPlayerFrame(390, 844, 49 + 34, false);
  assert.equal(frame.x, 20);
  assert.equal(frame.width, 350);
  assert.equal(frame.y + frame.height, 844 - 83);
});
test('Android endpoint honors its larger cover, edge bar and gesture inset', () => {
  const frame = miniPlayerFrame(412, 915, 64 + 24, true);
  assert.equal(frame.x, 12);
  assert.equal(frame.height, 74);
  assert.equal(frame.y + frame.height, 915 - 88);
  assert.equal(miniPlayerFrame(412, 915, 220, true).y + frame.height, 695);
});
