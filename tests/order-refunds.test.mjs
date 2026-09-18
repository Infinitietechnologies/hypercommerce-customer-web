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
const renderSummary = (money_summary) => renderToStaticMarkup(React.createElement(Summary, {
  order: { subtotal: "300", final_total: "300", money_summary },
  formatPrice: (amount) => `INR ${amount}`,
}));

test("unchanged totals show one checkout total without adjustment clutter", () => {
  const html = renderSummary({ original: { items_total: 300, order_total: 300 }, current: { order_total: 300 }, total_changed: false });
  assert.match(html, /orderMoneySummary.checkoutNote/);
  assert.doesNotMatch(html, /orderMoneySummary.updatedTotal|orderMoneySummary.adjustments/);
});

test("changed totals preserve checkout discounts and separate refunds from price changes", () => {
  const html = renderSummary({
    original: { items_total: 300, promo_discount: 30, order_total: 270 },
    current: { order_total: 180 }, total_changed: true, refund_issued: 90, refund_owed: 0,
  });
  assert.match(html, /INR 270/);
  assert.match(html, /INR 180/);
  assert.match(html, /INR -90/);
  assert.match(html, /discountAmount/);
  assert.match(html, /orderMoneySummary.refunded/);
  assert.doesNotMatch(html, /orderMoneySummary.pending/);
});

