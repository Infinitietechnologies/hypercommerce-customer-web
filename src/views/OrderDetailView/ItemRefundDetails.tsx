import { Icon } from "@iconify/react";
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
    <details open className="group mx-3 mb-3 overflow-hidden rounded-medium border border-divider bg-default-50/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <Icon icon="solar:wallet-money-linear" width={17} height={17} className="text-primary-600" />
        <span className="flex-1 text-xs font-semibold">{t("orderRefunds.heading", "Refund updates")}</span>
        <Icon icon="solar:alt-arrow-down-linear" width={16} height={16} className="text-default-500 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="space-y-2 border-t border-divider p-2.5">
        {rows.map((refund) => (
          <li key={refund.id} className="flex items-center gap-2.5 rounded-small bg-content1 p-2.5 text-sm">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${refund.status === "failed" ? "bg-danger-50 text-danger" : refund.status === "issued" ? "bg-success-50 text-success-700" : "bg-primary-50 text-primary-600"}`}>
              <Icon icon={refund.status === "failed" ? "solar:close-circle-bold" : refund.status === "issued" ? "solar:check-circle-bold" : "solar:clock-circle-bold"} width={16} height={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t(`orderRefunds.status.${refund.status}`)}</span>
              <span className="block text-xs text-default-500">{t("orderRefunds.quantity", { count: refund.quantity })} · {t(`orderRefunds.method.${refund.method}`)}</span>
            </span>
            <span className="shrink-0 text-end">
              <span className="block font-semibold">{formatPrice(refund.amount)}</span>
              {(refund.issued_at || refund.created_at) && <span className="block text-xs text-default-500">{getFormattedDate(refund.issued_at || refund.created_at || "")}</span>}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
