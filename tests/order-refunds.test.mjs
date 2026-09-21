import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const exports = {};
  const output = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(output, { exports, URL, require: (name) => mocks[name] ?? require(name) });
  return exports;
}
const helpers = load("../src/views/OrderDetailView/refunds.ts");
const timeline = load("../src/views/OrderDetailView/timeline.ts", { "./refunds": helpers });
const { orderAttachment } = load("../src/views/OrderDetailView/attachments.ts");
const Summary = load("../src/views/OrderDetailView/OrderSummaryCard.tsx", {
  "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
  "@/components/ui": { Card: ({ children }) => React.createElement("section", null, children) },
}).default;
const renderSummary = ({ snapshot, current = {}, refunds = [] } = {}) => renderToStaticMarkup(React.createElement(Summary, {
  order: {
    subtotal: String(current.items_total ?? 300),
    delivery_charge: String(current.delivery_charge ?? 0),
    platform_fee: String(current.platform_fee ?? 0),
    cod_fee: String(current.cod_fee ?? 0),
    promo_discount: String(current.promo_discount ?? 0),
    gift_card_discount: String(current.gift_card_discount ?? 0),
    final_total: String(current.order_total ?? 300),
    total_payable: String(current.payable_amount ?? current.order_total ?? 300),
    order_summary: snapshot ? { converted_currency: snapshot } : null,
    refunds,
  },
  formatPrice: (amount) => `INR ${amount}`,
}));

test("unchanged totals show one checkout total without adjustment clutter", () => {
  const html = renderSummary({ snapshot: { items_total: 300, order_total: 300 }, current: { items_total: 300, order_total: 300 } });
  assert.match(html, /orderMoneySummary.checkoutNote/);
  assert.doesNotMatch(html, /orderMoneySummary.updatedTotal|orderMoneySummary.adjustments/);
});

test("changed totals preserve checkout discounts and separate refunds from price changes", () => {
  const html = renderSummary({
    snapshot: { items_total: 300, promo_discount: 30, order_total: 270 },
    current: { items_total: 200, promo_discount: 20, order_total: 180 },
    refunds: [refund({ amount: 90, status: "issued" })],
  });
  assert.match(html, /INR 270/);
  assert.match(html, /INR 180/);
  assert.match(html, /INR -90/);
  assert.match(html, /discountAmount/);
  assert.match(html, /orderMoneySummary.refunded/);
  assert.doesNotMatch(html, /orderMoneySummary.pending/);
});

test("older orders use current values without inventing a checkout snapshot", () => {
  const html = renderSummary({ current: { items_total: 200, order_total: 200 } });
  assert.match(html, /orderMoneySummary.currentNote/);
  assert.match(html, /INR 200/);
  assert.doesNotMatch(html, /orderMoneySummary.checkoutNote|orderMoneySummary.updatedTotal/);
  assert.match(renderSummary(), /INR 300/);
});
const refund = (overrides = {}) => ({
  id: 1, amount: 300, shipping_refund_amount: 0, currency_code: "INR",
  status: "owed", method: "wallet", settled_by_refund_id: null,
  created_at: "2026-09-16T09:00:00Z", issued_at: null,
  items: [{ order_item_id: 10, quantity: 1, amount: 100 }, { order_item_id: 11, quantity: 2, amount: 200 }],
  ...overrides,
});

test("refund details use the selected item allocation, not the order total", () => {
  const [row] = helpers.getItemRefunds([refund()], 10);
  assert.equal(row.quantity, 1);
  assert.equal(row.amount, 100);
  assert.equal(helpers.getItemRefunds([refund()], 99).length, 0);
});

test("settled cancellation obligations resolve payment details without duplication", () => {
  const rows = helpers.getItemRefunds([
    refund({ settled_by_refund_id: 2 }),
    refund({ id: 2, status: "issued", method: "manual", issued_at: "2026-09-16T10:00:00Z", items: [] }),
  ], 10);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, "issued");
  assert.equal(rows[0].method, "manual");
  assert.equal(rows[0].amount, 100);
  assert.equal(rows[0].issued_at, "2026-09-16T10:00:00Z");
});

