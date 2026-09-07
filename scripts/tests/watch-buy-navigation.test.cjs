const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(
  path.resolve(__dirname, "../../src/features/watchAndBuy/navigation.ts"),
  "utf8",
);
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { URL, exports: exportsObject },
);

const { getNextActiveStory, getReelShareUrl, getSnappedReelIndex } =
  exportsObject;

test("snapped reel index follows the visible reel and stays in bounds", () => {
  assert.equal(getSnappedReelIndex(0, 800, 4), 0);
  assert.equal(getSnappedReelIndex(799, 800, 4), 1);
  assert.equal(getSnappedReelIndex(2600, 800, 4), 3);
  assert.equal(getSnappedReelIndex(0, 0, 4), null);
});

test("story completion advances to the next active profile", () => {
  const stories = [
    { profile: { id: 1, has_active_status: true } },
    { profile: { id: 2, has_active_status: false } },
    { profile: { id: 3, has_active_status: true } },
  ];

  assert.equal(getNextActiveStory(stories, 1).profile.id, 3);
  assert.equal(getNextActiveStory(stories, 3), null);
  assert.equal(getNextActiveStory(stories, 99).profile.id, 1);
});

test("reel share URLs deep-link to the selected slug", () => {
  assert.equal(
    getReelShareUrl("https://shop.example.com/catalog", "reel/with spaces"),
    "https://shop.example.com/watch-and-buy/?slug=reel%2Fwith+spaces",
  );
});
