import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const wrapper = ({ children }) => React.createElement("div", null, children);
const mocks = {
  "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
  "@iconify/react": { Icon: () => null },
  "@/contexts/SettingsContext": { useSettings: () => ({ systemSettings: {} }) },
  "@/helpers/imageUpload": {},
  "@/helpers/getters": { getFormattedDate: (value) => value },
  "@/services/orders": {},
  "@/components/ui": {
    Button: wrapper, Sheet: wrapper, Textarea: () => null, SelectItem: wrapper,
    Select: ({ label, selectedKeys, children }) => React.createElement("div", {
      "data-label": label, "data-selected": selectedKeys.join(","),
    }, children),
  },
};
const output = ts.transpileModule(readFileSync(new URL("../src/views/OrderDetailView/ReturnSheet.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
runInNewContext(output, { exports, require: (name) => mocks[name] ?? require(name) });
const render = (quantity) => renderToStaticMarkup(React.createElement(exports.default, {
  isOpen: true, onClose: () => {}, item: { id: 1, title: "Product", quantity },
}));

test("single-unit returns have no quantity selector", () => {
  assert.doesNotMatch(render(1), /data-label="quantity"/);
});

test("multi-unit returns offer quantities up to the ordered amount and default to one", () => {
  assert.match(render(3), /data-label="quantity" data-selected="1"><div>1<\/div><div>2<\/div><div>3<\/div>/);
});
