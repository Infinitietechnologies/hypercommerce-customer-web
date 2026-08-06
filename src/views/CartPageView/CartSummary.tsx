import { FC, useState } from "react";
import { CartResponse } from "@/types/ApiResponse";
import { Button, Divider, Alert, toast } from "@/components/ui";
import { Icon } from "@iconify/react";
import { useSettings } from "@/contexts/SettingsContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { clearCart } from "@/routes/api";
import { updateCartData } from "@/helpers/updators";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

interface CartSummaryProps {
  cart: CartResponse;
}

/**
 * Cart-page "Bill Details" (redesign). Subtotal (with struck original when the
 * cart has savings), a "you saved" banner and the total, then Proceed. Delivery
 * / tax / fees / promo / wallet all live on the checkout page — they need a
 * selected address, which the cart page doesn't ask for.
 */
const CartSummary: FC<CartSummaryProps> = ({ cart }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { formatPrice, systemSettings, isSingleVendor } = useSettings();
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const { payment_summary, items, total_quantity } = cart;

  const validationErrors: string[] = [];

  if (
    !isSingleVendor &&
    systemSettings?.checkoutType === "single_store" &&
    items?.length > 0
  ) {
    const uniqueStoreIds = new Set(
      items.map((item) => item.store?.id).filter(Boolean),
    );
    if (uniqueStoreIds.size > 1) {
      validationErrors.push(
        t("checkout.validation.multipleStores", {
          defaultValue:
            "Your cart contains products from multiple stores. Single store checkout only allows products from one store.",
        }),
      );
    }
  }

  if (
    systemSettings?.maximumItemsAllowedInCart &&
    total_quantity > systemSettings.maximumItemsAllowedInCart
  ) {
    validationErrors.push(
      t("checkout.validation.maxItemsExceeded", {
        maxItems: systemSettings.maximumItemsAllowedInCart,
        currentItems:
          Number(total_quantity) -
          Number(systemSettings.maximumItemsAllowedInCart),
        defaultValue: `Maximum ${systemSettings.maximumItemsAllowedInCart} items allowed in cart. You have ${total_quantity} items.`,
      }),
    );
  }

  const minimumCartAmount =
    payment_summary.minimum_cart_amount ||
    systemSettings?.minimumCartAmount ||
    0;
  if (minimumCartAmount && payment_summary.items_total < minimumCartAmount) {
    const remainingAmount = minimumCartAmount - payment_summary.items_total;
    validationErrors.push(
      t("checkout.validation.minCartAmount", {
        minAmount: formatPrice(minimumCartAmount),
        currentAmount: formatPrice(payment_summary.items_total),
        remainingAmount: formatPrice(remainingAmount),
        currencySymbol: "",
        defaultValue: `Minimum cart amount is ${formatPrice(minimumCartAmount)}. Add ${formatPrice(remainingAmount)} more to proceed.`,
      }),
    );
  }

  const hasValidationErrors = validationErrors.length > 0;
  const totalSaving = payment_summary.total_saving || 0;
  const originalTotal = payment_summary.items_total + totalSaving;

  return (
    <div className="w-full md:sticky md:top-24">
      <div className="rounded-large border border-divider bg-content1 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {t("cart.billDetails", { defaultValue: "Bill Details" })}
          </h2>
          <Button
            size="sm"
            variant="light"
            color="danger"
            className="h-7 text-xs"
            title={t("checkout.clearCart")}
            startContent={
              <Icon icon="solar:trash-bin-trash-linear" className="text-sm" />
            }
            onPress={() => setShowClearCartModal(true)}
          >
            {t("checkout.clearCart")}
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">
              {t("checkout.itemsTotal", { defaultValue: "Subtotal" })}
            </span>
            <span className="flex items-baseline gap-2">
              {totalSaving > 0 && (
                <span className="text-[13px] text-default-400 line-through">
                  {formatPrice(originalTotal)}
                </span>
              )}
              <span className="font-semibold text-foreground">
                {formatPrice(payment_summary.items_total)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-foreground/60">
            <Icon icon="solar:info-circle-linear" className="shrink-0 text-sm" />
            <span>
              {t("cart.calculatedAtCheckout", {
                defaultValue: "Delivery & fees calculated at checkout",
              })}
            </span>
          </div>

          <Divider />

          <div className="flex items-center justify-between text-base font-bold text-foreground">
            <span>{t("checkout.totalAmount", { defaultValue: "Total Amount" })}</span>
            <span>{formatPrice(payment_summary.items_total)}</span>
          </div>

          {totalSaving > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
              <Icon
                icon="solar:tag-price-bold"
                className="shrink-0 text-base"
              />
              <span>
                {t("cart.savedOnOrder", {
                  amount: formatPrice(totalSaving),
                  defaultValue: `You saved ${formatPrice(totalSaving)} on this order!`,
                })}
              </span>
            </div>
          )}

          {hasValidationErrors ? (
            <Alert
              color="warning"
              variant="faded"
              title={t("checkout.validation.title", {
                defaultValue: "Cannot proceed to checkout",
              })}
              description={
                <ul className="list-disc ps-5">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              }
              classNames={{ description: "text-xs" }}
            />
          ) : (
            <Button
              color="primary"
              fullWidth
              className="mt-1 font-semibold"
              isDisabled={isLoading}
              onPress={() => router.push("/cart/checkout")}
            >
              {t("checkout.proceedToCheckout", {
                defaultValue: "Proceed to Checkout",
              })}
            </Button>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        onConfirm={async () => {
          await clearCart();
          setShowClearCartModal(false);
          toast({
            title: t("checkout.cartCleared.title"),
            description: t("checkout.cartCleared.description"),
            color: "success",
          });
          await router.push("/");
          updateCartData(true, false);
        }}
        title="Clear Cart"
        icon={<Icon icon="solar:trash-bin-trash-linear" className="text-base" />}
        description={t("checkout.clearCartModal.description")}
        confirmText={t("checkout.clearCartModal.confirmText")}
        cancelText={t("checkout.clearCartModal.cancelText")}
        variant="danger"
        alertTitle={t("checkout.clearCartModal.alertTitle")}
        alertDescription={t("checkout.clearCartModal.alertDescription")}
      />
    </div>
  );
};

export default CartSummary;
