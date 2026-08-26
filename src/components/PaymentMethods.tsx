import { useSettings } from "@/contexts/SettingsContext";
import { getCartDataFromRedux } from "@/helpers/getters";
import { Image, Radio, RadioGroup } from "@/components/ui";
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
      id: "razorpayPayment",
      name: t("payments.razorpay.name"),
      tagline: t("payments.razorpay.tagline"),
      icon: "/Payments/razorpay.png",
      isEnabled: paymentSettings?.razorpayPayment === true,
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
      id: "paystackPayment",
      name: t("payments.paystack.name"),
      tagline: t("payments.paystack.tagline"),
      icon: "/Payments/paystack.png",
      isEnabled: paymentSettings?.paystackPayment === true,
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
      id: "xenditPayment",
      name: t("payments.xendit.name"),
      tagline: t("payments.xendit.tagline"),
      icon: "/Payments/xendit.svg",
      isEnabled: paymentSettings?.xenditPayment === true,
      disabled: false,
      disabledReason: "",
    },
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
      id: "paypal",
      name: t("payments.paypal.name"),
      tagline: t("payments.paypal.tagline"),
      icon: "/Payments/paypal.png",
      isEnabled: false,
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

  if (paymentMethods.length === 0) return null;

  return (
    <RadioGroup
      value={selectedPayment}
      onValueChange={setSelectedPayment}
      className="w-full"
      classNames={{ wrapper: "w-full gap-0" }}
      isDisabled={isLoading}
    >
      {paymentMethods.map((method, idx) => (
        <Radio
          key={method.id}
          value={method.id}
          isDisabled={method.disabled}
          classNames={{
            base: `inline-flex m-0 w-full max-w-full items-center justify-between flex-row-reverse cursor-pointer gap-3 py-3 ${
              idx > 0 ? "border-t border-divider" : ""
            }`,
            control: "text-primary-600",
          }}
        >
          <div className="flex items-center gap-3">
            <Image
              src={method.icon}
              alt={method.name}
              width={28}
              height={28}
              className="rounded-md"
            />
            <div>
              <h4 className="text-sm font-medium text-foreground">
                {method.name}
              </h4>
              {method.disabled && method.disabledReason ? (
                <p className="text-xs text-danger">{method.disabledReason}</p>
              ) : method.tagline ? (
                <p className="text-xs text-foreground/50">{method.tagline}</p>
              ) : null}
            </div>
          </div>
        </Radio>
      ))}
    </RadioGroup>
  );
};

export default PaymentMethods;
