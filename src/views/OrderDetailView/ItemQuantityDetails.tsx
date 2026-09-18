import type { OrderItem } from "@/types/order";
import { useTranslation } from "react-i18next";

export default function ItemQuantityDetails({ item }: { item: OrderItem }) {
  const { t } = useTranslation();
  const quantities = item.quantity_summary;
  if (!quantities || !(quantities.cancelled || quantities.return_requested)) return null;

  return (
    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-default-600">
      {!!quantities.cancelled && (
        <div className="flex gap-1">
          <dt>{t("orderQuantities.cancelled", "Cancelled")}</dt>
          <dd className="font-semibold">{quantities.cancelled}</dd>
        </div>
      )}
      {!!quantities.return_requested && (
        <div className="flex gap-1">
          <dt>{t("orderQuantities.returnRequested", "Requested for return")}</dt>
          <dd className="font-semibold">{quantities.return_requested}</dd>
        </div>
      )}
      {!!quantities.return_received && (
        <div className="flex gap-1">
          <dt>{t("orderQuantities.returnReceived", "Received back by seller")}</dt>
          <dd className="font-semibold">{quantities.return_received}</dd>
        </div>
      )}
    </dl>
  );
}
