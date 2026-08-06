import { useSettings } from "@/contexts/SettingsContext";
import { getUserDataFromRedux } from "@/helpers/getters";
import { payOrder } from "@/services/orders";
import { redirectToCheckoutOnRetryLimit } from "@/helpers/paymentRetry";
import { RazorpayOrderData } from "@/types/ApiResponse";
import { addToast, Button } from "@heroui/react";
import React, { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// ✅ Razorpay Types
interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentFailure {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  image?: string | undefined;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayPaymentFailure) => void
  ) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RazorPay: FC<{
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
  const { paymentSettings } = useSettings();
  const userData = getUserDataFromRedux();

  // ✅ Load Razorpay script dynamically
  useEffect(() => {
    if (document.getElementById("razorpay-sdk")) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => console.error("Razorpay SDK failed to load.");
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("razorpay-sdk");
      if (existing) existing.remove();
    };
  }, []);

  const handlePayment = useCallback(async () => {
    if (!sdkReady) {
      console.error("Razorpay SDK not ready yet.");
      return;
    }

    setIsLoading(true);

    try {
      let options: RazorpayOptions;

      // ✅ Wallet Flow: Use pre-prepared order data
      if (usageType === "wallet") {
        if (!walletOrderData?.payment_response) {
          addToast({
            title: t("paymentGateway.invalidWalletOrder"),
            color: "danger",
          });
          setIsLoading(false);
          return console.error("Wallet order data is missing");
        }

        const order = {
          id: walletOrderData.payment_response.id,
          amount: walletOrderData.payment_response.amount,
          currency: walletOrderData.payment_response.currency,
          receipt: walletOrderData.payment_response.receipt,
        } as RazorpayOrderData;

        options = {
          key: paymentSettings?.razorpayKeyId || "",
          // Already the integer minor-unit figure the gateway expects — a
          // /100 then *100 round trip only introduces float error.
          amount: order.amount,
          currency: order.currency,
          description: t("paymentGateway.walletRechargeDescription"),
          order_id: order.id,
          handler: async () => {
            setIsConfirming(true);
            onSuccess();
            addToast({
              title: t("paymentGateway.walletRechargeSubmitted"),
              color: "success",
            });
            setIsLoading(false);
          },
          prefill: {
            name: userData?.name || "",
            email: userData?.email || "",
            contact: userData?.mobile || "",
          },
          notes: walletOrderData?.payment_response?.notes || {
            timeOfPayment: order.receipt,
          },
          modal: {
            ondismiss: () => {
              addToast({
                title: t("paymentGateway.cancelled"),
                description: t("paymentGateway.cancelledRazorpay"),
                color: "warning",
              });
              setIsConfirming(false);
              setIsLoading(false);
              onError();
            },
            confirm_close: true,
          },
        };
      } else {
        // Open Razorpay for the existing pending order via its /pay intent.
        const res = await payOrder(orderSlug || "");
        const pr = res?.data?.payment_response;

        if (!res?.success || !pr?.razorpay_order_id || !orderSlug) {
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

        options = {
          key: pr.key_id || paymentSettings?.razorpayKeyId || "",
          amount: pr.amount || 0,
          currency: pr.currency || "INR",
          description: t("paymentGateway.paySafe"),
          order_id: pr.razorpay_order_id,
          handler: async () => {
            setIsConfirming(true);
            onSuccess(orderSlug);
          },
          prefill: {
            name: userData?.name || "",
            email: userData?.email || "",
            contact: userData?.mobile || "",
          },
          notes: { orderSlug },
          modal: {
            ondismiss: () => {
              addToast({
                title: t("paymentGateway.cancelled"),
                description: t("paymentGateway.cancelledRazorpay"),
                color: "warning",
              });
              setIsConfirming(false);
              setIsLoading(false);
              onError();
            },
            confirm_close: true,
          },
        };
      }

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response: RazorpayPaymentFailure) => {
        console.error("Payment failed:", response.error);
        addToast({
          title: t("paymentGateway.failed"),
          description: response.error.description,
          color: "danger",
        });
        onError();
        setIsLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      addToast({
        title: t("error"),
        description: t("paymentGateway.initFailed"),
        color: "danger",
      });
      onError();
    } finally {
      setIsLoading(false);
    }
  }, [
    sdkReady,
    setIsLoading,
    usageType,
    walletOrderData,
    paymentSettings,
    onSuccess,
    onError,
    userData,
    setIsConfirming,
    orderSlug,
    t,
  ]);

  // ✅ Expose handlePayment via triggerRef for auto-triggering
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = handlePayment;
    }
  }, [sdkReady, walletOrderData, triggerRef, handlePayment]);

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
            ? "Pay with Razorpay"
            : "Pay with Razorpay"
        : "Loading..."}
    </Button>
  );
};

export default RazorPay;
