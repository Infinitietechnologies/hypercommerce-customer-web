import { FC, useState } from "react";
import { Input, Button, toast, useDisclosure } from "@/components/ui";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { validatePromoCode } from "@/routes/api";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";
import { updateCartData } from "@/helpers/updators";
import PromoCodeModal from "../Modals/PromoCodeModal";
import { useTranslation } from "react-i18next";

const PromoCodeSection: FC = () => {
  const [code, setCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const dispatch = useDispatch();
  const { cartData, isLoading } = useSelector((state: RootState) => state.cart);
  const { t } = useTranslation();

  const { promoCode, selectedAddress } = useSelector(
    (state: RootState) => state.checkout,
  );

  const handleApplyPromoCode = async () => {
    if (!code.trim()) {
      toast({ title: t("promoCode.enterCode", { defaultValue: "Please enter a promo code" }), color: "warning" });
      return;
    }

    setIsApplying(true);
    try {
      const response = await validatePromoCode({
        cart_amount: cartData?.payment_summary.items_total,
        promo_code: code,
        delivery_charge: cartData?.payment_summary.delivery_charges,
      });

      if (response.success) {
        dispatch(setPromoCode(code));
        toast({ title: t("promoCode.appliedSuccess", { defaultValue: "Promo code applied successfully" }), color: "success" });
        updateCartData(true, false);
      } else {
        toast({
          title: t("promoCode.invalid", { defaultValue: "Invalid promo code" }),
          description: response.message || t("promoCode.cannotApply", { defaultValue: "This promo code cannot be applied" }),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      toast({
        title: t("promoCode.error", { defaultValue: "Error" }),
        description: t("promoCode.tryAgain", { defaultValue: "Failed to apply promo code. Please try again." }),
        color: "danger",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromoCode = () => {
    dispatch(setPromoCode(""));
    setCode("");
    updateCartData(true, false);
    toast({ title: t("promoCode.removed"), color: "success" });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Have Coupon */}
      <div className="rounded-large border border-divider bg-content1 p-4">
        <h3 className="text-sm font-bold text-foreground">
          {t("promoCode.haveCoupon", { defaultValue: "Have Coupon ?" })}
        </h3>

        {promoCode ? (
          <div className="mt-3 flex items-center justify-between rounded-md bg-green-50 p-2.5">
            <div>
              <p className="text-sm font-semibold text-foreground">{promoCode}</p>
              <p
                className={`text-xs ${
                  selectedAddress == null
                    ? "text-danger"
                    : cartData?.payment_summary.promo_error !== null
                      ? "text-danger"
                      : "text-success"
                }`}
              >
                {selectedAddress == null
                  ? t("promoCode.selectAddress")
                  : cartData?.payment_summary.promo_error === null
                    ? t("promoCode.applied")
                    : `${cartData?.payment_summary.promo_error || t("promoCode.invalidRemove", { defaultValue: "PromoCode is invalid, kindly remove it." })}`}
              </p>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={handleRemovePromoCode}
              isDisabled={isLoading}
            >
              <Icon icon="solar:close-circle-linear" className="text-lg" />
            </Button>
          </div>
        ) : (
          <Input
            className="mt-3"
            placeholder={t("promoCode.placeholder", { defaultValue: "Coupon Code" })}
            value={code}
            onValueChange={setCode}
            isDisabled={isLoading || isApplying}
            endContent={
              <Button
                variant="light"
                color="primary"
                size="sm"
                className="font-semibold text-[12px]"
                onPress={handleApplyPromoCode}
                isLoading={isApplying}
                isDisabled={isLoading || !code.trim()}
              >
                {t("apply")}
              </Button>
            }
          />
        )}
      </div>

      {/* Available Offers */}
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between rounded-large border border-divider bg-content1 p-4 text-left transition-colors hover:border-default-300"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon icon="solar:ticket-sale-linear" className="text-lg text-primary-600" />
          {t("promoCode.availableOffers", { defaultValue: "Available Offers" })}
        </span>
        <Icon icon="solar:alt-arrow-right-linear" className="text-lg text-foreground/40" />
      </button>

      <PromoCodeModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onApplyPromo={(promoCode) => {
          if (!promoCode.trim()) return;

          setIsApplying(true);
          validatePromoCode({
            cart_amount: cartData?.payment_summary.items_total,
            promo_code: promoCode,
            delivery_charge: cartData?.payment_summary.delivery_charges,
          })
            .then((response) => {
              if (response.success) {
                dispatch(setPromoCode(promoCode));
                if (selectedAddress?.id) {
                  toast({ title: t("promoCode.appliedSuccess"), color: "success" });
                } else {
                  toast({ title: t("promoCode.pleaseSelectAddress"), color: "danger" });
                }
                updateCartData(true, false);
              } else {
                toast({
                  title: t("promoCode.invalid"),
                  description: response.message || t("promoCode.cannotApply", { defaultValue: "This promo code cannot be applied" }),
                  color: "danger",
                });
              }
            })
            .catch((error) => {
              console.error("Error applying promo code:", error);
              toast({
                title: t("promoCode.error"),
                description: t("promoCode.tryAgain", { defaultValue: "Failed to apply promo code. Please try again." }),
                color: "danger",
              });
            })
            .finally(() => {
              setIsApplying(false);
            });
        }}
      />
    </div>
  );
};

export default PromoCodeSection;
