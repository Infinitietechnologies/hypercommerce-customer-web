import { FC, useState, useEffect, useMemo } from "react";
import { Textarea, useDisclosure } from "@/components/ui";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import AddressModal from "../../components/Modals/AddressModal";
import AddressSection from "@/components/Cart/AddressSection";
import CartItems from "./CartItems";
import { setOrderNote } from "@/lib/redux/slices/checkoutSlice";
import { debounce } from "lodash";
import PromoCodeSection from "@/components/Cart/PromoCodeSection";
import { useTranslation } from "react-i18next";
import { CartResponse } from "@/types/ApiResponse";

interface CartAdditionalInfoProps {
  cart?: CartResponse | null;
}

const CartAdditionalInfo: FC<CartAdditionalInfoProps> = () => {
  const { t } = useTranslation();
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const { cartData } = useSelector((state: RootState) => state.cart);
  const items = cartData?.items ?? [];

  const {
    isOpen: isAddressModalOpen,
    onOpen: onAddressModalOpen,
    onClose: onAddressModalClose,
  } = useDisclosure();
  const dispatch = useDispatch();

  const debouncedDispatch = useMemo(() => {
    return debounce((note: string) => {
      dispatch(setOrderNote(note));
    }, 500);
  }, [dispatch]);

  useEffect(() => {
    debouncedDispatch(deliveryInstructions);
    return debouncedDispatch.cancel;
  }, [deliveryInstructions, debouncedDispatch]);

  return (
    <div className="space-y-4">
      <AddressSection onAddAddressModalOpen={onAddressModalOpen} />

      {/* Cart items */}
      {items.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-bold text-foreground">
            {t("cart.title", { defaultValue: "Cart" })} ({cartData?.total_quantity})
          </h2>
          <CartItems items={items} layout="cart" />
        </div>
      )}

      {/* Delivery note — promo-style card */}
      <div className="rounded-large border border-divider bg-content1 p-4">
        <h3 className="text-sm font-bold text-foreground">
          {t("cart.deliveryInstructions.title")}
        </h3>
        <Textarea
          className="mt-3"
          placeholder={t("cart.deliveryInstructions.placeholder")}
          value={deliveryInstructions}
          onValueChange={setDeliveryInstructions}
          minRows={3}
          maxRows={3}
          isClearable
        />
      </div>

      {/* Promo Code */}
      <PromoCodeSection />

      <AddressModal
        isOpen={isAddressModalOpen}
        onOpenChange={(state) =>
          state ? onAddressModalOpen() : onAddressModalClose()
        }
        onSave={() => {
          document.getElementById("reset-cart-addresses")?.click();
        }}
      />
    </div>
  );
};

export default CartAdditionalInfo;
