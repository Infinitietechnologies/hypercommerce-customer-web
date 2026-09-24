import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import type { OrderItem, OrderRefund, TimelineStep } from "@/types/order";
import { getFormattedDate } from "@/helpers/getters";
import ItemReturnDetails from "./ItemReturnDetails";
import ItemRefundDetails from "./ItemRefundDetails";
import { getItemRefunds } from "./refunds";

export default function ItemAdjustmentDetails({ item, refunds, steps, formatPrice, onCancelReturn, cancellingReturnId }: {
  item: OrderItem;
  refunds?: OrderRefund[];
  steps: TimelineStep[];
  formatPrice: (amount: number) => string;
  onCancelReturn?: (returnId: number) => void;
  cancellingReturnId?: number | null;
}) {
  const { t } = useTranslation();
  const refundRows = getItemRefunds(refunds, item.id);
  const issuedRefunds = refundRows.filter((refund) => refund.status === "issued");
  const allRefundsIssued = refundRows.length > 0 && refundRows.every((refund) => refund.status === "issued");
  const latestReturn = issuedRefunds.length
    ? undefined
    : [...(item.returns || [])].sort((a, b) => b.id - a.id)[0];
  const cancellation = steps.find((step) => step.key === "cancelled");
  const quantity = item.quantity_summary?.cancelled ?? cancellation?.events[0]?.meta?.quantity;

  if (!cancellation && !quantity && !latestReturn && !refundRows.length) return null;

  const refundStatus = refundRows.some((refund) => refund.status === "failed")
    ? "failed"
    : refundRows.some((refund) => refund.status === "owed")
      ? "owed"
      : "issued";
  const showsRefund = issuedRefunds.length > 0 || (!latestReturn && refundRows.length > 0);
  const title = allRefundsIssued
    ? t("orderRefunds.completed", "Refund completed")
    : latestReturn
      ? latestReturn.customer_status?.label || t("orderReturns.request", "Return request")
      : showsRefund
        ? t(`orderRefunds.status.${refundStatus}`)
        : t("orderQuantities.cancelled", "Cancelled");
  const icon = allRefundsIssued
    ? "solar:check-circle-bold"
    : latestReturn
      ? "solar:refresh-circle-linear"
      : showsRefund
        ? "solar:wallet-money-linear"
        : "solar:close-circle-linear";
  const iconClass = allRefundsIssued
    ? "bg-success-50 text-success-700"
    : "bg-default-100 text-default-600";

  return (
    <details open className="group overflow-hidden rounded-medium border border-divider bg-content1">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          <Icon icon={icon} width={18} height={18} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold">{title}</span>
        <Icon icon="solar:alt-arrow-down-linear" width={17} height={17} className="shrink-0 text-default-500 transition-transform group-open:rotate-180" />
      </summary>

      {latestReturn ? (
        <ItemReturnDetails
          returns={[latestReturn]}
          onCancelReturn={onCancelReturn}
          cancellingReturnId={cancellingReturnId}
        />
      ) : showsRefund ? (
        <ItemRefundDetails refunds={refunds} itemId={item.id} formatPrice={formatPrice} />
      ) : cancellation || quantity ? (
        <div className="flex items-center justify-between gap-3 border-t border-divider px-4 py-3 text-xs">
          <span className="font-medium text-danger">{t("orderQuantities.cancelled", "Cancelled")}</span>
          <span className="text-default-500">{cancellation?.at ? getFormattedDate(cancellation.at) : ""}</span>
        </div>
      ) : null}
    </details>
  );
}
