import type { Order } from "@/types/order";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui";
import { getFormattedDate } from "@/helpers/getters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  formatPrice: (amount: number | string | null | undefined) => string;
}

export default function OrderRefundsModal({
  isOpen,
  onClose,
  order,
  formatPrice,
}: Props) {
  const { t } = useTranslation();
  const issuedRefunds = (order.refunds ?? []).filter(
    (refund) => refund.status === "issued",
  );
  const totalIssued = issuedRefunds.reduce(
    (total, refund) => total + Number(refund.amount),
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
      placement="center"
      classNames={{
        closeButton:
          "text-base p-2 top-3 end-3 hover:bg-default-100 rounded-medium text-default-500 hover:text-foreground",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-50 text-success-700">
                  <Icon icon="solar:wallet-money-bold" width={18} height={18} />
                </span>
                <div>
                  <h3 className="text-base font-semibold leading-tight text-foreground">
                    {t("orderMoneySummary.refunded", "Refunds sent")}
                  </h3>
                  <p className="text-xs text-default-500">
                    {t("orderRefunds.totalRefunded", "Total refunded")}:{" "}
                    <span className="font-semibold text-foreground">
                      {formatPrice(totalIssued)}
                    </span>
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="py-3">
              {issuedRefunds.length === 0 ? (
                <div className="py-8 text-center text-sm text-default-500">
                  {t(
                    "orderRefunds.noIssuedRefunds",
                    "No issued refunds recorded.",
                  )}
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {issuedRefunds.map((refund) => {
                    const items = refund.items ?? [];
                    const hasItems = items.length > 0;
                    return (
                      <li
                        key={refund.id}
                        className="rounded-medium border border-divider bg-default-50/50 p-3 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {t(
                                  `orderRefunds.method.${refund.method}`,
                                  refund.method,
                                )}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700">
                                {t(
                                  `orderRefunds.status.${refund.status}`,
                                  "Refund sent",
                                )}
                              </span>
                            </div>
                            <div className="mt-1 text-default-500">
                              {(refund.issued_at || refund.created_at) && (
                                <span>
                                  {getFormattedDate(
                                    refund.issued_at ||
                                      refund.created_at ||
                                      "",
                                  )}
                                </span>
                              )}
                              {refund.id && (
                                <span className="ms-1.5 text-default-400">
                                  · #{refund.id}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="block text-sm font-bold text-foreground">
                              {formatPrice(refund.amount)}
                            </span>
                            {Number(refund.shipping_refund_amount) > 0 && (
                              <span className="block text-[11px] text-default-400">
                                {t("orderRefunds.shippingIncluded", {
                                  amount: formatPrice(
                                    refund.shipping_refund_amount,
                                  ),
                                  defaultValue:
                                    "Includes {{amount}} shipping",
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Associated line items or custom manual refund label */}
                        {hasItems ? (
                          <div className="mt-2.5 border-t border-divider/60 pt-2 space-y-1">
                            {items.map((it) => {
                              const orderItem = (order.items ?? []).find(
                                (item) => item.id === it.order_item_id,
                              );
                              const title =
                                orderItem?.product?.name ||
                                orderItem?.title ||
                                `${t("item", "Item")} #${it.order_item_id}`;
                              return (
                                <div
                                  key={it.order_item_id}
                                  className="flex items-center justify-between gap-2 text-default-600"
                                >
                                  <span className="truncate">
                                    {title} (×{it.quantity})
                                  </span>
                                  <span className="shrink-0 font-medium">
                                    {formatPrice(it.amount)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-2 border-t border-divider/60 pt-1.5 text-default-500">
                            <span>
                              {t(
                                "orderRefunds.manualRefundLabel",
                                "Custom / manual order adjustment",
                              )}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </ModalBody>

            <ModalFooter className="flex items-center justify-end border-t border-divider pt-3">
              <Button
                variant="bordered"
                onPress={onClose}
                className="h-9 px-4 text-xs sm:text-sm font-semibold"
              >
                {t("close", "Close")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
