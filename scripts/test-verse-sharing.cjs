const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("../himnario/node_modules/typescript");
const moduleSource = ts.transpileModule(
  fs.readFileSync("himnario/utils/verseSharing.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;
const mod = { exports: {} };
new Function("module", "exports", moduleSource)(mod, mod.exports);
const { waitForVerseShareAssets } = mod.exports;
test("share waits for both photo and logo decode, including a slow first share", async () => {
  let clock = 0,
    photo = false,
    logo = false;
  await waitForVerseShareAssets(
    () => photo && logo,
    () => true,
    {
      now: () => clock,
      wait: async (ms) => {
        clock += ms;
        photo = clock >= 175;
        logo = clock >= 350;
      },
    },
  );
  assert.equal(clock, 350);
  assert.equal(photo, true);
  assert.equal(logo, true);
});
test("changing verse/background cancels export even when an earlier image reports ready", async () => {
  let clock = 0;
  await assert.rejects(
    () =>
      waitForVerseShareAssets(
        () => clock >= 50,
        () => clock < 50,
        {
          now: () => clock,
          wait: async (ms) => {
            clock += ms;
          },
        },
      ),
    /verse_share_changed/,
  );
});
test("a missing decode times out instead of exporting an incomplete card", async () => {
  let clock = 0;
  await assert.rejects(
    () =>
      waitForVerseShareAssets(
        () => false,
        () => true,
        {
          timeoutMs: 100,
          now: () => clock,
          wait: async (ms) => {
            clock += ms;
          },
        },
      ),
    /verse_share_not_ready/,
  );
  assert.equal(clock, 100);
});
test("cached assets can export immediately without an artificial delay", async () => {
  await waitForVerseShareAssets(
    () => true,
    () => true,
    {
      wait: async () => {
        throw Error("unexpected delay");
      },
    },
  );
});
