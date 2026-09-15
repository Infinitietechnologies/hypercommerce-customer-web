import type { Order } from "@/types/order";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui";
import Price from "@/components/Functional/Price";
import { getFormattedDate } from "@/helpers/getters";

export default function Refunds({ order }: { order: Order }) {
  const { t } = useTranslation();
  const refunds = (order.refunds ?? []).filter(
    (refund) => refund.settled_by_refund_id == null,
  );

  if (!refunds.length) return null;

  return (
    <Card shadow="none" radius="lg" className="border border-divider">
      <h2 className="border-b border-divider px-4 py-3 text-sm font-semibold">
        {t("refundDetails.title")}
      </h2>
      <ul className="divide-y divide-divider">
        {refunds.map((refund) => {
          const issued = refund.status === "issued";
          const failed = refund.status === "failed";
          const date = issued ? refund.issued_at : refund.created_at;
          const method =
            refund.method === "wallet"
              ? t("refundDetails.wallet")
              : refund.method === "gateway"
                ? t("refundDetails.originalPayment")
                : t("refundDetails.offline");

          return (
            <li key={refund.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={failed ? "text-danger" : issued ? "text-success" : "text-default-600"}>
                    {issued
                      ? t("refundDetails.completed")
                      : failed
                        ? t("refundDetails.failed")
                        : t("refundDetails.pending")}
                  </p>
                  {date && <p className="text-xs text-default-500">{getFormattedDate(date)}</p>}
                </div>
                <Price value={refund.amount} symbol={order.currency_symbol} format={order.format} className="shrink-0 font-semibold" />
              </div>
              {issued && <p className="text-sm text-default-600">{t("refundDetails.sentTo", { method })}</p>}
              {refund.items.length > 0 && (
                <ul className="space-y-1 text-xs text-default-500">
                  {refund.items.map((item) => (
                    <li key={item.order_item_id}>
                      {item.title}{item.variant_title ? ` · ${item.variant_title}` : ""} · {t("quantity")}: {item.quantity}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
