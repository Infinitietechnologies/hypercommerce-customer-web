import { useTranslation } from "react-i18next";
import type { OrderItem, OrderRefund, TimelineStep } from "@/types/order";
import { getFormattedDate } from "@/helpers/getters";
import ItemReturnDetails from "./ItemReturnDetails";
import ItemRefundDetails from "./ItemRefundDetails";
import { getItemRefunds } from "./refunds";

export default function ItemAdjustmentDetails({ item, refunds, steps, formatPrice }: {
  item: OrderItem;
  refunds?: OrderRefund[];
  steps: TimelineStep[];
  formatPrice: (amount: number) => string;
}) {
  const { t } = useTranslation();
  const rows = getItemRefunds(refunds, item.id);
  const cancellation = steps.find((step) => step.key === "cancelled");
  const quantity = item.quantity_summary?.cancelled ?? cancellation?.events[0]?.meta?.quantity;
  const hasReturns = !!item.returns?.length;
  if (!cancellation && !quantity && !hasReturns && !rows.length) return null;
  const status = rows.some((row) => row.status === "failed") ? "failed" : rows.some((row) => row.status === "owed") ? "owed" : "issued";
  const statusRows = rows.filter((row) => row.status === status);
  const method = statusRows.length && statusRows.every((row) => row.method === statusRows[0].method) ? statusRows[0].method : null;
  return (
    <details className="rounded-medium border border-divider bg-content1">
      <summary className="cursor-pointer p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <span className="font-semibold">{hasReturns && (cancellation || quantity) ? t("orderUpdates.adjustments", "Item updates") : hasReturns ? t("orderReturns.heading", "Return requests") : cancellation || quantity ? t("orderQuantities.cancelled", "Cancelled") : t("orderRefunds.heading", "Refund updates")}</span>
        {!!quantity && !hasReturns && <span className="ms-2 text-default-500">{t("orderRefunds.quantity", { count: quantity, defaultValue: "Qty: {{count}}" })}</span>}
        {!hasReturns && rows.length > 0 && <span className="ms-2 text-xs text-default-500">{t(`orderRefunds.status.${status}`)} · {formatPrice(statusRows.reduce((total, row) => total + row.amount, 0))}{method && ` · ${t(`orderRefunds.method.${method}`)}`}</span>}
      </summary>
      {cancellation && <dl className="border-t border-divider p-4 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="font-medium text-danger">{t("orderQuantities.cancelled", "Cancelled")}{quantity != null ? ` · ${t("orderRefunds.quantity", { count: quantity, defaultValue: "Qty: {{count}}" })}` : ""}</dt>
          <dd>{cancellation.at ? getFormattedDate(cancellation.at) : "—"}</dd>
        </div>
      </dl>}
      <ItemReturnDetails returns={item.returns} showRefundAmount={!rows.length} formatPrice={formatPrice} embedded />
      <ItemRefundDetails refunds={refunds} itemId={item.id} formatPrice={formatPrice} />
    </details>
  );
}
