import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const Button = () => null;
const CancelItemSheet = () => null;
const ReturnSheet = () => null;
const stub = () => null;
const router = { query: { item: "1" }, pathname: "/orders/[slug]", push: () => {}, replace: () => {} };
const state = [];
let stateIndex = 0;
const hooks = {
  useMemo: (compute) => compute(),
  useState: (initial) => {
    const index = stateIndex++;
    if (!(index in state)) state[index] = initial;
    return [state[index], (value) => { state[index] = value; }];
  },
};
const ui = {
  Button, Card: stub, Chip: stub, Link: stub, Sheet: stub,
  useDisclosure: () => ({ isOpen: false, onOpen: () => {}, onClose: () => {} }),
  toastError: () => {}, toastSuccess: () => {},
};
const mocks = {
  react: hooks,
  "next/router": { useRouter: () => router },
  "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
  "@iconify/react": { Icon: stub },
  "@/components/ui": ui,
  "@/routes/api": { reorderOrder: () => {} },
  "@/components/custom/MyBreadcrumbs": { default: stub },
  "@/SEO/PageHead": { default: stub },
  "@/components/Functional/Price": { useCurrency: () => ({ formatWith: (value) => String(value) }) },
  "@/helpers/getters": { getFormattedDate: (value) => value },
  "@/config/constants": { orderStatusColorMap: () => "default" },
  "./CancelItemSheet": { default: CancelItemSheet },
  "@/components/Modals/RatingModal": { default: stub },
  "@/components/Modals/OrderItemReviewCard": { default: stub },
  "./OrderAttachments": { default: stub },
  "./ShippingInfo": { default: stub },
  "./DeliveryInfo": { default: stub },
  "./ReturnSheet": { default: ReturnSheet },
  "./timeline": { backendTimelineViews: () => ({ main: [], details: [] }), getItemTimeline: () => [], timelineLabels: {} },
  "./OrderTimeline": { default: stub },
  "./ItemAdjustmentDetails": { default: stub },
  "./ItemQuantityDetails": { default: stub },
  "./OrderSummaryCard": { default: stub },
};
const output = ts.transpileModule(readFileSync(new URL("../src/views/OrderDetailView/index.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
runInNewContext(output, { exports, require: (name) => mocks[name] ?? require(name) });
const Page = exports.default;
const order = {
  id: 7, created_at: "2026-09-19", subtotal: 20, final_total: 20,
  items: [
    { id: 1, title: "First", quantity: 1, subtotal: 10, can_cancel: true, can_return: false },
    { id: 2, title: "Second", quantity: 1, subtotal: 10, can_cancel: false, can_return: true },
  ],
};
const descendants = function* (node) {
  if (Array.isArray(node)) {
    for (const child of node) yield* descendants(child);
  } else if (React.isValidElement(node)) {
    yield node;
    yield* descendants(node.props.children);
  }
};
const render = (itemId) => {
  router.query.item = String(itemId);
  stateIndex = 0;
  return [...descendants(Page({ order }))];
};
const action = (tree, name) => tree.find((node) => node.type === Button && node.props.children === name);

test("return appears only for the selected eligible item", () => {
  state.length = 0;
  assert.equal(action(render(1), "return"), undefined);
  assert.ok(action(render(2), "return"));
});

test("cancel stays bound to the item selected when opened", () => {
  state.length = 0;
  action(render(1), "cancel").props.onPress();
  const sheet = render(2).find((node) => node.type === CancelItemSheet);
  assert.equal(sheet.props.item.id, 1);
  assert.equal(action(render(2), "cancel"), undefined);
});

test("return stays bound to the item selected when opened", () => {
  state.length = 0;
  action(render(2), "return").props.onPress();
  const sheet = render(1).find((node) => node.type === ReturnSheet);
  assert.equal(sheet.props.item.id, 2);
});
