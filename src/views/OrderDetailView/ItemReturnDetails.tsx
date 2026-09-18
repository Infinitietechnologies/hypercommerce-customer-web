import type { OrderItemReturnRequest } from "@/types/order";
import { useTranslation } from "react-i18next";
import { getFormattedDate } from "@/helpers/getters";

interface Props {
  returns?: OrderItemReturnRequest[];
  showRefundAmount: boolean;
  formatPrice: (amount: number) => string;
  embedded?: boolean;
}

export default function ItemReturnDetails({ returns, showRefundAmount, formatPrice, embedded = false }: Props) {
  const { t } = useTranslation();
  if (!returns?.length) return null;

  return (
    <section className="border-t border-divider p-4">
      {!embedded && <h3 className="mb-2 text-sm font-semibold">{t("orderReturns.heading", "Return requests")}</h3>}
      <div className="divide-y divide-divider">
        {[...returns].sort((a, b) => b.id - a.id).map((request) => (
          <details key={request.id} open={embedded} className="py-2">
            <summary className="cursor-pointer text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning">
              <span className="font-medium">{request.customer_status?.label || t("orderReturns.request", "Return request")}</span>
              {request.quantity != null && <span className="ms-2 text-default-500">{t("qty")}: {request.quantity}</span>}
              <span className="ms-2 text-xs text-default-500">{getFormattedDate(request.created_at)}</span>
            </summary>
            <dl className="mt-3 space-y-2 text-xs">
              {showRefundAmount && (
                <div className="flex justify-between gap-3">
                  <dt className="text-default-500">{t("orderRefunds.returnAmount", "Return amount")}</dt>
                  <dd>{formatPrice(request.refund_amount)}</dd>
                </div>
              )}
              {(request.reason_label || request.reason) && (
                <div>
                  <dt className="text-default-500">{t("pages.order.reason", "Reason")}</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words">
                    {request.reason_label || request.reason}
                    {request.reason_label && request.reason && request.reason !== request.reason_code && request.reason !== request.reason_label && (
                      <p className="mt-1">{request.reason}</p>
                    )}
                  </dd>
                </div>
              )}
              {request.return_timeline?.filter((step) => step.at).map((step) => (
                <div key={step.key} className="flex justify-between gap-3">
                  <dt className="text-default-500">{step.label}</dt>
                  <dd className="text-end">{getFormattedDate(step.at!)}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}
