import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/services/cart.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const calls = [];
const result = { success: true, data: { token: "shared-123" } };
const fallback = { success: false, data: null };
const api = {
  get: async (...args) => { calls.push(["GET", ...args]); return { data: result }; },
  post: async (...args) => { calls.push(["POST", ...args]); return { data: result }; },
};
const exports = {};
runInNewContext(output, {
  exports,
  require: (id) => id === "./client" ? { api } : { fallbackApiRes: fallback },
});

test("cart sharing uses the three authenticated API routes with no selection body", async () => {
  calls.length = 0;
  assert.equal(await exports.createCartShare(), result);
  assert.equal(await exports.getSharedCart("a/b"), result);
  assert.equal(await exports.importSharedCart("a/b"), result);
  assert.deepEqual(calls, [
    ["POST", "/user/cart/share"],
    ["GET", "/user/cart/shared-lists/a%2Fb"],
    ["POST", "/user/cart/shared-lists/a%2Fb/import"],
  ]);
});

test("cart sharing returns the standard failure response when the API rejects a request", async () => {
  api.post = async () => { throw new Error("Unauthorized"); };
  assert.equal(await exports.createCartShare(), fallback);
});
