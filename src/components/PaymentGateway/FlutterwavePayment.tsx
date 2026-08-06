import { payOrder } from "@/services/orders";
import { redirectToCheckoutOnRetryLimit } from "@/helpers/paymentRetry";
import { addToast, Button } from "@heroui/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

const FlutterwavePayment: FC<{
  onSuccess: (slug?: string) => void;
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  orderSlug?: string;
}> = ({ onError, isLoading, setIsLoading, orderSlug }) => {
  const { t } = useTranslation();
  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const res = await payOrder(orderSlug || "");
      const link = res?.data?.payment_response?.link;
      if (res?.success && link) {
        window.location.href = link;
        return;
      }
      if (redirectToCheckoutOnRetryLimit(res)) {
        return;
      }
      addToast({
        title: res?.message || t("paymentGateway.startFailed"),
        color: "danger",
      });
      onError();
    } catch (err) {
      console.error(err);
      onError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button color="primary" isLoading={isLoading} onPress={handlePayment}>
      Pay With Flutterwave
    </Button>
  );
};

export default FlutterwavePayment;
