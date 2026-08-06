import { payOrder } from "@/services/orders";
import { redirectToCheckoutOnRetryLimit } from "@/helpers/paymentRetry";
import { addToast, Button } from "@heroui/react";
import React, { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// ✅ PayStack Types
interface PayStackResponse {
  reference: string;
  status: string;
  message: string;
  trans: string;
  transaction: string;
  trxref: string;
}

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction(
        accessCode: string,
        options: {
          onSuccess: (response: PayStackResponse) => void;
          onCancel: () => void;
        }
      ): void;
    };
  }
}

const PayStack: FC<{
  onSuccess: (slug?: string) => void;
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  usageType?: "order" | "wallet";
  walletOrderData?: any;
  orderSlug?: string;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}> = ({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
  usageType = "order",
  walletOrderData,
  orderSlug,
  triggerRef,
}) => {
  const { t } = useTranslation();
  const [sdkReady, setSdkReady] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // ✅ Load PayStack script dynamically
  useEffect(() => {
    if (document.getElementById("paystack-sdk")) {
      queueMicrotask(() => setSdkReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "paystack-sdk";
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => console.error("PayStack SDK failed to load.");
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("paystack-sdk");
      if (existing) existing.remove();
    };
  }, []);

  const handlePayment = React.useCallback(async () => {
    if (!sdkReady || !window.PaystackPop) {
      console.error("PayStack SDK not ready yet.");
      return;
    }

    setIsLoading(true);

    try {
      let accessCode: string | undefined;

      // ✅ Wallet Flow: Use pre-prepared order data
      if (usageType === "wallet") {
        if (!walletOrderData?.payment_response?.access_code) {
          addToast({
            title: t("paymentGateway.invalidWalletOrder"),
            color: "danger",
          });
          setIsLoading(false);
          return console.error("Wallet order data is missing");
        }

        accessCode = walletOrderData.payment_response.access_code;
      } else {
        // Open Paystack for the existing pending order via its /pay intent.
        const res = await payOrder(orderSlug || "");
        const pr = res?.data?.payment_response;

        if (!res?.success || !pr?.access_code || !orderSlug) {
          if (redirectToCheckoutOnRetryLimit(res)) {
            setIsLoading(false);
            return;
          }
          addToast({
            title: res?.message || t("paymentGateway.startFailed"),
            color: "danger",
          });
          setIsLoading(false);
          onError();
          return;
        }

        accessCode = pr.access_code;
      }

      if (!accessCode) {
        setIsLoading(false);
        onError();
        return;
      }

      const confirmSuccess = () => {
        setIsConfirming(true);
        onSuccess(usageType === "wallet" ? undefined : orderSlug);
        addToast({
          title:
            usageType === "wallet"
              ? t("paymentGateway.walletRechargeSubmitted")
              : t("paymentGateway.orderPlaced"),
          color: "success",
        });
        setIsLoading(false);
      };

      const popup = new window.PaystackPop();

      popup.resumeTransaction(accessCode, {
        onSuccess: () => confirmSuccess(),
        onCancel: () => {
          addToast({
            title: t("paymentGateway.cancelled"),
            description: t("paymentGateway.cancelledPaystack"),
            color: "warning",
          });
          setIsConfirming(false);
          setIsLoading(false);
          onError();
        },
      });

      setIsLoading(false);
    } catch (err) {
      console.error(err);
      addToast({
        title: t("error"),
        description: t("paymentGateway.initFailed"),
        color: "danger",
      });
      onError();
      setIsLoading(false);
    }
  }, [
    sdkReady,
    setIsLoading,
    usageType,
    walletOrderData,
    onSuccess,
    onError,
    setIsConfirming,
    orderSlug,
    t,
  ]);

  // ✅ Expose handlePayment via triggerRef for auto-triggering
  useEffect(() => {
    if (triggerRef && sdkReady && !isLoading && !isConfirming) {
      triggerRef.current = () => {
        if (!isLoading && !isConfirming) {
          handlePayment();
        }
      };
    }
  }, [
    sdkReady,
    walletOrderData,
    triggerRef,
    isLoading,
    isConfirming,
    handlePayment,
  ]);

  return (
    <Button
      onPress={handlePayment}
      isDisabled={!sdkReady}
      color="primary"
      isLoading={isLoading || isConfirming}
    >
      {sdkReady
        ? isConfirming
          ? "Confirming"
          : usageType === "wallet"
            ? "Pay with PayStack"
            : "Pay with PayStack"
        : "Loading..."}
    </Button>
  );
};

export default PayStack;
