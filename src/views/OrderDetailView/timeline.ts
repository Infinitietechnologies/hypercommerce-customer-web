import type { TimelineEvent, TimelineStep } from "@/types/ApiResponse";
import type { OrderItem, OrderRefund } from "@/types/order";
import { getItemRefunds } from "./refunds";

export const timelineLabels: Record<string, string> = {
  "orderTimeline.confirmed": "Order confirmed",
  "orderTimeline.cancelled": "Cancelled",
  "orderTimeline.shipmentCancelled": "Shipment cancelled",
  "orderTimeline.preparing": "Preparing",
  "orderTimeline.shipped": "Shipped",
  "orderTimeline.delivered": "Delivered",
  "orderTimeline.return_requested": "Return requested",
  "orderTimeline.return_approved": "Return approved",
  "orderTimeline.return_picked_up": "Return picked up",
  "orderTimeline.return_received": "Received back by seller",
  "orderTimeline.return_cancelled": "Return request cancelled",
  "orderTimeline.return_declined": "Return request declined",
  "orderTimeline.refunded": "Refund sent to wallet",
};

export function getItemTimeline(
  item: OrderItem,
  refunds: OrderRefund[] | undefined,
  label: (key: string) => string,
  paymentMethod?: string,
): TimelineStep[] {
  if (item.tracking?.version === 1) return item.tracking.adjustments;
  const itemRefunds = getItemRefunds(refunds, item.id);
  const fullyCancelled = item.status === "cancelled" || item.quantity_summary?.current === 0;
  const steps = (item.timeline ?? []).flatMap((step) => {
    if (fullyCancelled && !step.done && ["confirmed", "preparing", "shipped", "delivered"].includes(step.key)) return [];
    if (item.returns?.length && ["returned", "refunded"].includes(step.key)) return [];
    if (step.key === "refunded" && itemRefunds.length) return [];
    if (step.key !== "returned") return [{ ...step, at: step.done ? step.at : null, events: (step.events ?? []).map((event) => ({ ...event, at: event.done ? event.at : null })) }];
    const requested = step.events?.find((event) => event.code === "return_requested");
    const received = step.events?.find((event) => event.code === "return_received");
    return [
      ...(requested ? [{
        key: "return_requested", label: requested.label, done: requested.done,
        at: requested.at, events: [requested],
      }] : []),
      { ...step, at: received?.done ? received.at : null, events: received ? [received] : step.events },
    ];
  });
  const confirmed = steps.find((step) => step.key === "confirmed");
  if (confirmed && ["cod", "cash_on_delivery", "codpayment"].includes((paymentMethod ?? "").toLowerCase())) {
    confirmed.events = [{ code: "confirmed", label: confirmed.label || label("orderTimeline.confirmed"), done: confirmed.done, at: null, is_exception: false }];
    confirmed.at = null;
  }
  for (const event of item.activity ?? []) {
    if (event.code.startsWith("return_") || event.code.startsWith("refund_")) continue;
    if (event.code.startsWith("shipment_") && event.meta?.status) {
      const status = event.meta.status;
      if (["cancelled", "returned", "rto", "lost", "failed", "attempted"].includes(status)) {
        const step = steps.find((entry) => entry.key === "shipped") ?? steps.find((entry) => entry.key === "preparing");
        const shipmentEvent = status === "cancelled" ? { ...event, label: label("orderTimeline.shipmentCancelled") } : event;
        if (step) step.events.push(shipmentEvent);
        else steps.push({ key: event.code, label: shipmentEvent.label, done: event.done, at: event.at, events: [shipmentEvent] });
        continue;
      }
      const key = status === "packed" ? "preparing" : status === "delivered" ? "delivered" : "shipped";
      let step = steps.find((entry) => entry.key === key);
      if (!step) {
        step = { key, label: label(`orderTimeline.${key}`), done: true, at: event.at, events: [] };
        const end = steps.findIndex((entry) => entry.key === "cancelled");
        steps.splice(end < 0 ? steps.length : end, 0, step);
      }
      const code = status === "packed" ? "preparing" : status;
      step.events = step.events.filter((entry) => entry.code !== code);
      step.events.push(event);
      if (fullyCancelled) step.done = true;
      if (step.done && ["packed", "shipped", "delivered"].includes(status) && event.at) step.at = event.at;
      continue;
    }
    const target = steps.find((step) => step.events.some((entry) => entry.code === event.code));
    if (target) {
      target.events = target.events.map((entry) => entry.code === event.code ? event : entry);
      if (target.key === "placed" || target.key === "cancelled") target.at = event.at;
    } else if (event.code === "cancelled" || event.code === "payment_received") {
      const step = { key: event.code, label: event.label, done: event.done, at: event.at, events: [event] };
      if (event.code === "payment_received") steps.splice(Math.min(1, steps.length), 0, step);
      else steps.push(step);
    }
  }
  if ((item.quantity_summary?.cancelled ?? 0) > 0 && !steps.some((step) => step.key === "cancelled")) {
    const event: TimelineEvent = { code: "cancelled", label: label("orderTimeline.cancelled"), done: true, at: null, is_exception: false, meta: { quantity: item.quantity_summary?.cancelled ?? undefined } };
    steps.push({ key: event.code, label: event.label, done: true, at: null, events: [event] });
  }
  const shipmentRecorded = steps.some((step) => step.events.some((event) => event.done && ["shipped", "in_transit", "out_for_delivery", "delivered"].includes(event.meta?.status || event.code)));
  const deliveryRecorded = steps.some((step) => step.events.some((event) => event.done && (event.meta?.status || event.code) === "delivered"));
  const remainingQuantity = item.quantity_summary?.current ?? item.quantity;
  for (const key of ["shipped", "delivered"]) {
    const quantities = new Map<string, number>();
    for (const event of item.activity ?? []) {
      const shipmentId = event.code.match(/^shipment_(\d+)_/)?.[1];
      const statuses = key === "shipped" ? ["shipped", "in_transit", "out_for_delivery", "delivered"] : ["delivered"];
      if (shipmentId && event.done && statuses.includes(event.meta?.status ?? "")) {
        quantities.set(shipmentId, Math.max(quantities.get(shipmentId) ?? 0, event.meta?.quantity ?? 0));
      }
    }
    const step = steps.find((entry) => entry.key === key);
    if (step && remainingQuantity > 0 && [...quantities.values()].reduce((total, quantity) => total + quantity, 0) >= remainingQuantity) {
      step.done = true;
      step.at = step.events.find((event) => event.done && event.meta?.status === key)?.at ?? step.at;
    }
  }
  for (const step of steps) {
    if (step.key === "preparing" && shipmentRecorded) {
      step.done = true;
      step.events = step.events.map((event) => event.code === "preparing" ? { ...event, done: true } : event);
    }
    if (deliveryRecorded && (!(remainingQuantity > 0) || steps.some((entry) => entry.key === "delivered" && entry.done))) {
      step.events = step.events.filter((event) => event.code !== "out_for_delivery" || event.done);
    }
    step.events.sort((a, b) => a.at && b.at ? a.at.localeCompare(b.at) : a.at ? -1 : b.at ? 1 : 0);
  }
  for (const request of [...(item.returns ?? [])].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))) {
    if (!request.id) continue;
    const closed = ["cancelled", "declined"].includes(request.return_status);
    const stages = [
      ["requested", request.created_at], ["approved", request.seller_approved_at],
      ["picked_up", request.picked_up_at], ["received", request.received_at],
    ] as const;
    for (const [stage, at] of stages) {
      if (closed && !at) continue;
      const event: TimelineEvent = {
        code: `return_${request.id}_${stage}`, label: label(`orderTimeline.return_${stage}`),
        done: !!at, at: at || null, is_exception: false, meta: { quantity: request.quantity },
      };
      steps.push({ key: event.code, label: event.label, done: event.done, at: event.at, events: [event] });
    }
    if (closed) {
      const event: TimelineEvent = { code: `return_${request.id}_${request.return_status}`, label: label(`orderTimeline.return_${request.return_status}`), done: true, at: null, is_exception: request.return_status === "declined", meta: { quantity: request.quantity } };
      steps.push({ key: event.code, label: event.label, done: true, at: null, events: [event] });
    } else if (!itemRefunds.length) {
      const event: TimelineEvent = { code: `return_${request.id}_refunded`, label: label("orderTimeline.refunded"), done: !!request.refund_processed_at, at: request.refund_processed_at || null, is_exception: false, meta: { quantity: request.quantity } };
      steps.push({ key: event.code, label: event.label, done: event.done, at: event.at, events: [event] });
    }
  }
  for (const refund of itemRefunds) {
    const done = refund.status === "issued";
    const event: TimelineEvent = {
      code: `refund_${refund.id}`, label: label(`orderRefunds.status.${refund.status}`),
      done, at: done ? refund.issued_at : refund.created_at, is_exception: refund.status === "failed",
      meta: { quantity: refund.quantity, amount: refund.amount, refund_method: refund.method },
    };
    steps.push({ key: event.code, label: event.label, done, at: event.at, events: [event] });
  }
  return steps;
}

