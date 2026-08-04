export interface DeliveryEta {
  min: number | null;
  max: number | null;
  unit: string;
}

/**
 * Turn a delivery-ETA window into a concrete "delivery by" date string like
 * "3 Sep" (day-first, 3-letter month).
 *
 * Uses the MAX days (worst case) added to today — e.g. max 30 on 4 Aug -> "3 Sep".
 * Falls back to `min` when `max` is absent. Returns null when neither is present
 * or the unit is not day-based (only day windows map to a calendar date).
 * Adds the year only when the target date falls in a different year.
 */
export const formatDeliveryByDate = (eta?: DeliveryEta | null): string | null => {
  if (!eta) return null;

  const days = eta.max ?? eta.min;
  if (days == null) return null;

  const unit = (eta.unit || "days").toLowerCase();
  if (!unit.startsWith("day")) return null;

  const now = new Date();
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + days);

  const day = target.getDate();
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(target);
  const base = `${day} ${month}`;

  return target.getFullYear() === now.getFullYear()
    ? base
    : `${base} ${target.getFullYear()}`;
};
