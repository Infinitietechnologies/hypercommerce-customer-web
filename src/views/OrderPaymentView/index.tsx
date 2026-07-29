import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Button, Spinner, toast } from "@/components/ui";
import { setIdempotencyKey } from "@/lib/redux/slices/checkoutSlice";
import { useSettings } from "@/contexts/SettingsContext";
import RazorPay from "@/components/PaymentGateway/RazorPay";
import Stripe from "@/components/PaymentGateway/Stripe";
import PayStack from "@/components/PaymentGateway/Paystack";
import FlutterwavePayment from "@/components/PaymentGateway/FlutterwavePayment";
import { getSpecificOrders } from "@/services/orders";
import { Order } from "@/types/order";

type Phase = "loading" | "pay" | "waiting" | "success" | "failed";

const OrderPaymentView: FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { formatPrice } = useSettings();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";

  const [order, setOrder] = useState<Order | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [isLoading, setIsLoading] = useState(false);

  // Load the order and gate on its state.
  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      const res = await getSpecificOrders({ slug });
      if (!active) return;
      const o = res?.data;
      if (!res?.success || !o) {
        toast({
          title: res?.message || t("checkout.failed.title"),
          color: "danger",
        });
        router.replace("/my-account/orders");
        return;
      }
      if (o.payment_status === "completed") {
        dispatch(setIdempotencyKey(""));
        router.replace(`/my-account/orders/${slug}`);
        return;
      }
      setOrder(o);
      setPhase("pay");
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const onError = () => setPhase("failed");
  const onSuccess = () => setPhase("waiting");

  // Waiting: poll the order until the webhook confirms/fails it (~90s).
  useEffect(() => {
    if (phase !== "waiting" || !slug) return;
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!active) return;
      const res = await getSpecificOrders({ slug });
      const status = res?.data?.payment_status;

      if (status === "completed") {
        setPhase("success");
        return;
      }
      if (status === "failed" || res?.data?.status === "cancelled") {
        setPhase("failed");
        return;
      }
      attempts += 1;
      if (attempts >= 30) {
        toast({
          title: t("checkout.paymentPending", {
            defaultValue: "We'll notify you once your payment is confirmed.",
          }),
          color: "warning",
        });
        router.push("/my-account/orders");
        return;
      }
      timer = setTimeout(poll, 3000);
    };

    timer = setTimeout(poll, 2000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slug]);

  // Success → order detail.
  useEffect(() => {
    if (phase !== "success") return;
    dispatch(setIdempotencyKey(""));
    toast({
      title: t("checkout.paymentConfirmed", { defaultValue: "Payment confirmed" }),
      color: "success",
    });
    const timer = setTimeout(
      () => router.push(`/my-account/orders/${slug}`),
      1200,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slug]);

  const cancel = () => router.push("/cart/checkout");

  if (phase === "loading" || !order) {
    return (
      <div className="max-w-md mx-auto flex justify-center py-16">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-6 py-16">
        <Spinner size="lg" color="primary" />
        <p className="text-sm text-default-500 text-center">
          {t("checkout.confirmingPayment", {
            defaultValue: "Confirming payment…",
          })}
        </p>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-4 py-16">
        <p className="text-lg font-medium text-success">
          {t("checkout.paymentConfirmed", { defaultValue: "Payment confirmed" })}
        </p>
      </div>
    );
  }

  const gatewayProps = {
    onSuccess,
    onError,
    isLoading,
    setIsLoading,
    usageType: "order" as const,
    orderSlug: slug,
  };

  const gateway = (() => {
    switch (order.payment_method) {
      case "razorpayPayment":
        return <RazorPay {...gatewayProps} />;
      case "stripePayment":
        return <Stripe {...gatewayProps} />;
      case "paystackPayment":
        return <PayStack {...gatewayProps} />;
      case "flutterwavePayment":
        return (
          <FlutterwavePayment
            onSuccess={onSuccess}
            onError={onError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            orderSlug={slug}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4 py-6">
      <h1 className="text-lg font-medium">
        {t("pageTitle.payment", { defaultValue: "Payment" })}
      </h1>

      <div className="flex items-center justify-between rounded-large border border-default-200 p-4">
        <span className="text-sm text-default-500">
          {t("cart.total", { defaultValue: "Total payable" })}
        </span>
        <span className="font-medium">{formatPrice(order.total_payable)}</span>
      </div>

      {phase === "failed" && (
        <p className="text-sm text-danger">
          {t("checkout.paymentFailed", { defaultValue: "Payment failed" })}
        </p>
      )}

      <div className="w-full">{gateway}</div>

      <Button variant="light" onPress={cancel}>
        {t("cancel", { defaultValue: "Cancel" })}
      </Button>
    </div>
  );
};

export default OrderPaymentView;
