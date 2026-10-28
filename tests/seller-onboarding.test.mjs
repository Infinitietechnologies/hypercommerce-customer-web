import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/features/seller-onboarding/fields.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
runInNewContext(output, { exports, File, FormData });
const { fieldValue, validateField, appendDynamicFields, registrationErrors } = exports;
const field = (overrides = {}) => ({ key: "in_bank", label: "Bank", type: "text", required: true, placeholder: null, default_value: null, options: [], ...overrides });

test("required, optional, defaults and explicit cleared values follow schema", () => {
  assert.equal(validateField(field(), "  "), "required");
  assert.equal(validateField(field({ required: false }), ""), undefined);
  assert.equal(fieldValue(field({ default_value: "Default" }), {}), "Default");
  assert.equal(fieldValue(field({ default_value: "Default" }), { in_bank: "" }), "");
  assert.equal(fieldValue(field({ default_value: 0, type: "number" }), {}), "0");
  assert.equal(fieldValue(field({ default_value: "https://example.test/a.png", type: "image" }), {}), "");
});

test("numeric fields follow Laravel numeric and maximum rules; text retains leading zeroes", () => {
  for (const value of ["0", "-2", "1.25", "1e2", "1000"]) assert.equal(validateField(field({ type: "number" }), value), undefined);
  for (const value of ["0xff", "Infinity", "oops"]) assert.equal(validateField(field({ type: "number" }), value), "number");
  assert.equal(validateField(field({ type: "number" }), "1000.01"), "numberMax");
  assert.equal(validateField(field(), "00001234567890"), undefined);
  assert.equal(validateField(field(), "x".repeat(1001)), "maxLength");
  assert.equal(validateField(field({ type: "select", options: ["savings"] }), "checking"), "invalidValue");
});

test("image uploads reject PDF, URL strings and oversized files, accepting exact size boundary", () => {
  const imageField = field({ type: "image" });
  assert.equal(validateField(imageField, new File(["pdf"], "proof.pdf", { type: "application/pdf" })), "image");
  assert.equal(validateField(imageField, "https://example.test/proof.jpg"), "image");
  assert.equal(validateField(imageField, new File([new Uint8Array(5120 * 1024)], "proof.png", { type: "image/png" })), undefined);
  assert.equal(validateField(imageField, new File([new Uint8Array(5120 * 1024 + 1)], "proof.png", { type: "image/png" })), "image");
});

test("multipart includes only current schema keys, defaults and binary files in either section", () => {
  const data = new FormData();
  const file = new File(["image"], "bank.webp", { type: "image/webp" });
  const schema = { sections: {
    bank_details: { fields: [field({ key: "bank_image", type: "image" })] },
    business_documents: { fields: [field({ key: "doc_text", default_value: "Default" }), field({ key: "clear_me", default_value: "Default" })] },
  } };
  appendDynamicFields(data, schema, { bank_image: file, clear_me: "", old_country_field: "discard" });
  assert.equal(data.get("dynamic_fields[bank_image]").name, "bank.webp");
  assert.equal(data.get("dynamic_fields[doc_text]"), "Default");
  assert.equal(data.get("dynamic_fields[clear_me]"), "");
  assert.equal(data.get("dynamic_fields[old_country_field]"), null);
  assert.equal(data.get("bank_image"), null);
});

test("errors normalize Laravel errors and API data maps without losing dynamic field paths", () => {
  const errors = registrationErrors({ success: false, errors: { name: ["Name required"], "dynamic_fields.in_bank": ["Invalid bank"], country_iso2: "Invalid country" } });
  assert.equal(errors.sellerName, "Name required");
  assert.equal(errors.country, "Invalid country");
  assert.equal(errors["dynamic_fields.in_bank"], "Invalid bank");
  assert.equal(registrationErrors({ success: false, data: { "dynamic_fields.doc": ["Required"] } })["dynamic_fields.doc"], "Required");
  assert.equal(Object.keys(registrationErrors({ success: false, errors: ["Network error"] })).length, 0);
});
