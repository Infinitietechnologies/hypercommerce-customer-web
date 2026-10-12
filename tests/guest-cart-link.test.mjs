import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/features/cartSharing/guestCartLink.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
const location = { origin: "https://shop.example" };
runInNewContext(output, {
  exports, URL, TextEncoder, TextDecoder, btoa, atob,
  window: { location },
});

const { createGuestCartUrl, parseGuestCartLink } = exports;

test("guest cart link preserves product, variant, quantity, and addon identifiers", () => {
  const url = createGuestCartUrl([{
    slug: "café-maker",
    product_variant_id: 42,
    store_id: 7,
    quantity: 2,
    addons: [{ addon_group_id: 3, addon_item_id: 9 }],
  }]);
  assert.equal(new URL(url).origin, "https://shop.example");
  const items = parseGuestCartLink(new URL(url).searchParams.get("guest"));
  assert.equal(items.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(items[0])), {
    slug: "café-maker",
    variantId: 42,
    storeId: 7,
    quantity: 2,
    addons: [{ groupId: 3, itemId: 9 }],
  });
});

test("guest cart link follows the current customer site origin", () => {
  location.origin = "http://localhost:3000";
  try {
    const url = createGuestCartUrl([{
      slug: "lamp",
      product_variant_id: 1,
      store_id: 2,
      quantity: 1,
    }]);
    assert.equal(new URL(url).origin, "http://localhost:3000");
  } finally {
    location.origin = "https://shop.example";
  }
});

test("guest cart links reject malformed item identifiers", () => {
  const encode = (payload) => btoa(JSON.stringify(payload)).replace(/=+$/, "");
  assert.equal(parseGuestCartLink(encode({ v: 1, i: [{ s: "lamp", v: -1, r: 1, q: 1, a: [] }] })), null);
  assert.equal(parseGuestCartLink(encode({ v: 1, i: [{ s: "lamp", v: 1, r: 1, q: 0, a: [] }] })), null);
  assert.equal(parseGuestCartLink("not-base64"), null);
});
