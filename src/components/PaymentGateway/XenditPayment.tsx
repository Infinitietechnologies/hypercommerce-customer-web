import { Button, toast } from "@/components/ui";
import { redirectToCheckoutOnRetryLimit } from "@/helpers/paymentRetry";
import { isValidHttpsUrl } from "@/helpers/validator";
import { payOrder } from "@/services/orders";
import { FC } from "react";
import { useTranslation } from "react-i18next";

const XenditPayment: FC<{
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  orderSlug?: string;
}> = ({ onError, isLoading, setIsLoading, orderSlug }) => {
  const { t } = useTranslation();

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await payOrder(orderSlug || "");
      const link = response?.data?.payment_response?.link;

      if (response?.success && link && isValidHttpsUrl(link)) {
        window.location.assign(link);
        return;
      }

      if (redirectToCheckoutOnRetryLimit(response)) {
        return;
      }

      toast({
        title: response?.message || t("paymentGateway.startFailed"),
        description: link ? t("payments.xendit.invalidLink") : undefined,
        color: "danger",
      });
      onError();
    } catch (error) {
      console.error("Xendit payment initiation failed", error);
      onError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button color="primary" isLoading={isLoading} onPress={handlePayment} className="w-full">
      {t("payments.xendit.payButton")}
    </Button>
  );
};

export default XenditPayment;
