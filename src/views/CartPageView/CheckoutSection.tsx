import { FC, useEffect, useState } from "react";
import { CartResponse } from "@/types/ApiResponse";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Button,
  Switch,
  useDisclosure,
  toast,
  Divider,
  Alert,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import PaymentModal from "@/components/Modals/PaymentModal";
import CartItems from "./CartItems";
import { useSettings } from "@/contexts/SettingsContext";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { updateCartData } from "@/helpers/updators";
import { setPromoCode, setUseWallet } from "@/lib/redux/slices/checkoutSlice";
import { clearCart } from "@/routes/api";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { handleCheckout } from "@/helpers/functionalHelpers";

interface CheckoutSectionProps {
  cart: CartResponse;
}

const CheckoutSection: FC<CheckoutSectionProps> = ({ cart }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
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

  const handleCheckoutClick = async (walletOnly = false) => {
    try {
      if (!selectedAddress) {
        toast({
          title: t("checkout.noAddressSelected.title"),
          description: t("checkout.noAddressSelected.description"),
          color: "warning",
        });
        return;
      }

      // Check for required attachments
      const attachments = (window as any).__cartAttachments || {};
      const itemsRequiringAttachments =
        items?.filter(
          (item) =>
            item.product.is_attachment_required &&
            item.product.attachment_mode === "required",
        ) || [];

      if (itemsRequiringAttachments.length > 0) {
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
          return;
        }
      }

      // Wallet-only checkout
      if (walletOnly) {
        setLoading(true);
        const res = await handleCheckout("wallet", {});

        if (res?.success) {
          await router.push("/my-account/orders");
          dispatch(setPromoCode(""));
          updateCartData(true, false);
        } else {
          toast({
            title: t("checkout.failed.title"),
            description: res?.message || t("checkout.failed.description"),
            color: "danger",
          });
        }

        return;
      } else {
        // Open payment selection modal
        onOpen();
      }
    } catch (error) {
      console.error("Error in handleCheckoutClick:", error);
      toast({
        title: t("general.error.title"),
        description: t("general.error.somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setLoading(false);
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

  // Check checkout type (single_store vs multi_store)
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

  // Check maximum items allowed in cart
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

  // Check minimum cart amount. The backend enforces this against
  // payment_summary.minimum_cart_amount; mirror it here for the UI.
  const minimumCartAmount =
    payment_summary.minimum_cart_amount ||
    systemSettings?.minimumCartAmount ||
    0;
  if (minimumCartAmount && payment_summary.items_total < minimumCartAmount) {
    const remainingAmount = minimumCartAmount - payment_summary.items_total;
    validationErrors.push(
      t("checkout.validation.minCartAmount", {
        // Amounts are pre-formatted for the active market (symbol + number
        // format included), so the translation's {{currencySymbol}} slot is
        // emptied to avoid a duplicate/static symbol.
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
    <div className="w-full flex justify-end md:sticky md:top-24">
      <Card radius="lg" className="w-full border border-divider p-2" shadow="sm">
        <CardHeader className="flex w-full justify-between items-center">
          <h2 className="text-base font-bold">{t("checkout.yourOrder")}</h2>
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
        </CardHeader>
        <CardBody>
          <CartItems items={cart.items} scrollable />
        </CardBody>
        <CardFooter className="space-y-6 flex flex-col w-full border-t border-divider">
          <div className="space-y-3 pt-4 w-full text-sm">
            <div className="flex justify-between">
              <span>{t("checkout.itemsTotal")}</span>
              <span>
                {formatPrice(payment_summary.items_total)}
              </span>
            </div>
            <div className="w-full -mt-2 text-start text-xs text-foreground/50">
              {`${t("checkout.allPricesIncludeTaxes")}`}
            </div>

            {payment_summary.total_saving > 0 && (
              <div className="flex justify-between text-success-600">
                <span>
                  {t("checkout.totalSaving", { defaultValue: "Total savings" })}
                </span>
                <span>
                  {formatPrice(-payment_summary.total_saving)}
                </span>
              </div>
            )}

            {selectedAddress?.id && (
              <div className="flex justify-between">
                <span>{t("checkout.deliveryCharges")}</span>

                {isFreeShipping && isInstantPromo ? (
                  <span className="flex items-center gap-2">
                    {/* Strikethrough original amount */}
                    <span className="line-through text-foreground/50">
                      {formatPrice(payment_summary.delivery_charges)}
                    </span>

                    {/* Free Shipping text */}
                    <span className="text-success-600 font-semibold">
                      {t("checkout.freeShipping")}
                    </span>
                  </span>
                ) : (
                  <span>
                    {formatPrice(payment_summary.delivery_charges)}
                  </span>
                )}
              </div>
            )}

            {/* Per-store shipping breakdown (multi-store / fulfillability). */}
            {selectedAddress?.id &&
              payment_summary.seller_shipping_costs?.length > 0 && (
                <div className="space-y-1 rounded-lg bg-default-50 dark:bg-default-100/40 p-2 text-xs">
                  {payment_summary.seller_shipping_costs.map((store) => (
                    <div key={store.store_id} className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-foreground/80">
                          {store.store_name}
                        </span>
                        {store.is_fulfillable ? (
                          <span>
                            {formatPrice(store.shipping_cost ?? 0)}
                          </span>
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

            {/* Taxes */}
            {payment_summary.tax_total > 0 && (
              <>
                <div className="flex justify-between">
                  <span>{t("checkout.tax", { defaultValue: "Tax" })}</span>
                  <span>
                    {formatPrice(payment_summary.tax_total)}
                  </span>
                </div>
                {payment_summary.tax_breakdown?.map((tax) => (
                  <div
                    key={tax.tax_rate_id}
                    className="flex justify-between pl-2 text-xs text-foreground/50"
                  >
                    <span>
                      {tax.title} ({tax.rate}%)
                    </span>
                    <span>
                      {formatPrice(tax.amount)}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Platform fee */}
            {payment_summary.platform_fee > 0 && (
              <div className="flex justify-between">
                <span>
                  {t("checkout.platformFee", { defaultValue: "Platform fee" })}
                </span>
                <span>
                  {formatPrice(payment_summary.platform_fee)}
                </span>
              </div>
            )}

            {/* COD fee — only when COD is available */}
            {payment_summary.cod_available && payment_summary.cod_fee > 0 && (
              <div className="flex justify-between">
                <span>{t("checkout.codFee", { defaultValue: "COD fee" })}</span>
                <span>
                  {formatPrice(payment_summary.cod_fee)}
                </span>
              </div>
            )}

            {/* Additional charges total */}
            {payment_summary.additional_charges_total > 0 && (
              <div className="flex justify-between">
                <span>
                  {t("checkout.additionalCharges", {
                    defaultValue: "Additional charges",
                  })}
                </span>
                <span>
                  {formatPrice(payment_summary.additional_charges_total)}
                </span>
              </div>
            )}

            {/* Pending charges (e.g. prior unpaid seller-order charges) */}
            {payment_summary.pending_charges?.length > 0 && (
              <div className="space-y-1 rounded-lg bg-warning-50 dark:bg-warning-100/30 p-2 text-xs">
                {payment_summary.pending_charges.map((charge) => (
                  <div key={charge.id} className="flex justify-between">
                    <span className="text-foreground/80">
                      {charge.reason_note || charge.reason}
                    </span>
                    <span>
                      {formatPrice(charge.amount)}
                    </span>
                  </div>
                ))}
                {payment_summary.pending_charges_total > 0 && (
                  <div className="flex justify-between font-medium border-t border-warning-200 pt-1">
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
                {/* INSTANT PROMO - Shown as discount with deduction */}
                {payment_summary.promo_applied &&
                  payment_summary.promo_discount > 0 &&
                  isInstantPromo && (
                    <div className="bg-success-50 p-3 rounded-lg border border-success-200">
                      <div className="flex items-center justify-between text-success-700">
                        <div className="w-full flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:tag-linear" className="text-base" />
                            <span className="font-medium">
                              {t("checkout.promo")}:{" "}
                              {payment_summary?.promo_code}
                            </span>
                          </div>
                        </div>

                        {/* Right side value - deduction */}
                        <span className="font-semibold inline-block whitespace-nowrap">
                          {isFreeShipping ? (
                            <span className="text-success-600 whitespace-nowrap">
                              {t("checkout.freeShipping")}
                            </span>
                          ) : (
                            `- ${formatPrice(payment_summary.promo_discount)}`
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                {/* CASHBACK PROMO - Shown as reward */}
                {payment_summary.promo_applied &&
                  payment_summary.promo_discount > 0 &&
                  isCashbackPromo && (
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200">
                      <div className="flex justify-between items-start text-secondary-700">
                        {/* Left Section */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:wallet-linear" className="text-base" />
                            <span className="font-medium">
                              {t("checkout.promo")}:{" "}
                              {payment_summary?.promo_code}
                            </span>
                          </div>

                          <p className="text-xs text-secondary-600 italic">
                            {t("cashbackPendingNote")}
                          </p>
                        </div>

                        {/* Right Section */}
                        <div className="flex flex-col items-end gap-1">
                          {isFreeShipping && (
                            <span className="text-success-600 font-semibold whitespace-nowrap">
                              {t("checkout.freeShipping")}
                            </span>
                          )}

                          <span className="font-semibold whitespace-nowrap text-secondary-600">
                            + {formatPrice(payment_summary.promo_discount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Promo error */}
                {payment_summary.promo_error && (
                  <div className="flex items-center gap-2 text-danger text-xs">
                    <Icon icon="solar:tag-linear" className="text-sm" />
                    <span>{payment_summary.promo_error}</span>
                  </div>
                )}
              </>
            ) : null}

            {/* Wallet Section */}
            {isWalletEnabled ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={isWalletUse}
                    isDisabled={
                      isLoading || payment_summary.wallet_balance == 0
                    }
                    onValueChange={handleUseWalletSwitchToggle}
                    size="sm"
                    classNames={{ label: "text-xs", thumbIcon: "w-2" }}
                    color="success"
                  >
                    {t("checkout.useWalletBalance")}
                  </Switch>
                  <span className="text-xxs text-foreground/80">
                    ({formatPrice(payment_summary.wallet_balance || 0)})
                  </span>
                </div>
              </div>
            ) : null}

            {isWalletUse && payment_summary.wallet_amount_used > 0 ? (
              <>
                <div className="flex justify-between text-success-600">
                  <span>{t("checkout.walletAmountUsed")}</span>
                  <span>
                    {formatPrice(-payment_summary.wallet_amount_used)}
                  </span>
                </div>

                {/* Remaining Wallet Balance */}
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

            {/* Total Section */}
            <Divider orientation="horizontal" />
            <div className="pt-1">
              <div className="flex justify-between text-lg font-semibold">
                <span>{t("checkout.totalAmount")}</span>
                <span>
                  {formatPrice(payment_summary.payable_amount)}
                </span>
              </div>
            </div>
          </div>

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
              classNames={{
                description: "text-xs",
              }}
            />
          ) : payment_summary.payable_amount == 0 && isWalletUse ? (
            <Button
              className="w-full font-medium py-3 rounded-lg"
              color="primary"
              isLoading={loading}
              onPress={() => handleCheckoutClick(true)}
              isDisabled={isLoading}
            >
              {t("checkout.payWithWallet")}
            </Button>
          ) : (
            <Button
              className="w-full font-medium py-3 rounded-lg"
              color="primary"
              onPress={() => handleCheckoutClick(false)}
              isDisabled={isLoading}
            >
              {t("checkout.proceedToCheckout")}
            </Button>
          )}
        </CardFooter>
      </Card>
      <PaymentModal open={isOpen} onOpenChange={onOpenChange} />
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