test("older API responses and orders without refunds are supported", () => {
  assert.equal(helpers.getItemRefunds(undefined, 10).length, 0);
  assert.equal(helpers.getItemRefunds([], 10).length, 0);
});

test("attachments recognize signed PDFs and images and reject executable URLs", () => {
  assert.equal(orderAttachment("https://example.test/prescription.PDF?signature=test").type, "pdf");
  assert.equal(orderAttachment("/files/photo%20one.jpg?token=test").name, "photo one.jpg");
  assert.equal(orderAttachment("/files/photo.jpg?token=test").type, "image");
  assert.equal(orderAttachment("/files/prescription.docx").type, "file");
  assert.equal(orderAttachment("javascript:alert(1)"), null);
});

const progress = (last = 0) => ["placed", "confirmed", "preparing", "shipped", "delivered"].map((key, index) => ({
  key, label: key, done: index <= last, at: index <= last ? `2026-09-16 10:0${index}:00` : null,
  events: [{ code: key === "placed" ? "order_placed" : key === "confirmed" ? "payment_received" : key, label: key, done: index <= last, at: null, is_exception: false }],
}));

test("item changes use a disclosure card rather than a second timeline", () => {
  const Component = load("../src/views/OrderDetailView/ItemAdjustmentDetails.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
    "./refunds": helpers,
    "./ItemReturnDetails": { default: () => null },
    "./ItemRefundDetails": { default: () => null },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Component, {
    item: { id: 10, quantity_summary: { cancelled: 1 } }, refunds: [refund({ status: "issued" })],
    steps: [{ key: "cancelled", events: [], at: null }], formatPrice: String,
  }));
  assert.match(html, /<details/);
  assert.match(html, /orderRefunds.status.issued/);
  assert.doesNotMatch(html, /<ol|data-state/);
});

test("completed terminal markers are green and exceptions have distinct semantics", () => {
  assert.equal(timeline.timelineTone("delivered", true), "completed");
  assert.equal(timeline.timelineTone("refund_1", true), "completed");
  assert.equal(timeline.timelineTone("cancelled", true, true), "cancelled");
  assert.equal(timeline.timelineTone("refund_1", false, true), "failed");
  assert.equal(timeline.timelineTone("return_8_declined", true), "failed");
  assert.equal(timeline.timelineTone("on_hold", true, true), "warning");
});

test("adjustment disclosure shows individual subtotal and discount changes", () => {
  const html = renderSummary({ snapshot: { items_total: 300, promo_discount: 30, order_total: 270 }, current: { items_total: 200, promo_discount: 20, order_total: 180 } });
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
  assert.match(html, /INR -100/);
  assert.match(html, /\+ INR 10/);
});

test("tracking is the canonical source for compact and full website timelines", () => {
  const shipment = { code: "shipment_7_1", label: "Shipped", done: true, at: "2026-09-19T10:00:00+05:30", is_exception: false, meta: { status: "shipped" } };
  const requested = { code: "return_9_requested", label: "Return requested", done: true, at: "2026-09-19T11:00:00+05:30", is_exception: false, meta: { return_id: 9, quantity: 1 } };
  const history = [shipment, requested];
  const milestones = [{ key: "shipped", label: "Shipped", done: true, at: shipment.at, events: [], quantity: 1, completed_quantity: 1 }];
  const result = timeline.backendTimelineViews({
    tracking: { version: 1, milestones, history, exceptions: [] },
  });
  assert.equal(JSON.stringify(result.main), JSON.stringify(milestones));
  assert.equal(JSON.stringify(result.details.map((event) => event.code)), JSON.stringify(["shipment_7_1", "return_9_requested"]));
});

