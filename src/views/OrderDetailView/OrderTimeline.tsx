import type { TimelineEvent, TimelineStep } from "@/types/order";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { getFormattedDate } from "@/helpers/getters";
import { timelineTone } from "./timeline";
import styles from "./OrderTimeline.module.css";

const tones = {
  completed: "border-success bg-success",
  upcoming: "border-default-300 bg-content1",
  active: "border-primary bg-content1",
  cancelled: "border-danger bg-danger",
  failed: "border-danger bg-danger",
  warning: "border-warning bg-warning",
};

export default function OrderTimeline({ steps, events, formatPrice, showQuantity = true }: {
  steps?: TimelineStep[];
  events?: TimelineEvent[];
  formatPrice?: (amount: number) => string;
  showQuantity?: boolean;
}) {
  const { t } = useTranslation();
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
        return (
          <li key={entry.code} className={styles.entry} aria-current={active ? "step" : undefined} data-state={tone}
            style={{ "--duration": `${1500 / Math.max(lastDone + 1, 1)}ms`, "--delay": `${index * 1500 / Math.max(lastDone + 1, 1)}ms` } as CSSProperties}>
            {index < entries.length - 1 && <span className={`${styles.connector} bg-default-200`} aria-hidden="true">
              {entry.done && entries[index + 1].done && <span className={`${styles.fill} ${status === "completed" ? "bg-success" : "bg-danger"}`} />}
            </span>}
            <span aria-hidden="true" className={`${styles.dot} ${tones[tone]}`}>
              {tone === "completed" ? "✓" : tone === "cancelled" ? "−" : tone === "failed" || tone === "warning" ? "!" : ""}
            </span>
            <div className={styles.content}>
              <div className="text-xs font-semibold leading-5 text-foreground">{entry.label}</div>
              {entry.at && <div className="text-xs leading-5 text-default-500">{getFormattedDate(entry.at)}</div>}
              {showQuantity && milestone?.completed_quantity != null && milestone.quantity != null && milestone.completed_quantity > 0 && <div className="text-xs leading-5 text-default-500">{t("orderUpdates.quantityProgress", { count: milestone.completed_quantity, total: milestone.quantity, defaultValue: "{{count}} of {{total}}" })}</div>}
              {entry.meta && <div className="text-xs leading-5 text-default-500">
                {[
                  showQuantity && entry.meta.quantity != null ? t("orderRefunds.quantity", { count: entry.meta.quantity, defaultValue: "Qty: {{count}}" }) : null,
                  !compact && entry.meta.amount != null && formatPrice ? formatPrice(entry.meta.amount) : null,
                  !compact && entry.meta.refund_method ? t(`orderRefunds.method.${entry.meta.refund_method}`) : null,
                ].filter(Boolean).join(" · ")}
              </div>}
              {!compact && entry.meta?.tracking_id && <div className="break-all text-xs text-default-500">
                {entry.meta.courier ? `${entry.meta.courier} · ` : ""}{entry.meta.tracking_id}
              </div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
