import assert from "node:assert/strict";
import test from "node:test";

import { resolveSmsGateway } from "./smsGateway.ts";

test("uses the explicitly selected custom gateway", () => {
  assert.equal(
    resolveSmsGateway({
      smsGateway: "custom",
      customSms: true,
      firebase: true,
    }),
    "custom",
  );
});

test("uses the explicitly selected Firebase gateway", () => {
  assert.equal(
    resolveSmsGateway({
      smsGateway: "firebase",
      customSms: true,
      firebase: true,
    }),
    "firebase",
  );
});

test("keeps Laravel's custom-first fallback for legacy settings", () => {
  assert.equal(
    resolveSmsGateway({ customSms: true, firebase: true }),
    "custom",
  );
});

test("does not silently select Firebase while settings are unavailable", () => {
  assert.equal(resolveSmsGateway(null), null);
});
