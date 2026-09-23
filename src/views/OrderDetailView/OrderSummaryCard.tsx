import { useTranslation } from "react-i18next";
import type { Order } from "@/types/order";
import { Card, useDisclosure } from "@/components/ui";
import OrderRefundsModal from "./OrderRefundsModal";

interface Props {
  order: Order;
  formatPrice: (amount: number | string | null | undefined) => string;
}

export default function OrderSummaryCard({ order, formatPrice }: Props) {
  const { t } = useTranslation();
  const refundModal = useDisclosure();
  const current = {
    items_total: Number(order.subtotal),
    delivery_charge: Number(order.delivery_charge),
    platform_fee: Number(order.platform_fee),
    cod_fee: Number(order.cod_fee),
    promo_discount: Number(order.promo_discount),
    gift_card_discount: Number(order.gift_card_discount),
    order_total: Number(order.final_total),
    payable_amount: Number(order.total_payable),
  };
  const snapshot = order.order_summary?.converted_currency;
  const breakdown = snapshot ?? current;
  const totalChanged = !!snapshot && Math.abs(snapshot.order_total - current.order_total) >= 0.005;
  const refundIssued = (order.refunds ?? []).filter((refund) => refund.status === "issued").reduce((total, refund) => total + Number(refund.amount), 0);
  const refundOwed = (order.refunds ?? []).filter((refund) => refund.status === "owed" && !refund.settled_by_refund_id).reduce((total, refund) => total + Number(refund.amount), 0);
  const lines = [
    { key: "items_total", label: t("subtotal"), amount: breakdown.items_total, always: true },
    { key: "delivery_charge", label: t("deliveryCharge"), amount: breakdown.delivery_charge },
    { key: "platform_fee", label: t("orderMoneySummary.platformFee", "Platform fee"), amount: breakdown.platform_fee },
    { key: "cod_fee", label: t("orderMoneySummary.codFee", "Cash on delivery fee"), amount: breakdown.cod_fee },
    { key: "promo_discount", label: t("discountAmount"), amount: breakdown.promo_discount, discount: true },
    { key: "gift_card_discount", label: t("giftCardApplied"), amount: breakdown.gift_card_discount, discount: true },
  ];
  const adjustments = snapshot ? lines.map((line) => ({
    ...line,
    change: ((current[line.key as keyof typeof current] ?? 0) - (line.amount ?? 0)) * (line.discount ? -1 : 1),
  })).filter((line) => Math.abs(line.change) >= 0.005) : [];

  return (
    <Card shadow="none" radius="lg" className="border border-divider p-4">
      <h2 className="text-sm font-semibold">{t("orderMoneySummary.heading", "Order summary")}</h2>
      <p className="mt-1 text-xs text-default-500">
        {snapshot
          ? t("orderMoneySummary.checkoutNote", "For the whole order, as placed")
          : t("orderMoneySummary.currentNote", "For the whole order")}
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        {lines.filter((line) => line.amount != null && (line.always || line.amount > 0)).map((line) => (
          <div key={line.label} className="flex justify-between gap-4">
            <dt className="text-default-500">{line.label}</dt>
            <dd className="text-end font-medium">{line.discount ? "− " : ""}{formatPrice(line.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-divider pt-3 font-semibold">
          <dt>{t("orderMoneySummary.total", "Order total")}</dt>
          <dd>{formatPrice(breakdown.order_total)}</dd>
        </div>
        {totalChanged && (
          <>
            <div>
              <dt>
                <details className="rounded-small bg-default-50 p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    <span className="ms-1">{t("orderMoneySummary.adjustments", "Order adjustments")}</span>
                    <span className="float-end font-medium">{formatPrice(current.order_total - breakdown.order_total)}</span>
                  </summary>
                  <ul className="mt-3 space-y-2 border-t border-divider pt-3 text-xs">
                    {adjustments.length === 0 && <li className="flex justify-between gap-4">
                      <span>{t("orderMoneySummary.total", "Order total")}</span>
                      <span>{formatPrice(current.order_total - breakdown.order_total)}</span>
                    </li>}
                    {adjustments.map((line) => <li key={line.key} className="flex justify-between gap-4">
                      <span className="text-default-500">{line.label}</span>
                      <span>{line.change > 0 ? "+ " : ""}{formatPrice(line.change)}</span>
                    </li>)}
                    {(order.items ?? []).filter((item) => (item.quantity_summary?.cancelled ?? 0) > 0).map((item) => <li key={item.id} className="text-default-500">
                      {item.title} · {t("orderQuantities.cancelled", "Cancelled")}: {item.quantity_summary?.cancelled}
                    </li>)}
                  </ul>
                </details>
              </dt>
              <dd className="sr-only">{formatPrice(current.order_total - breakdown.order_total)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <dt>{t("orderMoneySummary.updatedTotal", "Updated total")}</dt>
              <dd>{formatPrice(current.order_total)}</dd>
            </div>
          </>
        )}
      </dl>
      {(refundIssued > 0 || refundOwed > 0) && (
        <dl className="mt-3 space-y-2 border-t border-divider pt-3 text-sm">
          {refundIssued > 0 && (
            <div className="flex items-center justify-between gap-4">
              <dt>
                <button
                  type="button"
                  onClick={refundModal.onOpen}
                  className="cursor-pointer text-start font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary-700 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-xs"
                >
                  {t("orderMoneySummary.refunded", "Refunds sent")}
                </button>
              </dt>
              <dd className="font-medium">{formatPrice(refundIssued)}</dd>
            </div>
          )}
          {refundOwed > 0 && (
            <div className="flex justify-between gap-4">
              <dt>{t("orderMoneySummary.pending", "Refunds pending")}</dt>
              <dd className="font-medium">{formatPrice(refundOwed)}</dd>
            </div>
          )}
        </dl>
      )}
      {refundIssued > 0 && (
        <OrderRefundsModal
          isOpen={refundModal.isOpen}
          onClose={refundModal.onClose}
          order={order}
          formatPrice={formatPrice}
        />
      )}
    </Card>
  );
}
