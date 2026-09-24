import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Chip } from "@/components/ui";
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

  const total = rows.reduce((sum, refund) => sum + refund.amount, 0);

  return (
    <section className="border-t border-divider p-3">
      {rows.length > 1 && (
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <span className="text-xs font-medium text-default-500">{t("orderRefunds.total", "Total refund")}</span>
          <span className="text-sm font-semibold">{formatPrice(total)}</span>
        </div>
      )}
      <ul className="space-y-2">
        {rows.map((refund) => (
          <li key={refund.id} className="flex items-center gap-3 rounded-medium bg-default-50 px-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-content1 text-primary-600">
              <Icon icon={refund.method === "wallet" ? "solar:wallet-money-linear" : "solar:card-linear"} width={17} height={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t(`orderRefunds.method.${refund.method}`)}</span>
              {(refund.issued_at || refund.created_at) && (
                <span className="mt-0.5 block text-xs text-default-500">{getFormattedDate(refund.issued_at || refund.created_at || "")}</span>
              )}
            </span>
            <span className="shrink-0 text-end">
              <span className="block text-sm font-semibold">{formatPrice(refund.amount)}</span>
              <Chip
                size="sm"
                radius="sm"
                variant="flat"
                color={refund.status === "failed" ? "danger" : refund.status === "issued" ? "success" : "warning"}
                className="mt-1"
                classNames={{ content: "text-[11px] font-medium" }}
              >
                {t(`orderRefunds.status.${refund.status}`)}
              </Chip>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
