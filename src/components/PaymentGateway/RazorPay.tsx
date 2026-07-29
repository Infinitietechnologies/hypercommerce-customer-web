import { useSettings } from "@/contexts/SettingsContext";
import { getUserDataFromRedux } from "@/helpers/getters";
import { payOrder } from "@/services/orders";
import { RazorpayOrderData } from "@/types/ApiResponse";
import { addToast, Button } from "@heroui/react";
import React, { FC, useCallback, useEffect, useState } from "react";

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
            title: "Invalid wallet order data",
            color: "danger",
          });
          setIsLoading(false);
          return console.error("Wallet order data is missing");
        }

        const order = {
          id: walletOrderData.payment_response.id,
          amount: walletOrderData.payment_response.amount / 100,
          currency: walletOrderData.payment_response.currency,
          receipt: walletOrderData.payment_response.receipt,
        } as RazorpayOrderData;

        options = {
          key: paymentSettings?.razorpayKeyId || "",
          amount: order.amount * 100,
          currency: order.currency,
          description: "Wallet Recharge",
          order_id: order.id,
          handler: async () => {
            setIsConfirming(true);
            onSuccess();
            addToast({
              title: "Wallet Recharged Successfully!",
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
                title: "Payment Cancelled",
                description: "You have closed the Razorpay checkout.",
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
          addToast({
            title: res?.message || "Failed to start payment",
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
          description: "Pay Safe",
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
                title: "Payment Cancelled",
                description: "You have closed the Razorpay checkout.",
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
          title: "Payment Failed",
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
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
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
