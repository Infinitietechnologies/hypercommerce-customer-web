import { useSettings } from "@/contexts/SettingsContext";
import { getCartDataFromRedux } from "@/helpers/getters";
import { Image, Radio, RadioGroup, ScrollShadow } from "@heroui/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface PaymentMethodsProps {
  selectedPayment: string;
  setSelectedPayment: (value: string) => void;
  hideCOD: boolean;
  isLoading: boolean;
}

const PaymentMethods: FC<PaymentMethodsProps> = ({
  selectedPayment,
  setSelectedPayment,
  hideCOD = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { paymentSettings } = useSettings();

  const cartData = getCartDataFromRedux();
  const codAvailable = cartData?.payment_summary?.cod_available ?? true;

  const allMethods = [
    {
      id: "cod",
      name: t("payments.cod.name"),
      tagline: t("payments.cod.tagline"),
      icon: "/Payments/cod.png",
      isEnabled: paymentSettings?.cod === true && !hideCOD,
      disabled: !codAvailable,
      disabledReason: t("payments.cod.notAvailable", {
        defaultValue: "Not available for this order",
      }),
    },
    {
      id: "directBankTransfer",
      name: t("payments.directBankTransfer.name"),
      tagline: t("payments.directBankTransfer.tagline"),
      icon: "/Payments/bank_transfer.png",
      isEnabled: false,
      disabled: false,
      disabledReason: "",
    },
    {
      id: "stripePayment",
      name: t("payments.stripe.name"),
      tagline: t("payments.stripe.tagline"),
      icon: "/Payments/stripe.png",
      isEnabled: paymentSettings?.stripePayment === true,
      disabled: false,
      disabledReason: "",
    },
    {
      id: "flutterwavePayment",
      name: t("payments.flutterwave.name"),
      tagline: t("payments.flutterwave.tagline"),
      icon: "/Payments/flutterwave.png",
      isEnabled: paymentSettings?.flutterwavePayment === true,
      disabled: false,
      disabledReason: "",
    },
    {
      id: "paypal",
      name: t("payments.paypal.name"),
      tagline: t("payments.paypal.tagline"),
      icon: "/Payments/paypal.png",
      isEnabled: false,
      disabled: false,
      disabledReason: "",
    },
    {
      id: "razorpayPayment",
      name: t("payments.razorpay.name"),
      tagline: t("payments.razorpay.tagline"),
      icon: "/Payments/razorpay.png",
      isEnabled: paymentSettings?.razorpayPayment === true,
      disabled: false,
      disabledReason: "",
    },
    {
      id: "paystackPayment",
      name: t("payments.paystack.name"),
      tagline: t("payments.paystack.tagline"),
      icon: "/Payments/paystack.png",
      isEnabled: paymentSettings?.paystackPayment === true,
      disabled: false,
      disabledReason: "",
    },
    {
      id: "phonepe",
      name: t("payments.phonepe.name"),
      tagline: t("payments.phonepe.tagline"),
      icon: "/Payments/phonepe-logo.png",
      isEnabled: false,
      disabled: false,
      disabledReason: "",
    },
  ];

  const paymentMethods = allMethods.filter((method) => method.isEnabled);

  return (
    <ScrollShadow className="w-full h-full max-h-[50vh] pr-2 py-1">
      <RadioGroup
        value={selectedPayment}
        onValueChange={setSelectedPayment}
        className="gap-3"
        isDisabled={isLoading}
      >
        {paymentMethods.map((method) => (
          <Radio
            key={method.id}
            value={method.id}
            isDisabled={method.disabled}
            classNames={{
              base: "inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-3 border border-gray-200 dark:border-default-100 data-[selected=true]:border-primary-500 data-[selected=true]:bg-primary-50 dark:data-[selected=true]:bg-content1",
              control: "text-primary-600",
            }}
          >
            <div className="flex items-center gap-4">
              <Image
                src={method.icon}
                alt={method.name}
                width={32}
                height={32}
                className="rounded-md"
              />
              <div>
                <h4 className="font-medium text-sm">{method.name}</h4>
                <p className="text-xs opacity-50">{method.tagline}</p>
                {method.disabled && method.disabledReason && (
                  <p className="text-xs text-danger mt-0.5">
                    {method.disabledReason}
                  </p>
                )}
              </div>
            </div>
          </Radio>
        ))}
      </RadioGroup>
    </ScrollShadow>
  );
};

export default PaymentMethods;
