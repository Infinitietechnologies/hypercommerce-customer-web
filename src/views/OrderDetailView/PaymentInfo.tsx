import React, { FC } from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { Order } from "@/types/ApiResponse";
import { useCurrency } from "@/components/Functional/Price";

interface PaymentInfoProps {
  order: Order;
}

const PaymentInfo: FC<PaymentInfoProps> = ({ order }) => {
  const { t } = useTranslation();
  const { formatWith } = useCurrency();
  // Show amounts in THIS order's own market currency.
  const formatPrice = (amount: number | string | null | undefined) =>
    formatWith(amount, order.currency_symbol, order.format);

  // Calculate wallet amount used
  const walletAmountUsed = Math.max(0, Number(order.wallet_balance || 0));
  const hasWalletUsed = walletAmountUsed > 0;

  return (
    <Card shadow="none" radius="lg" className="border border-divider">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon icon="solar:card-linear" className="w-4 h-4 text-default-500" />
          <h3 className="text-sm font-medium text-foreground">
            {t("paymentDetails")}
          </h3>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-default-500">
              {t("paymentMethod")}
            </span>
            <div className="flex gap-1 flex-wrap justify-end">
              {hasWalletUsed && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="secondary"
                  radius="sm"
                  classNames={{ content: "text-xs" }}
                  title="WALLET"
                >
                  WALLET
                </Chip>
              )}
              {order.payment_method &&
                order.payment_method.toLowerCase() !== "wallet" && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    radius="sm"
                    classNames={{ content: "text-xs" }}
                    title={order.payment_method?.toUpperCase()}
                  >
                    {order.payment_method?.toUpperCase()}
                  </Chip>
                )}
            </div>
          </div>
          {hasWalletUsed && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-default-500">
                {t("walletAmountUsed")}
              </span>
              <span className="text-xs font-semibold text-secondary">
                {formatPrice(walletAmountUsed)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-default-500">
              {t("paymentStatus")}
            </span>
            <Chip
              size="sm"
              variant="flat"
              radius="sm"
              classNames={{ content: "text-xs" }}
              title={
                order.payment_status?.charAt(0).toUpperCase() +
                order.payment_status?.slice(1)
              }
              color={order.payment_status === "pending" ? "warning" : "success"}
            >
              {order.payment_status?.charAt(0).toUpperCase() +
                order.payment_status?.slice(1)}
            </Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PaymentInfo;
