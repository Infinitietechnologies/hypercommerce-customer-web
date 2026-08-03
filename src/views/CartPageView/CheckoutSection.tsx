import { FC, useEffect, useState } from "react";
import { CartResponse } from "@/types/ApiResponse";
import { Button, Switch, toast, Divider, Alert } from "@/components/ui";
import { Icon } from "@iconify/react";
import PaymentMethods from "@/components/PaymentMethods";
import { useSettings } from "@/contexts/SettingsContext";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { updateCartData } from "@/helpers/updators";
import {
  setPromoCode,
  setUseWallet,
  setIdempotencyKey,
} from "@/lib/redux/slices/checkoutSlice";
import { clearCart } from "@/routes/api";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { handleCheckout } from "@/helpers/functionalHelpers";

interface CheckoutSectionProps {
  cart: CartResponse;
}

const genKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const CheckoutSection: FC<CheckoutSectionProps> = ({ cart }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const { paymentSettings } = useSettings();
  const isWalletEnabled = paymentSettings?.wallet || false;

  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const router = useRouter();
  const { formatPrice, systemSettings, isSingleVendor } = useSettings();
  const { payment_summary, items, total_quantity } = cart;
  const selectedAddress = useSelector(
    (state: RootState) => state.checkout.selectedAddress,
  );

  const dispatch = useDispatch();

  const isLoading = useSelector((state: RootState) => state.cart.isLoading);
  const [isWalletUse, setIsWalletUse] = useState(payment_summary.use_wallet);

  const handleUseWalletSwitchToggle = async (checked: boolean) => {
    setIsWalletUse(checked);
    dispatch(setUseWallet(checked));
    setTimeout(() => {
      updateCartData(true, false);
    }, 500);
  };

  // Attachment guard shared by both checkout paths.
  const attachmentsMissing = (): boolean => {
    const attachments = (window as any).__cartAttachments || {};
    const itemsRequiringAttachments =
      items?.filter(
        (item) =>
          item.product.is_attachment_required &&
          item.product.attachment_mode === "required",
      ) || [];

    const itemsMissingAttachments = itemsRequiringAttachments.filter(
      (item) =>
        !attachments[item.product.id] ||
        attachments[item.product.id].length === 0,
    );

    if (itemsMissingAttachments.length > 0) {
      const productNames = itemsMissingAttachments
        .map((item) => item.product.name)
        .filter(Boolean)
        .join(", ");

      toast({
        title: t("checkout.attachmentsRequired.title", {
          defaultValue: "Attachments Required",
        }),
        description: t("checkout.attachmentsRequired.description", {
          products: productNames,
          defaultValue: `Please upload required attachments for: ${productNames}`,
        }),
        color: "warning",
      });
      return true;
    }
    return false;
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: t("checkout.noAddressSelected.title"),
        description: t("checkout.noAddressSelected.description"),
        color: "warning",
      });
      return;
    }

    if (attachmentsMissing()) return;

    const walletCoversAll =
      payment_summary.payable_amount === 0 && isWalletUse;

    // Bank transfer opens its own dedicated modal.
    if (!walletCoversAll && selectedPayment === "directBankTransfer") {
      document.getElementById("bank_transfer_modal_btn")?.click();
      return;
    }

    if (!walletCoversAll && !selectedPayment) {
      toast({ title: t("please_select_payment_method"), color: "warning" });
      return;
    }

    const method = walletCoversAll ? "wallet" : selectedPayment;

    setLoading(true);
    try {
      dispatch(setIdempotencyKey(genKey()));
      const res = await handleCheckout(method, {});

      if (!res?.success) {
        toast({
          title: res?.message || t("checkout.failed.title"),
          color: "danger",
        });
        return;
      }

      const slug = res?.data?.slug;
      if (method === "cod" || method === "wallet") {
        dispatch(setPromoCode(""));
        await router.push(
          slug ? `/my-account/orders/${slug}` : "/my-account/orders",
        );
      } else {
        await router.push(`/payment/${slug}`);
      }
    } catch (error) {
      console.error("Error in handlePlaceOrder:", error);
      toast({
        title: t("general.error.title"),
        description: t("general.error.somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setLoading(false);
      updateCartData(true, false);
    }
  };

  useEffect(() => {
    if (
      (payment_summary.wallet_balance === 0 && payment_summary.use_wallet) ||
      (!isWalletEnabled && payment_summary.use_wallet)
    ) {
      setTimeout(() => {
        setIsWalletUse(false);
        dispatch(setUseWallet(false));
      }, 0);
      setTimeout(() => {
        updateCartData(true, false);
      }, 500);
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment_summary, dispatch]);

  const promo = Array.isArray(payment_summary?.promo_applied)
    ? null
    : payment_summary?.promo_applied || null;

  const isFreeShipping = promo?.discount_type === "free_shipping";
  const promo_mode = promo?.promo_mode;
  const isInstantPromo = promo_mode === "instant";
  const isCashbackPromo = promo_mode === "cashback";

  // Validation checks based on system settings
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

  return (
    <div className="flex w-full flex-col gap-4 md:sticky md:top-24">
      {/* ---------- Bill Details ---------- */}
      <div className="w-full rounded-large border border-divider bg-content1 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {t("cart.billDetails", { defaultValue: "Bill Details" })}
          </h2>
          <Button
            size="sm"
            variant="light"
            className="h-7 text-xs"
            color="danger"
            title={t("checkout.clearCart")}
            startContent={
              <Icon icon="solar:trash-bin-trash-linear" className="text-sm" />
            }
            onPress={() => setShowClearCartModal(true)}
          >
            {t("checkout.clearCart")}
          </Button>
        </div>

        <div className="mt-4 w-full space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/60">
              {t("checkout.itemsTotal")}
            </span>
            <span className="font-semibold">
              {formatPrice(payment_summary.items_total)}
            </span>
          </div>
          <div className="-mt-2 w-full text-start text-xs text-foreground/50">
            {`${t("checkout.allPricesIncludeTaxes")}`}
          </div>

          {payment_summary.total_saving > 0 && (
            <div className="flex justify-between text-success">
              <span>
                {t("checkout.totalSaving", { defaultValue: "Total savings" })}
              </span>
              <span>{formatPrice(-payment_summary.total_saving)}</span>
            </div>
          )}

          {selectedAddress?.id && (
            <div className="flex justify-between">
              <span className="text-foreground/60">
                {t("checkout.deliveryCharges")}
              </span>

              {isFreeShipping && isInstantPromo ? (
                <span className="flex items-center gap-2">
                  <span className="text-foreground/50 line-through">
                    {formatPrice(payment_summary.delivery_charges)}
                  </span>
                  <span className="font-semibold text-success">
                    {t("checkout.freeShipping")}
                  </span>
                </span>
              ) : (
                <span>{formatPrice(payment_summary.delivery_charges)}</span>
              )}
            </div>
          )}

          {selectedAddress?.id &&
            payment_summary.seller_shipping_costs?.length > 0 && (
              <div className="space-y-1 rounded-lg bg-content2 p-2 text-xs">
                {payment_summary.seller_shipping_costs.map((store) => (
                  <div key={store.store_id} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-foreground/80">
                        {store.store_name}
                      </span>
                      {store.is_fulfillable ? (
                        <span>{formatPrice(store.shipping_cost ?? 0)}</span>
                      ) : (
                        <span className="text-danger">
                          {t("checkout.notAvailable", {
                            defaultValue: "Not available",
                          })}
                        </span>
                      )}
                    </div>
                    {store.items
                      ?.filter((it) => !it.is_fulfillable)
                      .map((it) => (
                        <div
                          key={it.cart_item_id}
                          className="flex justify-between pl-2 text-danger"
                        >
                          <span>{it.product_name}</span>
                          <span className="text-right">
                            {it.unfulfillable_reason ||
                              t("checkout.notAvailable", {
                                defaultValue: "Not available",
                              })}
                          </span>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}

          {payment_summary.tax_total > 0 && (
            <>
              <div className="flex justify-between text-foreground/50">
                <span>
                  {t("checkout.taxIncluded", {
                    defaultValue: "Tax (included)",
                  })}
                </span>
                <span>{formatPrice(payment_summary.tax_total)}</span>
              </div>
              {payment_summary.tax_breakdown?.map((tax) => (
                <div
                  key={tax.tax_rate_id}
                  className="flex justify-between pl-2 text-xs text-foreground/40"
                >
                  <span>
                    {tax.title} ({tax.rate}%)
                  </span>
                  <span>{formatPrice(tax.amount)}</span>
                </div>
              ))}
            </>
          )}

          {payment_summary.platform_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-foreground/60">
                {t("checkout.platformFee", { defaultValue: "Platform fee" })}
              </span>
              <span>{formatPrice(payment_summary.platform_fee)}</span>
            </div>
          )}

          {payment_summary.cod_available && payment_summary.cod_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-foreground/60">
                {t("checkout.codFee", { defaultValue: "COD fee" })}
              </span>
              <span>{formatPrice(payment_summary.cod_fee)}</span>
            </div>
          )}

          {payment_summary.pending_charges?.length > 0 && (
            <div className="space-y-1 rounded-lg bg-warning-50 p-2 text-xs">
              {payment_summary.pending_charges.map((charge) => (
                <div key={charge.id} className="flex justify-between">
                  <span className="text-foreground/80">
                    {charge.reason_note || charge.reason}
                  </span>
                  <span>{formatPrice(charge.amount)}</span>
                </div>
              ))}
              {payment_summary.pending_charges_total > 0 && (
                <div className="flex justify-between border-t border-warning-200 pt-1 font-medium">
                  <span>
                    {t("checkout.pendingChargesTotal", {
                      defaultValue: "Pending charges",
                    })}
                  </span>
                  <span>
                    {formatPrice(payment_summary.pending_charges_total)}
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedAddress?.id ? (
            <>
              {payment_summary.promo_applied &&
                payment_summary.promo_discount > 0 &&
                isInstantPromo && (
                  <div className="flex items-center justify-between text-success">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icon icon="solar:tag-linear" className="text-base" />
                      {t("checkout.promo")}: {payment_summary?.promo_code}
                    </span>
                    <span className="whitespace-nowrap font-semibold">
                      {isFreeShipping
                        ? t("checkout.freeShipping")
                        : `- ${formatPrice(payment_summary.promo_discount)}`}
                    </span>
                  </div>
                )}

              {payment_summary.promo_applied &&
                payment_summary.promo_discount > 0 &&
                isCashbackPromo && (
                  <div className="rounded-lg bg-secondary-50 p-3">
                    <div className="flex items-start justify-between text-secondary-700">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="solar:wallet-linear"
                            className="text-base"
                          />
                          <span className="font-medium">
                            {t("checkout.promo")}: {payment_summary?.promo_code}
                          </span>
                        </div>
                        <p className="text-xs italic text-secondary-600">
                          {t("cashbackPendingNote")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isFreeShipping && (
                          <span className="whitespace-nowrap font-semibold text-success">
                            {t("checkout.freeShipping")}
                          </span>
                        )}
                        <span className="whitespace-nowrap font-semibold text-secondary-600">
                          + {formatPrice(payment_summary.promo_discount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {payment_summary.promo_error && (
                <div className="flex items-center gap-2 text-xs text-danger">
                  <Icon icon="solar:tag-linear" className="text-sm" />
                  <span>{payment_summary.promo_error}</span>
                </div>
              )}
            </>
          ) : null}

          {isWalletUse && payment_summary.wallet_amount_used > 0 ? (
            <>
              <div className="flex justify-between text-success">
                <span>{t("checkout.walletAmountUsed")}</span>
                <span>
                  {formatPrice(-payment_summary.wallet_amount_used)}
                </span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>{t("checkout.remainingWalletBalance")}</span>
                <span>
                  {formatPrice(
                    Number(payment_summary?.wallet_balance ?? 0) -
                      Number(payment_summary?.wallet_amount_used ?? 0),
                  )}
                </span>
              </div>
            </>
          ) : null}

          <Divider />

          <div className="flex justify-between text-lg font-bold text-foreground">
            <span>{t("checkout.totalAmount")}</span>
            <span>{formatPrice(payment_summary.payable_amount)}</span>
          </div>

          {payment_summary.total_saving > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
              <Icon icon="solar:tag-price-bold" className="shrink-0 text-base" />
              <span>
                {t("cart.savedOnOrder", {
                  amount: formatPrice(payment_summary.total_saving),
                  defaultValue: `You saved ${formatPrice(payment_summary.total_saving)} on this order!`,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Payment methods (inline) ---------- */}
      {!hasValidationErrors && (
        <div className="w-full rounded-large border border-divider bg-content1 p-4 sm:p-5">
          <h3 className="text-sm font-bold text-foreground">
            {t("checkout.payWith", {
              amount: formatPrice(payment_summary.payable_amount),
              defaultValue: `Pay: ${formatPrice(payment_summary.payable_amount)} with`,
            })}
          </h3>

          <div className="mt-1">
            <PaymentMethods
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              hideCOD={false}
              isLoading={loading || isLoading}
            />
          </div>

          {isWalletEnabled && (
            <div className="mt-1 flex items-center justify-between border-t border-divider pt-3">
              <div className="flex items-center gap-3">
                <Icon
                  icon="solar:wallet-money-linear"
                  className="text-xl text-foreground/70"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("checkout.useWalletBalance")}
                  </p>
                  <p className="text-xs text-success">
                    {formatPrice(payment_summary.wallet_balance || 0)}{" "}
                    {t("checkout.available", { defaultValue: "available" })}
                  </p>
                </div>
              </div>
              <Switch
                isSelected={isWalletUse}
                isDisabled={isLoading || payment_summary.wallet_balance == 0}
                onValueChange={handleUseWalletSwitchToggle}
                size="sm"
                color="success"
              />
            </div>
          )}
        </div>
      )}

      {/* ---------- Place order ---------- */}
      {hasValidationErrors ? (
        <Alert
          color="warning"
          variant="faded"
          title={t("checkout.validation.title", {
            defaultValue: "Cannot proceed to checkout",
          })}
          description={
            <ul className="list-disc pl-5">
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
          className="font-semibold"
          isLoading={loading}
          isDisabled={isLoading}
          onPress={handlePlaceOrder}
        >
          {t("checkout.placeOrder", { defaultValue: "Place Order" })}
        </Button>
      )}

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

export default CheckoutSection;
