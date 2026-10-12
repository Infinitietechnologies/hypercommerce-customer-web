import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/features/cartSharing/sharedCartPayload.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
const location = { origin: "https://shop.example" };
runInNewContext(output, { exports, URL, window: { location } });

const { getSharedCartToken, getSharedCartUrl, getSharedCartTokenFromPath, getSharedCartPreview } = exports;

test("extracts a token from the documented share operation's possible link fields", () => {
  assert.equal(getSharedCartToken({ token: "abc-123" }), "abc-123");
  assert.equal(getSharedCartToken({ share_url: "https://api.example/user/cart/shared-lists/abc-123" }), "abc-123");
  assert.equal(getSharedCartToken({ data: { shareUrl: "https://shop.example/shared-cart?token=abc-123" } }), "abc-123");
  assert.equal(getSharedCartToken(null), null);
});

test("publishes the link on the current customer site origin", () => {
  location.origin = "http://localhost:3000";
  try {
    assert.equal(getSharedCartUrl("abc-123"), "http://localhost:3000/cart/shared-lists/abc-123/");
    assert.equal(getSharedCartUrl("a/b"), "http://localhost:3000/cart/shared-lists/a%2Fb/");
  } finally {
    location.origin = "https://shop.example";
  }
});

test("reads tokens from the shared cart pathname", () => {
  assert.equal(getSharedCartTokenFromPath("/cart/shared-lists/abc-123/"), "abc-123");
  assert.equal(getSharedCartTokenFromPath("/cart/shared-lists/a%2Fb"), "a/b");
  assert.equal(getSharedCartTokenFromPath("/shared-cart/"), null);
  assert.equal(getSharedCartTokenFromPath("/cart/shared-lists/%ZZ/"), null);
});

test("normalizes shared cart products for the recipient preview", () => {
  const preview = getSharedCartPreview({
    shared_list: {
      shared_by: { name: "Ari" },
      items: [{ id: 1, quantity: 2, product: { name: "Lamp", image: "/lamp.png", slug: "lamp" }, variant: { title: "Blue" }, store: { name: "Home" } }],
    },
  });
  assert.equal(preview.ownerName, "Ari");
  assert.equal(preview.totalQuantity, 2);
  assert.equal(preview.items[0].name, "Lamp");
  assert.equal(preview.items[0].variant, "Blue");
});

test("rejects a payload when it cannot display every shared item", () => {
  assert.equal(getSharedCartPreview({ items: [{ quantity: 2 }] }), null);
  assert.equal(getSharedCartPreview({ unrelated: [] }), null);
  assert.equal(getSharedCartPreview({ items: [] }).items.length, 0);
});