export function compactTimeline(steps: TimelineStep[]): TimelineStep[] {
  const closedRequests = new Set(steps.filter((step) => /^return_\d+_(cancelled|declined)$/.test(step.key)).map((step) => step.key.split("_")[1]));
  const visible = steps.filter((step) => {
    if (step.key.startsWith("return_") && closedRequests.has(step.key.split("_")[1])) return false;
    if (step.key === "preparing" || step.key === "payment_received") return false;
    if (/^return_\d+_(approved|picked_up)$/.test(step.key)) return false;
    return true;
  });
  const refunds = visible.filter((step) => step.key.startsWith("refund") || step.key.endsWith("_refunded"));
  const refund = refunds.find((step) => step.events.some((event) => event.is_exception)) ?? refunds.find((step) => !step.done) ?? refunds.at(-1);
  const refundStep = refund ? {
    ...refund,
    done: refunds.every((step) => step.done),
    events: [{ ...refund.events[0], meta: {
      ...refund.events[0]?.meta,
      quantity: refunds.reduce((total, step) => total + (step.events[0]?.meta?.quantity ?? 0), 0) || undefined,
    } }],
  } : undefined;
  const returnRequest = visible.findLastIndex((step) => /^return_\d+_requested$/.test(step.key) || step.key === "return_requested");
  if (returnRequest >= 0) {
    const requested = visible[returnRequest];
    const received = visible.find((step) => step.key === requested.key.replace(/requested$/, "received") || step.key === "returned");
    return [visible.find((step) => step.key === "delivered"), requested, received, refundStep].filter((step): step is TimelineStep => !!step);
  }
  const cancelled = visible.find((step) => step.key === "cancelled");
  if (cancelled) {
    const before = visible.filter((step) => ["placed", "confirmed", "shipped", "delivered"].includes(step.key) && step.done);
    return [...before.slice(refundStep ? -2 : -3), cancelled, ...(refundStep ? [refundStep] : [])];
  }
  return visible.slice(-4);
}

