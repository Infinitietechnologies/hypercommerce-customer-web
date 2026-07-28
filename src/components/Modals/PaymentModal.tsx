import { FC, useState } from "react";
import { Sheet, Button, toast } from "@/components/ui";
import PaymentMethods from "../PaymentMethods";
import { handleCheckout } from "@/helpers/functionalHelpers";
import { useRouter } from "next/router";
import { updateCartData } from "@/helpers/updators";
import RazorPay from "../PaymentGateway/RazorPay";
import Stripe from "../PaymentGateway/Stripe";
import { useTranslation } from "react-i18next";
import PayStack from "../PaymentGateway/Paystack";
import FlutterwavePayment from "../PaymentGateway/FlutterwavePayment";
import { useDispatch } from "react-redux";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const PaymentModal: FC<PaymentModalProps> = ({ open, onOpenChange }) => {
  const [selectedPayment, setSelectedPayment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleContinue = async () => {
    if (!selectedPayment) {
      return toast({
        title: t("please_select_payment_method"),
        color: "warning",
      });
    }

    if (selectedPayment === "cod") {
      setIsLoading(true);
      try {
        const res = await handleCheckout("cod", {});
        if (res?.success) {
          onOpenChange(false);
          await router.push("/my-account/orders");
          dispatch(setPromoCode(""));
        }
      } finally {
        setIsLoading(false);
        updateCartData(true, false);
      }
    } else if (selectedPayment === "directBankTransfer") {
      document.getElementById("bank_transfer_modal_btn")?.click();
    }
  };

  const handlePaymentSuccess = async () => {
    onOpenChange(false);
    await router.push("/my-account/orders");
  };

  const handleError = () => {
    // onOpenChange(false);
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
          {(selectedPayment === "cod" ||
            selectedPayment === "directBankTransfer") && (
            <Button
              color="primary"
              onPress={handleContinue}
              isLoading={isLoading}
              className="w-full"
            >
              {t("continue")}
            </Button>
          )}

          {selectedPayment === "stripePayment" && (
            <Stripe
              onSuccess={handlePaymentSuccess}
              onError={handleError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {selectedPayment === "razorpayPayment" && (
            <RazorPay
              onSuccess={handlePaymentSuccess}
              onError={handleError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {selectedPayment === "paystackPayment" && (
            <PayStack
              onSuccess={handlePaymentSuccess}
              onError={handleError}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
              usageType="order"
            />
          )}

          {selectedPayment === "flutterwavePayment" && (
            <FlutterwavePayment
              onSuccess={handlePaymentSuccess}
              onError={handleError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
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
