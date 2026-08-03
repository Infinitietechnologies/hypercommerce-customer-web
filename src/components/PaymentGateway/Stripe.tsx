import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { addToast, Button } from "@heroui/react";

import { brand } from "@/theme/tokens";
import { useSettings } from "@/contexts/SettingsContext";
import { getUserDataFromRedux } from "@/helpers/getters";
import { payOrder } from "@/services/orders";
import { redirectToCheckoutOnRetryLimit } from "@/helpers/paymentRetry";

const CheckoutForm: React.FC<{
  onSuccess: (slug?: string) => void;
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  usageType?: "order" | "wallet";
  orderSlug?: string;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}> = ({
  onError,
  onSuccess,
  isLoading,
  setIsLoading,
  usageType = "order",
  orderSlug,
  triggerRef,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const userData = getUserDataFromRedux();

  // Wait for PaymentElement to be fully ready
  useEffect(() => {
    if (stripe && elements) {
      // Give elements a moment to fully mount
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stripe, elements]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!stripe || !elements) {
        console.error("❌ Stripe or Elements not loaded");
        setMessage("Stripe hasn't loaded yet. Please try again.");
        return;
      }

      if (!isReady) {
        console.error("❌ Payment form not ready");
        setMessage("Payment form is still loading. Please wait...");
        return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/my-account/${
              usageType === "wallet" ? "wallet" : "orders"
            }`,
            receipt_email: userData?.email || "",
          },
          redirect: "if_required",
        });

        if (error) {
          onError();
          addToast({
            title: error.message,
            color: "danger",
          });
          setMessage(error.message || "An unexpected error occurred.");
          return;
        }

        if (!paymentIntent) {
          setMessage("Payment failed. No payment intent returned.");
          onError();
          return;
        }

        // Order already exists (order-first) or wallet recharge — the webhook
        // captures it server-side once payment succeeds.
        onSuccess(usageType === "wallet" ? undefined : orderSlug);
        addToast({
          title:
            usageType === "wallet"
              ? "Wallet Recharged Successfully!"
              : "Order Placed Successfully!",
          color: "success",
        });
      } catch (err) {
        addToast({ title: "An unexpected error occurred.", color: "danger" });
        setMessage("An unexpected error occurred.");
        console.error("Payment error:", err);
        onError();
      } finally {
        setIsLoading(false);
      }
    },
    [
      stripe,
      elements,
      isReady,
      userData?.email,
      usageType,
      orderSlug,
      onSuccess,
      onError,
      setIsLoading,
    ]
  );

  // ✅ Expose handleSubmit via triggerRef for auto-triggering
  useEffect(() => {
    if (triggerRef && stripe && elements && isReady) {
      triggerRef.current = () => handleSubmit();
      console.log("✅ Payment trigger ready");
    }
  }, [stripe, elements, isReady, triggerRef, handleSubmit]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full flex justify-center flex-col items-end"
    >
      <div className="space-y-4 w-full h-full max-w-full overflow-y-scroll max-h-[40vh] px-2">
        <PaymentElement />
      </div>

      {message && (
        <div
          className={`p-3 rounded ${
            message.includes("successful")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
      <Button
        type="submit"
        isDisabled={!stripe || !elements || !isReady || isLoading}
        color="primary"
        isLoading={isLoading}
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

interface StripeProps {
  onSuccess: (slug?: string) => void;
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  usageType?: "order" | "wallet";
  walletOrderData?: any;
  orderSlug?: string;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

const Stripe: React.FC<StripeProps> = ({
  onError,
  onSuccess,
  isLoading,
  setIsLoading,
  usageType = "order",
  walletOrderData,
  orderSlug,
  triggerRef,
}) => {
  const { paymentSettings } = useSettings();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const calledRef = useRef(false);

  // Wallet amount comes from the prepared wallet order.
  const amount = walletOrderData?.transaction?.amount;

  // Dynamically load Stripe when publishable key is available
  const stripePromise = useMemo(() => {
    const key = paymentSettings?.stripePublishableKey || "";
    return key ? loadStripe(key) : null;
  }, [paymentSettings]);

  useEffect(() => {
    // Reset the calledRef when walletOrderData changes
    calledRef.current = false;
    setIsInitializing(true);
    setError("");
    setClientSecret("");
  }, [walletOrderData, usageType, orderSlug]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (calledRef.current) return;
      calledRef.current = true;

      try {
        // For wallet, use existing client secret from walletOrderData
        if (usageType === "wallet") {
          const secret = walletOrderData?.payment_response?.clientSecret;

          if (!secret) {
            setError("Payment initialization failed. Client secret not found.");
            console.error("Wallet client secret missing:", walletOrderData);
            setIsInitializing(false);
            return;
          }

          setClientSecret(secret);
          setIsInitializing(false);
          return;
        }

        // For orders, fetch a fresh Stripe intent for the existing pending order.
        const res = await payOrder(orderSlug || "");
        const secret = res?.data?.payment_response?.clientSecret;

        if (res?.success && secret) {
          setClientSecret(secret);
        } else if (!redirectToCheckoutOnRetryLimit(res)) {
          setError(res?.message || "Failed to initialize payment");
        }
      } catch (err) {
        console.error("Payment intent creation error:", err);
        setError("Failed to initialize payment");
      } finally {
        setIsInitializing(false);
      }
    };

    const ready =
      usageType === "wallet" ? Boolean(amount) : Boolean(orderSlug);
    if (ready) {
      createPaymentIntent();
    } else {
      setIsInitializing(false);
    }
  }, [amount, usageType, walletOrderData, orderSlug]);

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (isInitializing || !clientSecret || !stripePromise) {
    return (
      <div className="flex items-center justify-center p-8">
        <Button isLoading={true} color="primary">
          Loading payment form...
        </Button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: { colorPrimary: brand[500] },
    },
  };

  return (
    <div className="w-full">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          onSuccess={onSuccess}
          onError={onError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          usageType={usageType}
          orderSlug={orderSlug}
          triggerRef={triggerRef}
        />
      </Elements>
    </div>
  );
};

export default Stripe;
