import type { TimelineEvent, TimelineStep } from "@/types/ApiResponse";

/**
 * Flatten the backend's grouped tracker steps into a single ordered event list
 * for the vertical timeline. Each step carries one or more events (e.g. the
 * "Shipped" step holds pickup + shipped events).
 */
export function flattenTimeline(steps?: TimelineStep[]): TimelineEvent[] {
  if (!Array.isArray(steps)) return [];
  return steps.flatMap((s) => (Array.isArray(s.events) ? s.events : []));
}

export function compactTimeline(steps?: TimelineStep[]): TimelineStep[] {
  if (!Array.isArray(steps)) return [];
  const confirmed = steps.some((step) => step.key === "confirmed" && step.done);
  const visible = steps.filter((step) => {
    if (step.key === "placed") return !confirmed;
    if (step.key === "confirmed") return confirmed;
    return ["shipped", "delivered", "cancelled", "returned", "refunded"].includes(step.key);
  }).map((step) => {
    const events = step.events ?? [];
    const latestDone = events.filter((event) => event.done).at(-1);
    const progress = ["returned", "refunded"].includes(step.key) && !step.done;
    const milestone = step.key === "returned"
      ? events.find((event) => event.code === "return_received")
      : undefined;
    return {
      ...step,
      label: progress && latestDone ? latestDone.label : step.label,
      at: progress ? latestDone?.at ?? null : step.done ? milestone ? milestone.at : step.at : null,
    };
  });
  let current = -1;
  visible.forEach((step, index) => {
    if (step.done || step.events?.some((event) => event.done)) current = index;
  });
  return visible.map((step, index) => ({
    ...step,
    current: index === current,
    marker: index === current ? "current" : step.done ? "done" : "pending",
  }));
}
