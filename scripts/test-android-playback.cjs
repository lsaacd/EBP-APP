// Run from the repository root: node --test scripts/test-android-playback.cjs
// Exercises the real TS controller/service adapter with native dependencies replaced in memory.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const appRequire = createRequire(path.resolve(__dirname, '../himnario/package.json'));
const ts = appRequire('typescript');

function loadTS(relative, dependencies = {}) {
  const filename = path.resolve(__dirname, '../himnario', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', source)(name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected native dependency: ${name}`);
  }, mod, mod.exports);
  return mod.exports;
}

const core = loadTS('audio/android-playback-controller.ts');

function fixture() {
  let playing = false;
  const loads = [], errors = [];
  const driver = {
    prepare: async () => {},
    load: async id => { loads.push(id); await new Promise(resolve => setImmediate(resolve)); },
    play: async () => { playing = true; },
    pause: async () => { playing = false; },
    reset: async () => { playing = false; },
    seek: async () => {},
    getPlayWhenReady: async () => playing,
    setRepeatOne: async () => {},
    hasAudio: id => ['1', '2', '4', 'E1', 'E2'].includes(id),
    collection: id => id.startsWith('E') ? ['E1', 'E2'] : ['1', '2', '3', '4'],
    report: error => errors.push(error),
  };
  return { driver, loads, errors, player: core.createAndroidPlaybackController(driver) };
}

test('background skip works after the UI unsubscribes, and reopening does not restart audio', async () => {
  const { player, loads } = fixture();
  const unsubscribe = player.subscribe(() => {});
  await player.open('1'); unsubscribe();
  await player.next();
  assert.equal(player.getSnapshot().currentHymnId, '2');
  await player.open('2');
  assert.deepEqual(loads, ['1', '2']);
});

test('rapid skips serialize loading and skip recordings that are unavailable', async () => {
  const { player, loads } = fixture();
  await player.open('1');
  await Promise.all([player.next(), player.next()]);
  assert.deepEqual(loads, ['1', '2', '4']);
  assert.equal(player.getSnapshot().currentHymnId, '4');
});

test('playlists wrap and E-prefixed collections remain separate', async () => {
  const { player } = fixture();
  await player.open('1', ['4', '3', '1']);
  await player.next();
  assert.equal(player.getSnapshot().currentHymnId, '4');
  await player.select('E1', null);
  await player.next();
  assert.equal(player.getSnapshot().currentHymnId, 'E2');
  await player.next();
  assert.equal(player.getSnapshot().currentHymnId, 'E2');
});

test('failed setup is visible and the same hymn can be retried', async () => {
  const { player, driver, errors } = fixture();
  let attempts = 0;
  driver.prepare = async () => { if (++attempts === 1) throw new Error('foreground setup failed'); };
  await player.open('1');
  assert.ok(player.getSnapshot().error);
  assert.equal(player.getSnapshot().isLoading, false);
  await player.open('1');
  assert.equal(attempts, 2);
  assert.equal(player.getSnapshot().error, null);
  assert.equal(player.getSnapshot().isPlaying, true);
  assert.equal(errors.length, 1);
});

test('interruption resumes only previously playing audio and permanent loss stays paused', async () => {
  const { player } = fixture();
  await player.open('1');
  await player.pause();
  await player.interrupt({ paused: true, permanent: false });
  await player.interrupt({ paused: false, permanent: false });
  assert.equal(player.getSnapshot().isPlaying, false);
  await player.play();
  await player.interrupt({ paused: true, permanent: false });
  await player.interrupt({ paused: false, permanent: false });
  assert.equal(player.getSnapshot().isPlaying, true);
  await player.interrupt({ paused: true, permanent: true });
  await player.interrupt({ paused: false, permanent: false });
  assert.equal(player.getSnapshot().isPlaying, false);
});

test('repeat-all advances the app collection instead of looping the single native queue item', async () => {
  const { player, driver } = fixture();
  const repeats = [];
  driver.setRepeatOne = async enabled => { repeats.push(enabled); };
  await player.open('4');
  await player.cycleRepeat(); // all
  await player.ended();
  assert.equal(player.getSnapshot().currentHymnId, '1');
  assert.ok(repeats.every(enabled => enabled === false));
  await player.cycleRepeat(); // one
  assert.equal(repeats.at(-1), true);
});

test('clear during loading runs last and leaves no active hymn', async () => {
  const { player } = fixture();
  await Promise.all([player.open('1'), player.clear()]);
  assert.equal(player.getSnapshot().currentHymnId, null);
  assert.equal(player.getSnapshot().isPlaying, false);
});

test('native adapter registers each notification handler once and retries a failed setup', async () => {
  const events = new Map();
  let attempts = 0, resets = 0, activeId = null, playing = false;
  const constants = Object.fromEntries(['RemotePlay', 'RemotePause', 'RemoteStop', 'RemoteNext', 'RemotePrevious', 'RemoteSeek', 'RemoteDuck', 'PlaybackQueueEnded', 'PlaybackError', 'PlaybackState'].map(name => [name, name]));
  const native = {
    async setupPlayer() { if (++attempts === 1) throw { code: 'android_cannot_setup_player_in_background' }; },
    updateOptions: async () => {},
    async reset() { resets++; activeId = null; playing = false; },
    async add(track) { activeId = track.id; },
    async play() { playing = true; }, async pause() { playing = false; },
    seekTo: async () => {}, getPlayWhenReady: async () => playing, setRepeatMode: async () => {},
    addEventListener(event, handler) {
      assert.ok(!events.has(event), `Duplicate handler: ${event}`);
      events.set(event, handler);
    },
  };
  const adapter = loadTS('audio/android-player.ts', {
    'react-native-track-player': { default: native, __esModule: true, Event: constants, Capability: {}, RepeatMode: {}, AppKilledPlaybackBehavior: {}, State: {} },
    'expo-asset': { Asset: { fromModule: () => ({ localUri: 'file:///audio.m4a' }) } },
    '../data/alabanzasPaginas': { hymnsData: [{ id: '1' }, { id: '2' }], estribillosData: [] },
    '../data/audioRegistry': { getHymnAudio: () => 1, hasHymnAudio: () => true },
    './android-playback-controller': core,
    '../assets/images/EBP_HYMN_COVER.png': 1,
  });
  adapter.registerAndroidPlaybackService(); adapter.registerAndroidPlaybackService();
  await adapter.androidPlayer.open('1');
  assert.ok(adapter.androidPlayer.getSnapshot().error);
  await adapter.androidPlayer.open('1');
  assert.equal(attempts, 2);
  await events.get('RemotePause')(); assert.equal(playing, false);
  await events.get('RemotePlay')(); assert.equal(playing, true);
  await events.get('RemoteNext')(); assert.equal(activeId, '2');
  await events.get('RemotePrevious')(); assert.equal(activeId, '1');
  await events.get('RemoteStop')(); assert.equal(activeId, null);
  assert.ok(resets >= 4);
});
