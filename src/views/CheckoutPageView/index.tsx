import { FC } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState } from "@/lib/redux/store";
import CartAdditionalInfo from "../CartPageView/CartAdditionalInfo";
import CheckoutSection from "../CartPageView/CheckoutSection";
import CartPageEmpty from "../empty/CartPageEmpty";
import ConfettiTrigger from "@/components/Functional/ConfettiTrigger";
import { Skeleton } from "@/components/ui";

/**
 * Checkout page (redesign `/redesign/checkout`): delivery address + promo on the
 * left, the order summary + payment on the right. Reached from the cart page's
 * "Proceed to Checkout".
 */
const CheckoutPageView: FC<{ initializing?: boolean }> = ({
  initializing = false,
}) => {
  const { t } = useTranslation();
  const { cartData } = useSelector((state: RootState) => state.cart);

  if (initializing) {
    return (
      <div className="flex w-full flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <Skeleton className="h-64 w-full md:w-3/5" />
          <Skeleton className="h-64 w-full md:w-2/5" />
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return <CartPageEmpty />;
  }

  return (
    <div className="rd-fade flex w-full flex-col gap-6">
      <ConfettiTrigger />

      <h1 className="text-xl font-bold text-foreground sm:text-2xl">
        {t("pageTitle.checkout", { defaultValue: "Checkout" })}
      </h1>

      <div className="flex w-full flex-col gap-4 md:flex-row md:items-start">
        <div className="w-full md:w-[60%] lg:w-[65%]">
          <CartAdditionalInfo cart={cartData} />
        </div>

        <div className="w-full md:w-[40%] lg:w-[35%] md:max-w-md">
          <CheckoutSection cart={cartData} />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPageView;
