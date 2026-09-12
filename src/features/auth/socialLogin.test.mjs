import assert from "node:assert/strict";
import test from "node:test";

import { resolveSocialLoginProviders } from "./socialLogin.ts";

test("hides social login providers while settings are unavailable", () => {
  assert.deepEqual(resolveSocialLoginProviders(null), {
    google: false,
    apple: false,
  });
});

test("hides providers disabled by the admin", () => {
  assert.deepEqual(
    resolveSocialLoginProviders({ googleLogin: false, appleLogin: false }),
    { google: false, apple: false },
  );
});

test("shows only providers enabled by the admin", () => {
  assert.deepEqual(
    resolveSocialLoginProviders({ googleLogin: true, appleLogin: false }),
    { google: true, apple: false },
  );
});
