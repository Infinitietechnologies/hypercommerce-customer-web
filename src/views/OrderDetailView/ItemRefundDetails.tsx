import { useTranslation } from "react-i18next";
import type { OrderRefund } from "@/types/order";
import { getFormattedDate } from "@/helpers/getters";
import { getItemRefunds } from "./refunds";

interface Props {
  refunds?: OrderRefund[];
  itemId: number;
  formatPrice: (amount: number) => string;
}

export default function ItemRefundDetails({ refunds, itemId, formatPrice }: Props) {
  const { t } = useTranslation();
  const rows = getItemRefunds(refunds, itemId);
  if (!rows.length) return null;

  return (
    <section className="border-t border-divider p-4" aria-label={t("orderRefunds.heading")}>
      <h3 className="mb-3 text-sm font-semibold">{t("orderRefunds.heading")}</h3>
      <ul className="space-y-3">
        {rows.map((refund) => (
          <li key={refund.id} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium">{t(`orderRefunds.status.${refund.status}`)}</div>
              <div className="text-xs text-default-500">
                {t("orderRefunds.quantity", { count: refund.quantity })}
                {" · "}{t(`orderRefunds.method.${refund.method}`)}
              </div>
              {(refund.issued_at || refund.created_at) && (
                <div className="mt-1 text-xs text-default-500">
                  {getFormattedDate(refund.issued_at || refund.created_at || "")}
                </div>
              )}
            </div>
            <span className="shrink-0 font-semibold">{formatPrice(refund.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