test("cancelled items use backend milestones and aggregate split refunds", () => {
  const history = [
    { code: "order_placed", label: "Placed", done: true, at: "2026-09-19T10:00:00+05:30", is_exception: false },
    { code: "cancelled", label: "Cancelled", done: true, at: null, is_exception: false, meta: { quantity: 2 } },
    { code: "refund_26", label: "Refund processed", done: true, at: "2026-09-19T11:00:00+05:30", is_exception: false, meta: { quantity: 1 } },
    { code: "refund_27", label: "Refund processed", done: true, at: "2026-09-19T11:00:00+05:30", is_exception: false, meta: { quantity: 1 } },
  ];
  const milestones = [
    { key: "placed", label: "Placed", done: true, at: history[0].at, events: [] },
    { key: "confirmed", label: "Confirmed", done: true, at: null, events: [] },
    { key: "cancelled", label: "Cancelled", done: true, at: null, events: [history[1]] },
    { key: "refunded", label: "Refund processed", done: true, at: history[2].at, events: [{ ...history[2], code: "refunded", meta: { quantity: 2 } }] },
  ];
  const result = timeline.backendTimelineViews({
    status: "cancelled", quantity_summary: { current: 0 }, tracking: { version: 1, milestones, history, exceptions: [] },
  });
  assert.equal(JSON.stringify(result.main.map((step) => step.key)), JSON.stringify(["placed", "confirmed", "cancelled", "refunded"]));
  assert.equal(result.main.filter((step) => step.key === "refunded").length, 1);
  assert.equal(result.main.at(-1).events[0].meta.quantity, 2);
  assert.equal(JSON.stringify(result.details.map((event) => event.code)), JSON.stringify(["order_placed", "cancelled", "refund_26", "refund_27"]));
});

test("backend current flags are respected on hold and partial progress", () => {
  const Component = load("../src/views/OrderDetailView/OrderTimeline.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key, values) => values?.defaultValue?.replace("{{count}}", values.count).replace("{{total}}", values.total) || key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
    "./timeline": timeline,
    "./OrderTimeline.module.css": { default: {} },
  }).default;
  const steps = [{ key: "confirmed", done: true, current: false, at: null, events: [] },
    { key: "shipped", done: false, current: false, at: null, events: [], quantity: 3, completed_quantity: 1 }];
  const held = renderToStaticMarkup(React.createElement(Component, { steps }));
  assert.doesNotMatch(held, /aria-current/);
  assert.match(held, /1 of 3/);
  steps[1].current = true;
  assert.match(renderToStaticMarkup(React.createElement(Component, { steps })), /aria-current="step"/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Component, { steps, showQuantity: false })), /1 of 3/);
});

test("split shipment details retain both parcels and their safe tracking links", () => {
  const Component = load("../src/views/OrderDetailView/OrderTimeline.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key, values) => values?.defaultValue?.replace("{{count}}", values.count) || key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
    "./timeline": timeline,
    "./OrderTimeline.module.css": { default: {} },
  }).default;
  const events = ["first", "second"].map((parcel) => ({ code: "shipped", label: "Shipped", done: true, at: null, is_exception: false,
    meta: { quantity: 1, courier: parcel, tracking_id: parcel.toUpperCase(), tracking_url: `https://example.test/${parcel}` } }));
  const html = renderToStaticMarkup(React.createElement(Component, { events }));
  assert.match(html, /first · FIRST/);
  assert.match(html, /second · SECOND/);
  assert.equal((html.match(/Qty: 1/g) || []).length, 2);
  assert.match(html, /href="https:\/\/example.test\/first"/);
  assert.match(html, /href="https:\/\/example.test\/second"/);
  assert.equal((html.match(/rel="noopener noreferrer"/g) || []).length, 2);
  events[0].meta.tracking_url = "javascript:alert(1)";
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Component, { events })), /javascript:/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Component, { events, showQuantity: false })), /Qty:/);
});

test("recorded shipment activity keeps its tracking link in full updates", () => {
  const Component = load("../src/views/OrderDetailView/OrderTimeline.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
    "./timeline": timeline,
    "./OrderTimeline.module.css": { default: {} },
  }).default;
  const history = [{ code: "shipment_42_confirmed", label: "Shipped", done: true, at: "2026-09-19T10:00:00+05:30", is_exception: false,
    meta: { shipment_id: 42, quantity: 1, courier: "UPS", tracking_id: "123", tracking_url: "https://example.test/track/123" } }];
  const { details } = timeline.backendTimelineViews({ tracking: { version: 1, milestones: [], history, exceptions: [] } });
  const html = renderToStaticMarkup(React.createElement(Component, { events: details }));
  assert.match(html, /Shipment #42/);
  assert.match(html, /href="https:\/\/example.test\/track\/123"/);
});

