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
const {
  tabReleaseTarget,
  shouldCollapsePlayer,
  miniPlayerFrame,
  clampMiniPlayerDrag,
  miniPlayerSwipeDirection,
  clampArtworkDrag,
  artworkSwipeDirection,
} = loaded.exports;

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
test('mini-player horizontal track swipe commits past distance or velocity threshold and cancels on reversal', () => {
  // Partial drag without flick cancels (0)
  assert.equal(miniPlayerSwipeDirection(-40, 0, 210, true, true), 0);
  assert.equal(miniPlayerSwipeDirection(40, 0, 210, true, true), 0);
  // Long drag left commits next (+1); long drag right commits previous (-1)
  assert.equal(miniPlayerSwipeDirection(-70, 0, 210, true, true), 1);
  assert.equal(miniPlayerSwipeDirection(70, 0, 210, true, true), -1);
  // Deliberate flick left or right commits
  assert.equal(miniPlayerSwipeDirection(-25, -700, 210, true, true), 1);
  assert.equal(miniPlayerSwipeDirection(25, 700, 210, true, true), -1);
  // Direction reversal cancels even after a long drag
  assert.equal(miniPlayerSwipeDirection(-95, 500, 210, true, true), 0);
  assert.equal(miniPlayerSwipeDirection(95, -500, 210, true, true), 0);
});
test('mini-player horizontal track swipe respects first/last boundaries and rubber-bands', () => {
  // Cannot swipe right to previous when hasPrev is false
  assert.equal(miniPlayerSwipeDirection(100, 900, 210, false, true), 0);
  // Cannot swipe left to next when hasNext is false
  assert.equal(miniPlayerSwipeDirection(-100, -900, 210, true, false), 0);
  // Rubber-band resistance at boundaries vs full slot range when neighbor exists
  assert.equal(clampMiniPlayerDrag(100, 200, false, true), 25);
  assert.equal(clampMiniPlayerDrag(-100, 200, true, false), -25);
  assert.equal(clampMiniPlayerDrag(-250, 200, true, true), -200);
  assert.equal(clampMiniPlayerDrag(250, 200, true, true), 200);
});
test('expanded player artwork swipe commits past 25% distance or fast flick and rubber-bands at edges', () => {
  // Partial drag without flick cancels
  assert.equal(artworkSwipeDirection(-50, 0, 320, true, true), 0);
  assert.equal(artworkSwipeDirection(50, 0, 320, true, true), 0);
  // Long drag commits next (+1) or previous (-1)
  assert.equal(artworkSwipeDirection(-95, 0, 320, true, true), 1);
  assert.equal(artworkSwipeDirection(95, 0, 320, true, true), -1);
  // Deliberate fast flick commits
  assert.equal(artworkSwipeDirection(-30, -680, 320, true, true), 1);
  assert.equal(artworkSwipeDirection(30, 680, 320, true, true), -1);
  // Opposite velocity cancels
  assert.equal(artworkSwipeDirection(-120, 420, 320, true, true), 0);
  assert.equal(artworkSwipeDirection(120, -420, 320, true, true), 0);
  // Respects boundary flags & rubber-bands
  assert.equal(artworkSwipeDirection(140, 800, 320, false, true), 0);
  assert.equal(artworkSwipeDirection(-140, -800, 320, true, false), 0);
  assert.equal(clampArtworkDrag(100, 300, false, true), 22);
  assert.equal(clampArtworkDrag(-100, 300, true, false), -22);
  assert.equal(clampArtworkDrag(-400, 300, true, true), -300);
  assert.equal(clampArtworkDrag(400, 300, true, true), 300);
});
