import type { TimelineEvent, TimelineStep } from "@/types/order";
import type { CSSProperties } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { getFormattedDate } from "@/helpers/getters";
import { timelineTone } from "./timeline";
import styles from "./OrderTimeline.module.css";

const tones = {
  completed: "border-success bg-success",
  upcoming: "border-default-300 bg-content1",
  active: "border-default-300 bg-content1",
  cancelled: "border-danger bg-danger",
  failed: "border-danger bg-danger",
  warning: "border-warning bg-warning",
};

const majorStatusCodes = new Set(["shipped", "delivered"]);

export function isMajorTimelineEvent(entry: TimelineEvent): boolean {
  return ["order_placed", "payment_received", "cancelled"].includes(entry.code)
    || entry.code.startsWith("refund_")
    || /^return_\d+_(requested|received|declined|cancelled)$/.test(entry.code)
    || majorStatusCodes.has(entry.meta?.status ?? "");
}

function eventIcon(entry: TimelineEvent): string {
  const status = entry.meta?.status ?? entry.code;
  if (entry.code === "order_placed") return "solar:clipboard-check-linear";
  if (entry.code === "payment_received") return "solar:card-2-linear";
  if (status === "shipped") return "solar:delivery-linear";
  if (status === "delivered") return "solar:box-linear";
  if (entry.code.startsWith("refund_")) return "solar:wallet-money-linear";
  if (entry.code === "cancelled" || /_(declined|cancelled)$/.test(entry.code)) return "solar:close-circle-linear";
  if (entry.code.startsWith("return_")) return "solar:undo-left-round-linear";
  return "solar:check-circle-linear";
}

export default function OrderTimeline({ steps, events, formatPrice, showQuantity = true }: {
  steps?: TimelineStep[];
  events?: TimelineEvent[];
  formatPrice?: (amount: number) => string;
  showQuantity?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const compact = !!steps;
  const entries = steps?.map((step) => ({
    code: step.key, label: step.label || step.key, done: step.done, at: step.at,
    current: step.current,
    quantity: step.quantity,
    completed_quantity: step.completed_quantity,
    is_exception: step.events?.at(-1)?.is_exception ?? false,
    meta: ["placed", "confirmed", "shipped", "delivered"].includes(step.key) ? undefined : step.events?.[0]?.meta,
  })) ?? events ?? [];
  const lastDone = entries.reduce((last, entry, index) => entry.done ? index : last, -1);
  const activeIndex = entries.findIndex((entry, index) => !entry.done && index > lastDone);
  return (
    <ol className={`${styles.timeline} ${compact ? styles.compact : ""}`}>
      {entries.map((entry, index) => {
        const status = timelineTone(entry.meta?.status || entry.code, entry.done, entry.is_exception);
        const milestone = steps?.[index];
        const active = status === "upcoming" && (milestone?.current ?? index === activeIndex);
        const tone = active ? "active" : status;
        const major = compact || isMajorTimelineEvent(entry);
        const markerTone = major
          ? tones[tone]
          : tone === "failed" || tone === "cancelled"
            ? tones.failed
            : tone === "warning" ? tones.warning : "border-default-400 bg-default-400";
        const locale = i18n?.language || "en-IN";
        const time = entry.at ? getFormattedDate(entry.at, locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : null;
        const date = entry.at ? getFormattedDate(entry.at, locale, { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" }) : null;
        return (
          <li key={`${entry.code}-${index}`} className={styles.entry} aria-current={active ? "step" : undefined} data-state={tone} data-major={major}
            style={{ "--duration": `${1500 / Math.max(lastDone + 1, 1)}ms`, "--delay": `${index * 1500 / Math.max(lastDone + 1, 1)}ms` } as CSSProperties}>
            {!compact && <time dateTime={entry.at || undefined} className={`${styles.timestamp} text-default-500`}>
              <span className={styles.time}>{time || "—"}</span>
              {date && <span className={`${styles.date} text-default-400`}>{date}</span>}
            </time>}
            {index < entries.length - 1 && <span className={`${styles.connector} bg-default-200`} aria-hidden="true">
              {entry.done && entries[index + 1].done && <span className={`${styles.fill} ${status === "completed" ? "bg-success" : "bg-danger"}`} />}
            </span>}
            <span aria-hidden="true" className={`${styles.dot} ${major ? styles.majorDot : styles.minorDot} ${markerTone}`}>
              {major && <Icon icon={eventIcon(entry)} width={16} height={16} />}
            </span>
            <div className={styles.content}>
              <div className={`${styles.label} ${major ? "font-semibold text-foreground" : "font-normal text-default-500"}`}>{entry.label}</div>
              {compact && entry.at && <div className="text-xs leading-5 text-default-500">{getFormattedDate(entry.at)}</div>}
              {showQuantity && milestone?.completed_quantity != null && milestone.quantity != null && milestone.completed_quantity > 0 && <div className="text-xs leading-5 text-default-500">{t("orderUpdates.quantityProgress", { count: milestone.completed_quantity, total: milestone.quantity, defaultValue: "{{count}} of {{total}}" })}</div>}
              {entry.meta && <div className="text-xs leading-5 text-default-500">
                {[
                  showQuantity && entry.meta.quantity != null ? t("orderRefunds.quantity", { count: entry.meta.quantity, defaultValue: "Qty: {{count}}" }) : null,
                  !compact && entry.meta.amount != null && formatPrice ? formatPrice(entry.meta.amount) : null,
                  !compact && entry.meta.refund_method ? t(`orderRefunds.method.${entry.meta.refund_method}`) : null,
                ].filter(Boolean).join(" · ")}
              </div>}
              {!compact && (entry.meta?.shipment_id || entry.meta?.tracking_id || entry.meta?.courier) && <div className="break-all text-xs text-default-500">
                {[entry.meta.shipment_id ? `${t("pages.order.returnShipment", "Shipment")} #${entry.meta.shipment_id}` : null, entry.meta.courier, entry.meta.tracking_id].filter(Boolean).join(" · ")}
              </div>}
              {!compact && entry.meta?.tracking_url && /^https?:\/\//i.test(entry.meta.tracking_url) && <a
                href={entry.meta.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-xs font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >{t("track")}</a>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