test("full updates distinguish major milestones from quiet carrier scans and place time first", () => {
  const Component = load("../src/views/OrderDetailView/OrderTimeline.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key, i18n: { language: "en-IN" } }) },
    "@/helpers/getters": { getFormattedDate: (_value, _locale, options) => options?.hour ? "3:30 pm" : "19 Sep" },
    "./timeline": timeline,
    "./OrderTimeline.module.css": { default: { timestamp: "timestamp", time: "time", date: "date", majorDot: "majorDot", minorDot: "minorDot", label: "label" } },
  }).default;
  const events = [
    { code: "shipment_42_1", label: "Shipped", done: true, at: "2026-09-19T10:00:00+05:30", is_exception: false, meta: { status: "shipped" } },
    { code: "shipment_42_2", label: "Arrived at carrier facility", done: true, at: "2026-09-19T11:00:00+05:30", is_exception: false, meta: { status: "in_transit" } },
  ];
  const html = renderToStaticMarkup(React.createElement(Component, { events }));
  assert.match(html, /data-major="true"/);
  assert.match(html, /data-major="false"/);
  assert.match(html, /class="timestamp text-default-500"[^>]*><span class="time">3:30 pm<\/span><span class="date text-default-400">19 Sep<\/span>/);
  assert.match(html, /majorDot/);
  assert.match(html, /minorDot/);
  assert.ok(html.indexOf("3:30 pm") < html.indexOf("Shipped"));
});

test("rendered timeline keeps future labels visible and completed terminal nodes are not active", () => {
  const Component = load("../src/views/OrderDetailView/OrderTimeline.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
    "./timeline": timeline,
    "./OrderTimeline.module.css": { default: {} },
  }).default;
  const pending = renderToStaticMarkup(React.createElement(Component, { steps: progress().slice(1) }));
  assert.doesNotMatch(pending, /border-primary|border-warning/);
  assert.match(pending, /shipped/);
  assert.match(pending, /delivered/);
  assert.equal((pending.match(/data-state="upcoming"/g) || []).length, 3);
  const complete = renderToStaticMarkup(React.createElement(Component, { steps: progress(4).slice(1) }));
  assert.doesNotMatch(complete, /animate-pulse|bg-warning|aria-current/);
  assert.equal((complete.match(/data-state="completed"/g) || []).length, 4);
  const css = readFileSync(new URL("../src/views/OrderDetailView/OrderTimeline.module.css", import.meta.url), "utf8");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /flex-direction: column/);
  assert.match(css, /min-width: 769px/);
  const single = renderToStaticMarkup(React.createElement(Component, {
    showQuantity: false, formatPrice: (amount) => `INR ${amount}`,
    events: [{ code: "refund_1", label: "Refund sent", done: true, at: null, meta: { quantity: 1, amount: 100, refund_method: "wallet" } }],
  }));
  assert.doesNotMatch(single, /orderRefunds.quantity/);
  assert.match(single, /INR 100/);
  assert.match(single, /orderRefunds.method.wallet/);
  assert.match(single, /--duration:1500ms/);
});

test("partial cancellation quantities are shown without adding noise to unchanged items", () => {
  const Component = load("../src/views/OrderDetailView/ItemQuantityDetails.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Component, { item: {
    quantity_summary: { ordered: 3, current: 2, cancelled: 1, return_requested: 0, return_received: 0 },
  } }));
  assert.match(html, /orderQuantities.cancelled/);
  assert.doesNotMatch(html, /orderQuantities.returnRequested/);
  assert.equal(renderToStaticMarkup(React.createElement(Component, { item: { quantity_summary: {
    ordered: 3, current: 3, cancelled: 0, return_requested: 0, return_received: 0,
  } } })), "");
});

