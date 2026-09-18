import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { OrderItem } from "@/types/order";
import { Button, Sheet, toastError, toastSuccess } from "@/components/ui";
import { cancelOrderItem } from "@/services/orders";

interface Props {
  item: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function CancelItemSheet({ item, isOpen, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const quantity = item.can_cancel ? item.cancelable_quantity : 0;
  const close = () => { if (!submitting) onClose(); };
  const submit = async () => {
    if (submitting || quantity < 1) return;
    setSubmitting(true);
    try {
      const result = await cancelOrderItem({ orderItemId: String(item.id) });
      if (!result.success) {
        toastError(result.message || t("something_went_wrong"));
        return;
      }
      toastSuccess(result.message || t("cancel_item_success_title"));
      onDone();
    } catch {
      toastError(t("something_went_wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={close} title={t("confirm_cancel_item")} size="md" footer={
      <div className="flex w-full gap-2">
        <Button variant="bordered" className="flex-1" onPress={close} isDisabled={submitting}>{t("close")}</Button>
        <Button color="danger" className="flex-1" onPress={submit} isLoading={submitting} isDisabled={quantity < 1}>{t("yes_cancel")}</Button>
      </div>
    }>
      <div className="space-y-3 pb-3">
        <p className="text-sm font-semibold">{item.title}</p>
        {item.variant_title && <p className="text-xs text-default-500">{item.variant_title}</p>}
        <p className="text-sm">{t("orderCancellation.quantity", { count: quantity, defaultValue: "Quantity to cancel: {{count}}" })}</p>
        <p className="text-xs text-default-500">{t("orderCancellation.hint", "Only the eligible units of this item will be cancelled. Shipped units stay unchanged.")}</p>
      </div>
    </Sheet>
  );
}