test("older orders use current values without inventing a checkout snapshot", () => {
  const html = renderSummary({ original: null, current: { items_total: 200, order_total: 200 }, total_changed: false });
  assert.match(html, /orderMoneySummary.currentNote/);
  assert.match(html, /INR 200/);
  assert.doesNotMatch(html, /orderMoneySummary.checkoutNote|orderMoneySummary.updatedTotal/);
  assert.match(renderSummary(undefined), /INR 300/);
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

test("return-request time belongs to the request, not the pending received step", () => {
  const item = { id: 10, timeline: [{ key: "returned", done: false, at: "request-time", events: [
    { code: "return_requested", label: "Requested", done: true, at: "request-time" },
    { code: "return_received", label: "Received", done: false, at: null },
  ] }] };
  const steps = timeline.getItemTimeline(item, [], (key) => key);
  assert.equal(steps[0].key, "return_requested");
  assert.equal(steps[0].at, "request-time");
  assert.equal(steps[1].at, null);
  assert.equal(timeline.flattenTimeline(steps).length, 2);
  assert.equal(item.timeline[0].at, "request-time");
});

test("cancellation refund timeline includes only this item's quantity and amount", () => {
  const item = { id: 10, timeline: [{ key: "cancelled", done: true, at: null, events: [] }] };
  const steps = timeline.getItemTimeline(item, [refund()], (key) => key);
  assert.equal(steps.length, 2);
  assert.equal(steps[1].done, false);
  assert.equal(steps[1].events[0].meta.quantity, 1);
  assert.equal(steps[1].events[0].meta.amount, 100);
  assert.equal(steps[1].events[0].meta.refund_method, "wallet");
  assert.equal(timeline.getItemTimeline({ ...item, id: 99 }, [refund()], (key) => key).length, 1);
});

test("settled refunds replace the generic step and retain the actual payment date", () => {
  const item = { id: 10, timeline: [{ key: "refunded", done: false, at: null, events: [] }] };
  const steps = timeline.getItemTimeline(item, [
    refund({ settled_by_refund_id: 2 }),
    refund({ id: 2, status: "issued", issued_at: "issued-time", items: [] }),
  ], (key) => key);
  assert.equal(steps.length, 1);
  assert.equal(steps[0].done, true);
  assert.equal(steps[0].at, "issued-time");
});

test("compact timeline keeps four main milestones and preparation stays in details", () => {
  const steps = ["placed", "confirmed", "preparing", "shipped", "delivered"].map((key) => ({ key, done: true }));
  const compact = timeline.compactTimeline(steps);
  assert.equal(compact.some((step) => step.key === "preparing"), false);
  assert.equal(compact.at(-1).key, "delivered");
  assert.equal(compact.some((step) => step.key === "placed"), true);
});

test("recorded activity augments progress without duplicating allocated refunds", () => {
  const steps = timeline.getItemTimeline({ id: 10, activity: [
    { code: "cancelled", label: "Cancelled", done: true, at: null, meta: { quantity: 1 } },
    { code: "refund_1", label: "Refund pending", done: false, at: "request-time", meta: { quantity: 1, amount: 100 } },
  ], timeline: [{ key: "delivered", done: true }] }, [refund()], (key) => key);
  assert.equal(steps.length, 3);
  assert.equal(steps[0].key, "delivered");
  assert.equal(steps[1].key, "cancelled");
  assert.equal(steps[2].events[0].meta.amount, 100);
});

const progress = (last = 0) => ["placed", "confirmed", "preparing", "shipped", "delivered"].map((key, index) => ({
  key, label: key, done: index <= last, at: index <= last ? `2026-09-16 10:0${index}:00` : null,
  events: [{ code: key === "placed" ? "order_placed" : key === "confirmed" ? "payment_received" : key, label: key, done: index <= last, at: null, is_exception: false }],
}));

test("recorded delivery precedes later shipment cancellation and obsolete pending steps disappear", () => {
  const base = progress(1);
  base[3].events.push({ code: "out_for_delivery", label: "Out for delivery", done: false, at: null });
  const steps = timeline.getItemTimeline({ id: 10, timeline: base, activity: [
    { code: "shipment_7_1", label: "Shipped", done: true, at: "2026-09-16T11:00:00+05:30", meta: { status: "shipped", quantity: 1 } },
    { code: "shipment_7_2", label: "Cancelled", done: true, at: "2026-09-16T11:10:00+05:30", meta: { status: "cancelled", quantity: 1 } },
    { code: "shipment_7_3", label: "Delivered", done: true, at: "2026-09-16T11:05:00+05:30", meta: { status: "delivered", quantity: 1 } },
    { code: "cancelled", label: "Item cancelled", done: true, at: null, meta: { quantity: 1 } },
  ] }, [refund({ status: "issued", issued_at: "2026-09-17T10:00:00+05:30" })], (key) => key);
  const events = timeline.flattenTimeline(steps);
  assert.equal(events.find((e) => e.code === "preparing").done, true);
  assert.equal(events.find((e) => e.code === "preparing").at, null);
  assert.equal(events.some((e) => e.code === "out_for_delivery"), false);
  assert.ok(events.findIndex((e) => e.code === "shipment_7_3") < events.findIndex((e) => e.code === "shipment_7_2"));
  assert.equal(events.find((e) => e.code === "shipment_7_2").label, "orderTimeline.shipmentCancelled");
  assert.equal(events.at(-1).code, "refund_1");
});

test("unshipped orders keep upcoming preparation and delivery events", () => {
  const steps = timeline.getItemTimeline({ id: 10, timeline: progress(1) }, [], (key) => key);
  assert.equal(steps.find((s) => s.key === "preparing").done, false);
  assert.equal(steps.find((s) => s.key === "delivered").done, false);
});

test("delivery-only views do not mix cancellation refunds into shipping progress", () => {
  const item = { id: 10, quantity: 1, quantity_summary: { current: 1, cancelled: 1 }, timeline: progress(3) };
  const all = timeline.getItemTimeline(item, [refund({ status: "issued" })], (key) => key);
  const delivery = timeline.deliveryTimeline(all, item);
  assert.equal(timeline.deliveryMilestones(delivery).map((s) => s.key).join(), "confirmed,preparing,shipped,delivered");
  assert.equal(timeline.flattenTimeline(delivery).some((e) => /refund|cancel|return/.test(e.code)), false);
  assert.equal(timeline.deliveryTimeline(all, { ...item, status: "cancelled" }).length, 0);
});

test("delivery view uses the backend-owned progress when available", () => {
  const result = timeline.deliveryTimeline(progress(4), { quantity: 2, delivery_timeline: progress(2) });
  assert.equal(result.find((s) => s.key === "shipped").done, false);
});

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

test("shipment milestones count units once per parcel and do not complete undelivered units", () => {
  const activity = [
    { code: "shipment_7_1", label: "Shipped", done: true, at: "2026-09-16T11:00:00Z", meta: { status: "shipped", quantity: 1 } },
    { code: "shipment_7_2", label: "Delivered", done: true, at: "2026-09-16T11:05:00Z", meta: { status: "delivered", quantity: 1 } },
  ];
  const partial = timeline.getItemTimeline({ id: 10, quantity: 2, timeline: progress(1), activity }, [], (key) => key);
  assert.equal(partial.find((s) => s.key === "shipped").done, false);
  assert.equal(partial.find((s) => s.key === "delivered").done, false);
  const complete = timeline.getItemTimeline({ id: 10, quantity: 1, timeline: progress(1), activity }, [], (key) => key);
  assert.equal(complete.find((s) => s.key === "shipped").done, true);
  assert.equal(complete.find((s) => s.key === "delivered").done, true);
});

test("placed-only recorded activity does not hide upcoming milestones", () => {
  const steps = timeline.getItemTimeline({ id: 10, timeline: progress(), activity: [
    { code: "order_placed", label: "Placed", done: true, at: "placed-time" },
  ] }, [], (key) => key);
  assert.equal(steps.length, 5);
  assert.equal(timeline.compactTimeline(steps).map((s) => s.key).join(), "placed,confirmed,shipped,delivered");
  assert.equal(steps.filter((s) => s.done).length, 1);
});

test("full cancellation ends delivery progress and unpaid cancellation has no refund", () => {
  const steps = timeline.getItemTimeline({ id: 10, status: "cancelled", timeline: progress(1), activity: [
    { code: "cancelled", label: "Cancelled", done: true, at: null, meta: { quantity: 3 } },
  ] }, [], (key) => key);
  assert.equal(steps.map((s) => s.key).join(), "placed,confirmed,cancelled");
});

test("partial cancellation keeps the remaining delivery milestones", () => {
  const steps = timeline.getItemTimeline({ id: 10, quantity_summary: { current: 2, cancelled: 1 }, timeline: progress(1), activity: [
    { code: "cancelled", label: "Cancelled", done: true, at: null, meta: { quantity: 1 } },
  ] }, [refund()], (key) => key);
  assert.equal(steps.some((s) => s.key === "delivered" && !s.done), true);
  assert.equal(steps.at(-1).events[0].meta.quantity, 1);
});

test("COD confirmation does not claim payment was received", () => {
  const steps = timeline.getItemTimeline({ id: 10, timeline: progress(4) }, [], (key) => key, "cod");
  assert.equal(timeline.flattenTimeline(steps).some((e) => e.code === "payment_received"), false);
});

test("return quantities and dates stay scoped and refund does not invent receipt", () => {
  const steps = timeline.getItemTimeline({ id: 10, timeline: progress(4), returns: [
    { id: 8, quantity: 1, return_status: "requested", created_at: "request-time" },
  ] }, [refund({ status: "issued", issued_at: "refund-time" })], (key) => key);
  const received = steps.find((s) => s.key === "return_8_received");
  assert.equal(received.done, false);
  assert.equal(received.at, null);
  assert.equal(received.events[0].meta.quantity, 1);
  assert.equal(steps.at(-1).at, "refund-time");
});

test("declined and withdrawn requests retain history without future promises", () => {
  for (const status of ["declined", "cancelled"]) {
    const steps = timeline.getItemTimeline({ id: 10, timeline: progress(4), returns: [
      { id: 8, quantity: 1, return_status: status, created_at: "request-time" },
    ] }, [], (key) => key);
    assert.equal(steps.at(-1).key, `return_8_${status}`);
    assert.equal(steps.some((s) => !s.done), false);
  }
});

test("completed terminal markers are green and exceptions have distinct semantics", () => {
  assert.equal(timeline.timelineTone("delivered", true), "completed");
  assert.equal(timeline.timelineTone("refund_1", true), "completed");
  assert.equal(timeline.timelineTone("cancelled", true, true), "cancelled");
  assert.equal(timeline.timelineTone("refund_1", false, true), "failed");
  assert.equal(timeline.timelineTone("return_8_declined", true), "failed");
  assert.equal(timeline.timelineTone("on_hold", true, true), "warning");
});

test("shipment activity retains preparation before cancellation using stable status metadata", () => {
  const steps = timeline.getItemTimeline({ id: 10, status: "cancelled", timeline: progress(1), activity: [
    { code: "shipment_8_15", label: "Packed", done: true, at: "packed-time", meta: { status: "packed", quantity: 1 } },
    { code: "cancelled", label: "Cancelled", done: true, at: null },
  ] }, [], (key) => key);
  assert.equal(steps.map((s) => s.key).join(), "placed,confirmed,preparing,cancelled");
});

test("legacy quantity summaries still expose partial cancellation without activity", () => {
  const steps = timeline.getItemTimeline({ id: 10, quantity_summary: { current: 2, cancelled: 1 }, timeline: progress(1) }, [], (key) => key);
  assert.equal(steps.at(-1).key, "cancelled");
  assert.equal(steps.at(-1).events[0].meta.quantity, 1);
});

test("closed return history does not clutter the outside delivered timeline", () => {
  const steps = timeline.getItemTimeline({ id: 10, timeline: progress(4), returns: [
    { id: 1, quantity: 1, return_status: "cancelled", created_at: "request-time" },
  ] }, [], (key) => key);
  assert.equal(timeline.compactTimeline(steps).map((s) => s.key).join(), "placed,confirmed,shipped,delivered");
  assert.equal(timeline.flattenTimeline(steps).at(-1).code, "return_1_cancelled");
});

test("outside return tracker has exactly four milestones and keeps full history in details", () => {
  const steps = timeline.getItemTimeline({ id: 10, timeline: progress(4), returns: [
    { id: 8, quantity: 1, return_status: "approved", created_at: "request-time", seller_approved_at: "approved-time" },
  ] }, [], (key) => key);
  assert.equal(timeline.compactTimeline(steps).map((s) => s.key).join(), "delivered,return_8_requested,return_8_received,return_8_refunded");
  assert.equal(timeline.flattenTimeline(steps).some((e) => e.code === "return_8_approved"), true);
});

test("outside cancellation tracker has at most four steps and mixed refunds stay pending", () => {
  const steps = timeline.getItemTimeline({ id: 10, timeline: progress(3), activity: [
    { code: "cancelled", label: "Cancelled", done: true, at: null },
  ] }, [refund(), refund({ id: 2, status: "issued", issued_at: "issued-time" })], (key) => key);
  const compact = timeline.compactTimeline(steps);
  assert.equal(compact.length, 4);
  assert.equal(compact.at(-1).done, false);
  assert.equal(compact.at(-1).events[0].meta.quantity, 2);
});

test("adjustment disclosure shows individual subtotal and discount changes", () => {
  const html = renderSummary({ original: { items_total: 300, promo_discount: 30, order_total: 270 }, current: { items_total: 200, promo_discount: 20, order_total: 180 }, total_changed: true });
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
  assert.match(html, /INR -100/);
  assert.match(html, /\+ INR 10/);
});

test("API-owned tracking bypasses legacy timeline reconstruction", () => {
  const adjustments = [{ key: "cancelled", label: "Cancelled", done: true, at: null, events: [] }];
  const result = timeline.getItemTimeline({
    id: 10, status: "active", tracking: { version: 1, adjustments },
    timeline: [{ key: "delivered", done: true, at: "incorrect", events: [] }],
  }, [refund()], (key) => key);
  assert.equal(result, adjustments);
  assert.equal(result.some((step) => step.key === "delivered"), false);
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

test("rendered timeline keeps future labels visible and completed terminal nodes are not active", () => {
  const Component = load("../src/views/OrderDetailView/OrderTimeline.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "@/helpers/getters": { getFormattedDate: (value) => value },
    "./timeline": timeline,
    "./OrderTimeline.module.css": { default: {} },
  }).default;
  const pending = renderToStaticMarkup(React.createElement(Component, { steps: timeline.compactTimeline(progress()) }));
  assert.match(pending, /shipped/);
  assert.match(pending, /delivered/);
  assert.equal((pending.match(/data-state="upcoming"/g) || []).length, 2);
  const complete = renderToStaticMarkup(React.createElement(Component, { steps: timeline.compactTimeline(progress(4)) }));
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
});

test("legacy timelines do not promise return receipt or refunds for abandoned requests", () => {
  const steps = timeline.getItemTimeline({ id: 10, returns: [{ return_status: "cancelled" }], timeline: [
    { key: "delivered", done: true, events: [] },
    { key: "returned", done: false, events: [] },
    { key: "refunded", done: false, events: [] },
  ] }, [], (key) => key);
  assert.equal(steps.length, 1);
  assert.equal(steps[0].key, "delivered");
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
      { id: 1, quantity: 1, return_status: "declined", customer_status: { label: "Declined" }, created_at: "first-date", reason: "Wrong size" },
      { id: 2, quantity: 2, return_status: "cancelled", customer_status: { label: "Cancelled" }, created_at: "second-date", reason: "Changed mind" },
    ], showRefundAmount: false, formatPrice: String,
  }));
  assert.match(html, /Declined/);
  assert.match(html, /Cancelled/);
  assert.match(html, /qty: 1/);
  assert.match(html, /qty: 2/);
  assert.match(html, /Wrong size/);
  assert.equal((html.match(/<details/g) || []).length, 2);
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
