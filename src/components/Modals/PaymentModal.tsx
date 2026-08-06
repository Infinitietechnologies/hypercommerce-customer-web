import { FC, useState } from "react";
import { Sheet, Button, toast } from "@/components/ui";
import PaymentMethods from "../PaymentMethods";
import { handleCheckout, ensureIdempotencyKey } from "@/helpers/functionalHelpers";
import { useRouter } from "next/router";
import { updateCartData } from "@/helpers/updators";
import { useTranslation } from "react-i18next";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const PaymentModal: FC<PaymentModalProps> = ({ open, onOpenChange }) => {
  const [selectedPayment, setSelectedPayment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleContinue = async () => {
    if (!selectedPayment) {
      return toast({
        title: t("please_select_payment_method"),
        color: "warning",
      });
    }

    if (selectedPayment === "directBankTransfer") {
      document.getElementById("bank_transfer_modal_btn")?.click();
      return;
    }

    setIsLoading(true);
    try {
      // Fresh idempotency key per submit — so switching the gateway always
      // creates a new order with the chosen gateway (a double-tap is blocked
      // by the disabled button, not by key reuse).
      ensureIdempotencyKey(selectedPayment);

      const res = await handleCheckout(selectedPayment, {});
      if (!res?.success) {
        toast({
          title: res?.message || t("checkout.failed.title"),
          color: "danger",
        });
        return;
      }

      const slug = res?.data?.slug;
      onOpenChange(false);

      if (selectedPayment === "cod" || selectedPayment === "wallet") {
        await router.push(
          slug ? `/my-account/orders/${slug}` : "/my-account/orders",
        );
      } else {
        await router.push(`/payment/${slug}`);
      }
    } finally {
      setIsLoading(false);
      updateCartData(true, false);
    }
  };

  return (
    <Sheet
      isOpen={open}
      onOpenChange={onOpenChange}
      backdrop="blur"
      size="xl"
      title={
        <h2 className="text-base font-bold">{t("select_payment_method")}</h2>
      }
      footer={
        <div className="w-full">
          <Button
            color="primary"
            onPress={handleContinue}
            isLoading={isLoading}
            className="w-full"
          >
            {t("continue")}
          </Button>
        </div>
      }
    >
      <PaymentMethods
        selectedPayment={selectedPayment}
        setSelectedPayment={setSelectedPayment}
        hideCOD={false}
        isLoading={isLoading}
      />
    </Sheet>
  );
};

export default PaymentModal;
