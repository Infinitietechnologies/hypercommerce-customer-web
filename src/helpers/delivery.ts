export interface DeliveryEta {
  min: number | null;
  max: number | null;
  unit: string;
}

/**
 * Turn a delivery-ETA window into a concrete "delivery by" date string like
 * "3 Sep" (day-first, 3-letter month).
 *
 * Uses the MAX value (worst case) added to now — e.g. max 30 days on 4 Aug ->
 * "3 Sep"; an hours window lands on the calendar day it elapses on. Falls back
 * to `min` when `max` is absent, and returns null when neither is present.
 * Adds the year only when the target date falls in a different year.
 */
export const formatDeliveryByDate = (eta?: DeliveryEta | null): string | null => {
  if (!eta) return null;

  const value = eta.max ?? eta.min;
  if (value == null) return null;

  const unit = (eta.unit || "days").toLowerCase();

  const now = new Date();
  const target = new Date();
  if (unit.startsWith("hour")) {
    target.setHours(target.getHours() + value, 0, 0, 0);
  } else {
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() + value);
  }

  const day = target.getDate();
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(target);
  const base = `${day} ${month}`;

  return target.getFullYear() === now.getFullYear()
    ? base
    : `${base} ${target.getFullYear()}`;
};
