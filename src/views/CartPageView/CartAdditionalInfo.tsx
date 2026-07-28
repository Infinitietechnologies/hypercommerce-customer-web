import { FC, useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  useDisclosure,
  Textarea,
  Divider,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import AddressModal from "../../components/Modals/AddressModal";
import AddressSection from "@/components/Cart/AddressSection";
import { setOrderNote } from "@/lib/redux/slices/checkoutSlice";
import { useDispatch } from "react-redux";
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Delivery Instructions */}
        <Card className="w-full border border-divider" radius="lg" shadow="sm">
          <CardHeader className="flex gap-3 relative flex-col items-start pb-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-100 rounded-xl">
                <Icon
                  icon="solar:pen-2-linear"
                  className="text-xl text-primary-600"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-xs md:text-small font-semibold">
                  {t("cart.deliveryInstructions.title")}
                </p>
                <p className="text-xxs md:text-xs text-foreground/50">
                  {t("cart.deliveryInstructions.description")}
                </p>
              </div>
            </div>
            <Divider orientation="horizontal" />
          </CardHeader>
          <CardBody>
            <Textarea
              placeholder={t("cart.deliveryInstructions.placeholder")}
              value={deliveryInstructions}
              onValueChange={setDeliveryInstructions}
              minRows={3}
              maxRows={3}
              isClearable
            />
          </CardBody>
        </Card>

        {/* Promo Code Section */}
        <PromoCodeSection />
      </div>

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
