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

export function backendTimelineViews(item: OrderItem): { main: TimelineStep[]; details: TimelineEvent[] } {
  const tracking = item.tracking;
  if (!tracking) return { main: [], details: [] };

  let main = deliveryMilestones(tracking.milestones);
  const fullyCancelled = item.status === "cancelled" || item.quantity_summary?.current === 0 || item.customer_status?.code === "cancelled";
  if (fullyCancelled) {
    main = tracking.milestones.slice(-4);
  }

  return {
    main,
    details: flattenTimeline([{ key: "activity", done: true, at: null, events: tracking.history }]),
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
