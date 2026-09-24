import type { OrderItemReturnRequest } from "@/types/order";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Button, Chip } from "@/components/ui";

interface Props {
  returns?: OrderItemReturnRequest[];
  onCancelReturn?: (returnId: number) => void;
  cancellingReturnId?: number | null;
}

function statusColor(status: string): "success" | "danger" | "warning" | "primary" {
  if (["declined", "cancelled"].includes(status)) return "danger";
  if (["approved", "in_transit", "received", "refunded", "closed"].includes(status)) return "success";
  return "warning";
}

export default function ItemReturnDetails({ returns, onCancelReturn, cancellingReturnId }: Props) {
  const { t } = useTranslation();
  if (!returns?.length) return null;

  const request = [...returns].sort((a, b) => b.id - a.id)[0];
  const canCancelReturn = ["requested", "approved"].includes(request.return_status);

  return (
    <section className="border-t border-divider p-3">
      <div className="rounded-medium bg-default-50 px-3 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-content1 text-primary-600">
            <Icon icon="solar:box-linear" width={17} height={17} />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold">
            {t("orderReturns.request", "Return request")}
          </span>
          <Chip size="sm" radius="sm" variant="flat" color={statusColor(request.return_status)} classNames={{ content: "text-xs font-medium" }}>
            {request.customer_status?.label || request.return_status}
          </Chip>
        </div>
        {request.customer_status?.description && (
          <p className="mt-2 ps-11 text-xs leading-5 text-default-500">
            {request.customer_status.description}
          </p>
        )}
        {onCancelReturn && canCancelReturn && (
          <div className="mt-3 flex justify-end border-t border-divider pt-2.5">
            <Button
              size="sm"
              variant="light"
              color="danger"
              className="h-8 px-2 text-xs font-semibold"
              isLoading={cancellingReturnId === request.id}
              onPress={() => onCancelReturn(request.id)}
            >
              {t("cancelReturnRequestButton", "Cancel return request")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
