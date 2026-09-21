import type { OrderItemReturnRequest } from "@/types/order";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { getFormattedDate } from "@/helpers/getters";

interface Props {
  returns?: OrderItemReturnRequest[];
  showRefundAmount: boolean;
  formatPrice: (amount: number) => string;
  embedded?: boolean;
}

function returnTone(status: string) {
  if (["refunded", "closed", "received"].includes(status)) {
    return { icon: "solar:check-circle-bold", iconClass: "bg-success-50 text-success-700" };
  }
  if (["declined", "cancelled"].includes(status)) {
    return { icon: "solar:close-circle-bold", iconClass: "bg-danger-50 text-danger" };
  }
  return { icon: "solar:refresh-circle-bold", iconClass: "bg-primary-50 text-primary-600" };
}

function latestActivity(request: OrderItemReturnRequest) {
  return request.refund_processed_at || request.received_at || request.picked_up_at || request.seller_approved_at || request.created_at;
}

export default function ItemReturnDetails({ returns, showRefundAmount, formatPrice, embedded = false }: Props) {
  const { t } = useTranslation();
  if (!returns?.length) return null;
  const ordered = [...returns].sort((a, b) => Date.parse(latestActivity(b)) - Date.parse(latestActivity(a)));

  return (
    <section className={embedded ? "border-t border-divider p-3" : "border-t border-divider p-4"}>
      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-foreground">
        <Icon icon="solar:document-add-linear" width={16} height={16} className="text-primary-600" />
        <h3>{t("orderReturns.heading", "Return requests")}</h3>
      </div>
      <div className="space-y-2">
        {ordered.map((request, index) => {
          const tone = returnTone(request.return_status);
          const shipment = request.source_shipment;
          return (
            <details key={request.id} open={index === 0} className="group overflow-hidden rounded-medium border border-divider bg-content1">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-default-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.iconClass}`}>
                  <Icon icon={tone.icon} width={16} height={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">{request.customer_status?.label || t("orderReturns.request", "Return request")}</span>
                  <span className="block text-xs text-default-500">
                    {t("qty")}: {request.quantity ?? 1}
                    {request.source_shipment_id ? ` · ${t("pages.order.returnShipment", "Shipment")} #${request.source_shipment_id}` : ""}
                  </span>
                </span>
                <span className="hidden shrink-0 text-end text-xs text-default-500 sm:block">{getFormattedDate(latestActivity(request))}</span>
                <Icon icon="solar:alt-arrow-down-linear" width={16} height={16} className="shrink-0 text-default-500 transition-transform group-open:rotate-180" />
              </summary>
              <dl className="grid gap-3 border-t border-divider bg-default-50/40 px-3 py-3 text-xs sm:grid-cols-3">
                <div className="min-w-0 border-divider sm:border-e sm:pe-4">
                  <dt className="text-default-500">{t("pages.order.returnShipment", "Shipment")}</dt>
                  <dd className="mt-1 break-words font-medium">
                    {shipment ? `#${shipment.id}${shipment.carrier_name ? ` · ${shipment.carrier_name}` : ""}${shipment.tracking_number ? ` · ${shipment.tracking_number}` : ""}` : request.source_shipment_id ? `#${request.source_shipment_id}` : "—"}
                  </dd>
                </div>
                <div className="min-w-0 border-divider sm:border-e sm:pe-4">
                  <dt className="text-default-500">{t("pages.order.reason", "Reason")}</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words font-medium">
                    {request.reason_label || request.reason || "—"}
                    {request.reason_label && request.reason && request.reason !== request.reason_code && request.reason !== request.reason_label && <span className="mt-1 block font-normal">{request.reason}</span>}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-default-500">{t("orderReturns.requested", "Requested")}</dt>
                  <dd className="mt-1 font-medium">{getFormattedDate(request.created_at)}</dd>
                  {showRefundAmount && <dd className="mt-2 text-default-500">{t("orderRefunds.returnAmount", "Return amount")}: <span className="font-semibold text-foreground">{formatPrice(request.refund_amount)}</span></dd>}
                </div>
              </dl>
            </details>
          );
        })}
      </div>
    </section>
  );
}
