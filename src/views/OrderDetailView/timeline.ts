import type { OrderItem, TimelineEvent, TimelineStep } from "@/types/order";

export function getItemTimeline(item: OrderItem): TimelineStep[] {
  return (item.tracking?.history ?? [])
    .filter((event) => event.code === "cancelled" || event.code.startsWith("return_") || event.code.startsWith("refund_"))
    .map((event) => ({ key: event.code, label: event.label, done: event.done, at: event.at, events: [event] }));
}

export function timelineTone(code: string, done: boolean, exception = false) {
  if (/cancelled$/.test(code)) return "cancelled";
  if (/declined$|failed|failure|lost/.test(code) || (code.startsWith("refund_") && exception)) return "failed";
  if (exception) return "warning";
  return done ? "completed" : "upcoming";
}

function deliveryMilestones(steps: TimelineStep[]): TimelineStep[] {
  return steps.filter((step) => ["confirmed", "preparing", "shipped", "delivered"].includes(step.key));
}

function extractStatusCode(event: TimelineEvent): string {
  if (event.status_code) return event.status_code;
  if (event.meta?.status) return event.meta.status;
  const returnMatch = event.code.match(/^return_\d+_(requested|approved|picked_up|received|declined|cancelled)$/);
  if (returnMatch) {
    return `return_${returnMatch[1] === "picked_up" ? "received" : returnMatch[1]}`;
  }
  return event.code;
}

export function backendTimelineViews(item: OrderItem): { main: TimelineStep[]; details: TimelineEvent[] } {
  const tracking = item.tracking;
  if (!tracking) return { main: [], details: [] };

  let main = deliveryMilestones(tracking.milestones);
  const fullyCancelled = item.status === "cancelled" || item.quantity_summary?.current === 0 || item.customer_status?.code === "cancelled";
  if (fullyCancelled) {
    main = tracking.milestones.slice(-4);
  }

  const historyEvents = flattenTimeline([{ key: "activity", done: true, at: null, events: tracking.history }]).map((event) => ({
    ...event,
    status_code: extractStatusCode(event),
    done: true,
  }));

  const futureEvents: TimelineEvent[] = [];

  // Return flow future steps
  const returnEvents = historyEvents.filter((ev) => ev.code.startsWith("return_"));
  const returnIds = Array.from(new Set(returnEvents.map((ev) => {
    const match = ev.code.match(/^return_(\d+)_/);
    return match ? match[1] : (ev.meta?.return_id ? String(ev.meta.return_id) : null);
  }).filter(Boolean))) as string[];

  for (const returnId of returnIds) {
    const isDeclined = historyEvents.some((ev) => ev.code === `return_${returnId}_declined`);
    const isCancelled = historyEvents.some((ev) => ev.code === `return_${returnId}_cancelled`);
    if (isDeclined || isCancelled) {
      continue;
    }

    const hasApproved = historyEvents.some((ev) => ev.code === `return_${returnId}_approved`);
    const hasReceived = historyEvents.some((ev) => ev.code === `return_${returnId}_received` || ev.code === `return_${returnId}_picked_up`);
    const hasRefund = historyEvents.some((ev) => ev.code.startsWith("refund_"));

    if (!hasApproved) {
      futureEvents.push({
        code: `return_${returnId}_approved`,
        status_code: "return_approved",
        label: "Return approval pending",
        done: false,
        at: null,
        is_exception: false,
        meta: { return_id: Number(returnId) },
      });
    }
    if (!hasReceived) {
      futureEvents.push({
        code: `return_${returnId}_received`,
        status_code: "return_received",
        label: "Return pickup / receipt pending",
        done: false,
        at: null,
        is_exception: false,
        meta: { return_id: Number(returnId) },
      });
    }
    if (!hasRefund) {
      futureEvents.push({
        code: `refund_pending_${returnId}`,
        status_code: "refunded",
        label: "Refund pending",
        done: false,
        at: null,
        is_exception: false,
        meta: { return_id: Number(returnId) },
      });
    }
  }

  // Cancellation & Refund pending future step
  if (fullyCancelled) {
    const hasRefund = historyEvents.some((ev) => ev.code.startsWith("refund_"));
    if (!hasRefund && !futureEvents.some((ev) => ev.code.startsWith("refund_"))) {
      futureEvents.push({
        code: "refund_pending",
        status_code: "refunded",
        label: "Refund pending",
        done: false,
        at: null,
        is_exception: false,
      });
    }
  }

  // Delivery milestones future steps
  if (!fullyCancelled) {
    const uncompletedMilestones = tracking.milestones.filter((m) => !m.done);
    for (const milestone of uncompletedMilestones) {
      const existsInFuture = futureEvents.some((ev) => ev.status_code === milestone.key);
      if (!existsInFuture) {
        futureEvents.push({
          code: milestone.key,
          status_code: milestone.key,
          label: milestone.label || milestone.key,
          done: false,
          at: milestone.at,
          is_exception: false,
          quantity: milestone.quantity,
        } as TimelineEvent);
      }
    }
  }

  const details = [...historyEvents, ...futureEvents];
  const targetHistoryCode = tracking.status_code || tracking.status?.status_code || item.customer_status?.code || tracking.status?.code;

  let targetIndex = details.findIndex((ev) => !ev.done && (ev.code === targetHistoryCode || ev.status_code === targetHistoryCode));
  if (targetIndex === -1) {
    targetIndex = details.findIndex((ev) => !ev.done);
  }
  if (targetIndex === -1 && details.length > 0) {
    targetIndex = details.length - 1;
  }

  if (targetIndex !== -1) {
    (details[targetIndex] as TimelineEvent & { current?: boolean }).current = true;
  }

  return {
    main,
    details,
  };
}

export function flattenTimeline(steps?: TimelineStep[]): TimelineEvent[] {
  if (!Array.isArray(steps)) return [];
  const events = steps.flatMap((step) => Array.isArray(step.events) ? step.events : []);
  const dated = events
    .filter((event) => event.at && Number.isFinite(Date.parse(event.at.replace(" ", "T"))))
    .sort((a, b) => Date.parse(a.at!.replace(" ", "T")) - Date.parse(b.at!.replace(" ", "T")));
  let index = 0;
  return events.map((event) => event.at && Number.isFinite(Date.parse(event.at.replace(" ", "T"))) ? dated[index++] : event);
}