test("return history keeps declined and cancelled requests and shows their individual quantities", () => {
  const Component = load("../src/views/OrderDetailView/ItemReturnDetails.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Component, {
    returns: [
      { id: 1, quantity: 1, source_shipment_id: 31, source_shipment: { id: 31, carrier_name: "Carrier A", tracking_number: "TRACK-A" }, return_status: "declined", customer_status: { label: "Declined" }, created_at: "first-date", reason: "Wrong size" },
      { id: 2, quantity: 2, return_status: "cancelled", customer_status: { label: "Cancelled" }, created_at: "second-date", reason: "Changed mind" },
    ], showRefundAmount: false, formatPrice: String,
  }));
  assert.match(html, /Declined/);
  assert.match(html, /Cancelled/);
  assert.match(html, /qty: 1/);
  assert.match(html, /qty: 2/);
  assert.match(html, /Wrong size/);
  assert.match(html, /Shipment.*#31/);
  assert.match(html, /TRACK-A/);
  assert.equal((html.match(/<details/g) || []).length, 2);
  assert.equal((html.match(/<details open/g) || []).length, 1);
});

test("shipment card reads parcels directly from the selected item", () => {
  const Component = load("../src/views/OrderDetailView/DeliveryInfo.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "@/components/ui": {
      Card: ({ children }) => React.createElement("section", null, children),
      CardBody: ({ children }) => React.createElement("div", null, children),
      CardHeader: ({ children }) => React.createElement("header", null, children),
      Chip: ({ children }) => React.createElement("span", null, children),
      Divider: () => React.createElement("hr"),
    },
    "@iconify/react": { Icon: () => null },
    "@/helpers/getters": { getFormattedDate: (value) => value },
    "@/config/constants": { orderStatusColorMap: () => "default" },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Component, { item: {
    title: "Selected", variant_title: "Blue", shipments: [
      { id: 1, quantity: 1, status: "shipped", customer_status: "shipped", customer_status_label: "Shipped", carrier_name: "Carrier A", tracking_number: "A1", tracking_url: null, picked_up_at: null, delivered_at: null },
      { id: 2, quantity: 2, status: "delivered", customer_status: "delivered", customer_status_label: "Delivered", carrier_name: "Carrier B", tracking_number: "B2", tracking_url: null, picked_up_at: null, delivered_at: null },
    ],
  } }));
  assert.match(html, /Carrier A/);
  assert.match(html, /Carrier B/);
  assert.equal((html.match(/Selected/g) || []).length, 2);
  assert.match(html, /× 1/);
  assert.match(html, /× 2/);
});

test("cancellation confirmation submits only the selected item and displays eligible quantity", async () => {
  const calls = [];
  let done = false;
  const Component = load("../src/views/OrderDetailView/CancelItemSheet.tsx", {
    react: { useState: (value) => [value, () => {}] },
    "react-i18next": { useTranslation: () => ({ t: (key, options) => options?.count != null ? `Cancel quantity: ${options.count}` : key }) },
    "@/components/ui": {
      Button: ({ children }) => React.createElement("button", null, children),
      Sheet: ({ children, footer }) => React.createElement("section", null, children, footer),
      toastError: () => {}, toastSuccess: () => {},
    },
    "@/services/orders": { cancelOrderItem: async (input) => { calls.push(input); return { success: true }; } },
  }).default;
  const view = Component({ item: { id: 10, title: "Selected product", quantity: 3, can_cancel: true, cancelable_quantity: 1 }, isOpen: true, onClose: () => {}, onDone: () => { done = true; } });
  assert.match(renderToStaticMarkup(view), /Cancel quantity: 1/);
  await view.props.footer.props.children[1].props.onPress();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].orderItemId, "10");
  assert.equal(done, true);
});

test("item refund section renders quantity, destination, amount and status", () => {
  const Component = load("../src/views/OrderDetailView/ItemRefundDetails.tsx", {
    "./refunds": helpers,
    "react-i18next": { useTranslation: () => ({ t: (key, options) => options ? `Qty: ${options.count}` : key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Component, {
    refunds: [refund()], itemId: 10, formatPrice: (amount) => `INR ${amount}`,
  }));
  assert.match(html, /Qty: 1/);
  assert.match(html, /INR 100/);
  assert.doesNotMatch(html, /INR 300/);
  assert.match(html, /orderRefunds.status.owed/);
  assert.match(html, /orderRefunds.method.wallet/);
});
