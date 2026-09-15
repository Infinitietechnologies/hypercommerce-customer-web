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