export function timelineTone(code: string, done: boolean, exception = false) {
  if (/cancelled$/.test(code)) return "cancelled";
  if (/declined$|failed|failure|lost/.test(code) || (code.startsWith("refund_") && exception)) return "failed";
  if (exception) return "warning";
  return done ? "completed" : "upcoming";
}

export function deliveryTimeline(steps: TimelineStep[], item: OrderItem): TimelineStep[] {
  if (item.status === "cancelled" || item.quantity_summary?.current === 0) return [];
  return (item.delivery_timeline ?? steps).filter((step) => ["placed", "confirmed", "payment_received", "preparing", "shipped", "delivered"].includes(step.key))
    .map((step) => ({ ...step, events: step.events.filter((event) => !["cancelled", "returned", "rto"].includes(event.meta?.status ?? event.code)) }));
}

export function deliveryMilestones(steps: TimelineStep[]): TimelineStep[] {
  return steps.filter((step) => ["confirmed", "preparing", "shipped", "delivered"].includes(step.key));
}

export function backendTimelineViews(item: OrderItem): { main: TimelineStep[]; details: TimelineEvent[] } {
  const steps = item.timeline ?? item.delivery_timeline ?? item.tracking?.milestones;
  if (!steps) return { main: [], details: item.tracking?.history ?? [] };
  const fullyCancelled = item.status === "cancelled" || item.quantity_summary?.current === 0 || item.tracking?.status?.code === "cancelled";
  const cancellationIndex = steps.findIndex((step) => step.key === "cancelled" && step.done);
  let main = deliveryMilestones(steps);
  if (fullyCancelled && cancellationIndex >= 0) {
    const ending = steps.slice(cancellationIndex).filter((step) => ["cancelled", "refunded"].includes(step.key)).slice(0, 2);
    const completed = steps.slice(0, cancellationIndex).filter((step) => step.done && ["placed", "confirmed", "preparing", "shipped", "delivered"].includes(step.key));
    main = [...completed.slice(-(4 - ending.length)), ...ending];
  }
  const recorded = item.activity;
  const details = recorded?.length ? [...recorded].sort((a, b) => {
    if (!a.at) return 1;
    if (!b.at) return -1;
    return Date.parse(a.at) - Date.parse(b.at);
  }) : steps.flatMap((step) => step.events?.length ? step.events : [{
      code: step.key,
      label: step.label || step.key,
      done: step.done,
      at: step.at,
      is_exception: false,
    }]);
  return { main, details };
}

/**
 * Flatten the backend's grouped tracker steps into a single ordered event list
 * for the vertical timeline. Each step carries one or more events (e.g. the
 * "Shipped" step holds pickup + shipped events).
 */
export function flattenTimeline(steps?: TimelineStep[]): TimelineEvent[] {
  if (!Array.isArray(steps)) return [];
  const events = steps.flatMap((s) => (Array.isArray(s.events) ? s.events : []));
  const dated = events.filter((event) => event.at && Number.isFinite(Date.parse(event.at.replace(" ", "T"))))
    .sort((a, b) => Date.parse(a.at!.replace(" ", "T")) - Date.parse(b.at!.replace(" ", "T")));
  let index = 0;
  return events.map((event) => event.at && Number.isFinite(Date.parse(event.at.replace(" ", "T"))) ? dated[index++] : event);
}
