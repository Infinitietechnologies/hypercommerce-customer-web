import { Order } from "@/types/ApiResponse";
import { Card, CardBody, CardHeader, Divider, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/components/Functional/Price";

interface OrderSummaryProps {
  order: Order;
}

const OrderSummary: FC<OrderSummaryProps> = ({ order }) => {
  const { t } = useTranslation();
  const { formatWith } = useCurrency();
  // Show amounts in THIS order's own market currency.
  const formatPrice = (amount: number | string | null | undefined) =>
    formatWith(amount, order.currency_symbol, order.format);

  const getPromoStatus = () => {
    if (order.promo_line?.cashback_flag) {
      return order.promo_line?.is_awarded ? "awarded" : "pending";
    }
    return "applied";
  };

  const getPromoLabel = () => {
    if (order.promo_line?.cashback_flag) {
      return order.promo_line?.is_awarded
        ? t("cashbackAwarded")
        : t("cashbackReward");
    }
    return t("promoDiscountApplied");
  };

  const promoStatus = getPromoStatus();

  // Calculate wallet amount used
  const walletAmountUsed = Math.max(0, Number(order.wallet_balance || 0));
  const hasWalletUsed = walletAmountUsed > 0;

  return (
    <Card shadow="sm" radius="lg" className="w-full border border-divider">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon icon="solar:bill-list-linear" className="w-5 h-5 text-default-500" />
          <h3 className="text-base font-semibold text-foreground">
            {t("orderSummary")}
          </h3>
        </div>
      </CardHeader>

      <Divider className="my-0" />

      <CardBody className="py-4 px-4 space-y-0">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-default-500">
            {t("subtotal")}
          </span>
          <span className="text-sm font-medium text-foreground">
            {formatPrice(order.subtotal)}
          </span>
        </div>

        {/* Charges */}
        <div className="space-y-2 py-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-default-500">
              {t("deliveryCharge")}
            </span>
            <span className="text-sm text-foreground">
              {formatPrice(order.delivery_charge.toString())}
            </span>
          </div>

          {Number(order.platform_fee) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-500">
                {t("checkout.platformFee", { defaultValue: "Platform fee" })}
              </span>
              <span className="text-sm text-foreground">
                {formatPrice(order.platform_fee.toString())}
              </span>
            </div>
          )}

          {Number(order.cod_fee) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-500">
                {t("checkout.codFee", { defaultValue: "COD fee" })}
              </span>
              <span className="text-sm text-foreground">
                {formatPrice(order.cod_fee.toString())}
              </span>
            </div>
          )}
        </div>
        {order.promo_line && <Divider className="my-3" />}

        {/* Promo / Cashback */}
        <div className="space-y-3 py-2">
          {order.promo_line && (
            <div className="bg-primary-50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {order.promo_line.cashback_flag ? (
                    <Icon icon="solar:bolt-linear" className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                  ) : (
                    <Icon icon="solar:gift-linear" className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  )}

                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {getPromoLabel()}
                    </p>
                    <p className="text-xs text-default-500 mt-0.5">
                      {t("code")}:{" "}
                      <span className="font-semibold">
                        {order.promo_line.promo_code}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <Chip
                  size="sm"
                  variant="flat"
                  classNames={{ base: "text-xs" }}
                  className={
                    promoStatus === "awarded"
                      ? "bg-success-100 text-success-700"
                      : promoStatus === "pending"
                        ? "bg-warning-100 text-warning-700"
                        : "bg-success-100 text-success-700"
                  }
                >
                  {promoStatus === "awarded"
                    ? t("credited")
                    : promoStatus === "pending"
                      ? t("pending")
                      : t("applied")}
                </Chip>
              </div>

              {/* Discount / Cashback Amount */}
              <div className="flex justify-between items-center pt-1 border-t border-primary-200">
                <span className="text-xs text-default-500">
                  {order.promo_line.cashback_flag
                    ? t("cashbackAmount")
                    : t("discountAmount")}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    order.promo_line.cashback_flag
                      ? "text-primary-600"
                      : "text-success"
                  }`}
                >
                  {order.promo_line.cashback_flag ? "" : "-"}
                  {formatPrice(order.promo_line.discount_amount)}
                </span>
              </div>

              {/* Pending Cashback Note */}
              {order.promo_line.cashback_flag &&
                !order.promo_line.is_awarded && (
                  <p className="text-xs text-primary-600 italic pt-1">
                    {t("cashbackPendingNote")}
                  </p>
                )}
            </div>
          )}

          {/* Gift Card */}
          {parseFloat(order.gift_card_discount) > 0 && (
            <div className="bg-secondary-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-secondary-600">
                  {t("giftCardApplied")}
                </span>
                <span className="text-sm font-semibold text-secondary">
                  -{formatPrice(order.gift_card_discount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {order.promo_line || hasWalletUsed ? (
          <Divider className="my-3" />
        ) : (
          <Divider className="mb-3" />
        )}

        {/* Final Total */}
        <div className="flex justify-between items-center py-3 bg-content2 rounded-lg px-3">
          <span className="text-base font-bold text-foreground">
            {t("finalTotal") || "Final Total"}
          </span>
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(order.final_total)}
          </span>
        </div>

        {/* Total Payable — only shown when amount > 0 */}
        {parseFloat(order.total_payable) > 0 && (
          <div className="flex justify-between items-center py-2 px-3">
            <span className="text-sm font-semibold text-foreground">
              {t("totalPayable") || "Total Payable"}
            </span>
            <span className="text-base font-bold text-success">
              {formatPrice(order.total_payable)}
            </span>
          </div>
        )}

        {/* Wallet Note if used */}
        {hasWalletUsed && (
          <p className="text-xs text-default-500 mt-1 px-3 italic">
            {t("walletPaymentNote", {
              walletAmount: formatPrice(walletAmountUsed),
              remainingAmount: formatPrice(order.total_payable),
              paymentMethod:
                order.payment_method?.toUpperCase() || "PAYMENT GATEWAY",
            })}
          </p>
        )}

      </CardBody>
    </Card>
  );
};

export default OrderSummary;
