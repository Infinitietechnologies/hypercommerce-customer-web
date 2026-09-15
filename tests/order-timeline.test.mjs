import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/views/OrderDetailView/timeline.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(output, { exports });
const { compactTimeline, flattenTimeline } = exports;
const event = (code, done, at) => ({ code, label: code, done, at });
const step = (key, done, at, events = []) => ({ key, label: key, done, at, events });

test("a requested return uses the request label and date and becomes current", () => {
  const result = compactTimeline([
    step("delivered", true, "delivery"),
    step("returned", false, "request", [
      event("return_requested", true, "request"),
      event("return_received", false, null),
    ]),
    step("refunded", false, null),
  ]);
  assert.equal(result[1].label, "return_requested");
  assert.equal(result[1].at, "request");
  assert.equal(result[1].current, true);
  assert.equal(result[0].current, false);
  assert.equal(result[2].at, null);
});

test("received return uses only its receipt date", () => {
  const [result] = compactTimeline([step("returned", true, "request", [
    event("return_requested", true, "request"),
    event("return_received", true, "receipt"),
  ])]);
  assert.equal(result.label, "returned");
  assert.equal(result.at, "receipt");
});

test("pending and failed refunds use the actual event without claiming completion", () => {
  for (const code of ["refund_initiated", "refund_failed"]) {
    const [result] = compactTimeline([step("refunded", false, null, [
      event(code, true, "event-time"),
      event("refund_issued", false, null),
    ])]);
    assert.equal(result.label, code);
    assert.equal(result.at, "event-time");
    assert.equal(result.done, false);
    assert.equal(result.current, true);
  }
});

test("future stages hide dates and unpaid cancellation keeps placed", () => {
  const result = compactTimeline([
    step("placed", true, "placed"),
    step("confirmed", false, null),
    step("cancelled", true, "cancelled"),
    step("refunded", false, "incorrect-future-date"),
  ]);
  assert.equal(result[0].key, "placed");
  assert.equal(result.length, 3);
  assert.equal(result[2].at, null);
});

test("completed refunds retain their completion date and detailed events", () => {
  const stages = [step("refunded", true, "paid", [
    event("refund_initiated", true, "requested"),
    event("refund_issued", true, "paid"),
  ])];
  assert.equal(compactTimeline(stages)[0].at, "paid");
  assert.equal(flattenTimeline(stages).length, 2);
  assert.equal(compactTimeline(undefined).length, 0);
});
