import { FC } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import CartAdditionalInfo from "../CartPageView/CartAdditionalInfo";
import CheckoutSection from "../CartPageView/CheckoutSection";
import CartPageEmpty from "../empty/CartPageEmpty";
import ConfettiTrigger from "@/components/Functional/ConfettiTrigger";

/**
 * Checkout page (redesign `/redesign/checkout`): delivery address + promo on the
 * left, the order summary + payment on the right. Reached from the cart page's
 * "Proceed to Checkout". The stepper treatment is a follow-up pass.
 */
const CheckoutPageView: FC = () => {
  const { cartData } = useSelector((state: RootState) => state.cart);

  if (!cartData || cartData.items.length === 0) {
    return <CartPageEmpty />;
  }

  return (
    <div className="rd-fade w-full flex flex-col md:flex-row gap-4">
      <ConfettiTrigger />

      <div className="w-full md:w-[60%] lg:w-[65%]">
        <div className="mt-4">
          <CartAdditionalInfo cart={cartData} />
        </div>
      </div>

      <div className="w-full md:w-[40%] lg:w-[35%] md:max-w-md">
        <CheckoutSection cart={cartData} />
      </div>
    </div>
  );
};

export default CheckoutPageView;
