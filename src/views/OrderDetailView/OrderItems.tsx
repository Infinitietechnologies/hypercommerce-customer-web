import OrderItemReviewCard from "@/components/Modals/OrderItemReviewCard";
import FilePreview from "@/components/FilePreview";
import { orderStatusColorMap } from "@/config/constants";
import { getOrderStatusBtnConfig } from "@/helpers/getters";
import { Order, OrderItem } from "@/types/ApiResponse";
import { Button, Card, CardBody, CardHeader, Chip, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import React, { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/components/Functional/Price";
import Lightbox from "yet-another-react-lightbox";

interface GroupedStore {
  store: OrderItem["store"];
  items: OrderItem[];
}

interface OrderItemsProps {
  order: Order;
  handleProductReview: (item: OrderItem) => void;
  onReturnOpen?: () => void;
  onCancelOpen?: () => void;
}

const OrderItems: FC<OrderItemsProps> = ({
  order,
  handleProductReview,
  onReturnOpen,
  onCancelOpen,
}) => {
  const buttonConfig = getOrderStatusBtnConfig(order.status);
  const { t } = useTranslation();
  const { formatWith } = useCurrency();
  // Detail amounts are shown in THIS order's own market currency (a past order
  // may belong to a different market than the currently selected one).
  const formatPrice = (amount: number | string | null | undefined) =>
    formatWith(amount, order.currency_symbol, order.format);

  const groupedItems = useMemo(() => {
    const grouped = order.items.reduce(
      (acc, item) => {
        const storeId = item.store.id;
        if (!acc[storeId]) {
          acc[storeId] = {
            store: item.store,
            items: [],
          };
        }
        acc[storeId].items.push(item);
        return acc;
      },
      {} as Record<number, GroupedStore>,
    );

    return Object.values(grouped);
  }, [order.items]);

  const ProductImageWithLightbox = ({
    src,
    alt,
  }: {
    src?: string | null;
    alt: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!src) {
      return (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0 bg-content2 border border-divider flex items-center justify-center text-[10px] px-2 text-default-500 text-center">
          {alt || "N/A"}
        </div>
      );
    }

    return (
      <>
        <Image
          src={src}
          alt={alt}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0 cursor-pointer"
          onClick={() => setIsOpen(true)}
        />

        {isOpen && (
          <Lightbox
            open={isOpen}
            close={() => setIsOpen(false)}
            slides={[{ src }]}
          />
        )}
      </>
    );
  };

  return (
    <Card shadow="none" radius="lg" className="border border-divider">
      <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
        <div className="flex items-center gap-2">
          <Icon icon="solar:bag-check-linear" className="w-4 h-4 text-default-500" />
          <h3 className="text-sm font-medium text-foreground">
            {t("orderItems")} ({order.items.length})
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {buttonConfig.cancelOrder &&
            onCancelOpen &&
            order.items.some((item) => item.can_cancel) && (
              <Button
                size="sm"
                variant="light"
                startContent={<Icon icon="solar:box-linear" className="w-3 h-3" />}
                className="text-xs h-6 sm:h-5"
                onPress={onCancelOpen}
                title={t("cancel")}
              >
                {t("cancel")}
              </Button>
            )}
          {buttonConfig.returnOrder &&
            order.items.some((item) => item.return_eligible) &&
            onReturnOpen && (
              <Button
                size="sm"
                color="primary"
                variant="light"
                className="text-xs h-6 sm:h-5"
                onPress={onReturnOpen}
                startContent={<Icon icon="solar:box-linear" className="w-4 h-4" />}
                title={t("return")}
              >
                {t("return")}
              </Button>
            )}
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {groupedItems.map((group) => (
            <div
              key={group.store.id}
              className="bg-content2 rounded-lg p-3 border border-divider"
            >
              {/* Store Header */}
              <div className="mb-3 pb-2 border-b border-divider">
                <div className="flex flex-wrap items-center gap-1 text-xs text-default-500">
                  <span>{t("soldBySection.storeLabel")}</span>
                  <Link
                    title={group.store.name}
                    href={`/stores/${group.store.slug}`}
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    {group.store.name}
                  </Link>
                </div>
              </div>

              {/* Items in this store */}
              <div className="space-y-3">
                {group.items.map((item, itemIndex) => (
                  <div key={item.id}>
                    <div className="flex flex-row justify-between w-full gap-3 sm:gap-4">
                      {/* Product Image */}
                      <div className="shrink-0 self-start">
                        <ProductImageWithLightbox
                          src={item.product?.image}
                          alt={item.variant_title}
                        />
                      </div>

                      {/* Content Container */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Product Name and Variant */}
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm">
                            {item.product?.slug ? (
                              <Link
                                title={item.product?.name || ""}
                                href={`/products/${item.product?.slug}`}
                                className="hover:text-primary wrap-break-word"
                              >
                                {item.product?.name || item.title}
                              </Link>
                            ) : (
                              <span title={item.title}>{item.title}</span>
                            )}
                          </h3>

                          {!(item as any)?.product && (
                            <p className="text-xxs sm:text-xs text-danger">
                              {item.title} product is deleted.
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 items-center">
                            {item.variant?.title && (
                              <div className="text-xxs sm:text-xs text-foreground/50">
                                {item.variant.title}
                              </div>
                            )}
                             {/* ADDONS LIST */}
                             {item.addons && item.addons.length > 0 && (
                               <div className="mt-1 w-full">
                                 <p className="text-[10px] font-bold text-foreground/60 uppercase">
                                   {t("addons") || "Addons"}:
                                 </p>
                                 <div className="text-[10px] text-foreground/40 leading-tight break-words flex flex-col gap-0.5 mt-0.5">
                                   {item.addons.map((addon: any, idx: number) => {
                                     const groupTitle =
                                       addon.group?.title ||
                                       addon.addon_group_name;
                                     const itemTitle =
                                       addon.item?.title || addon.title;
                                     const addonPrice = Number(
                                       addon.price || addon.item?.price || 0,
                                     );
                                     return (
                                       <span key={idx} className="block">
                                          {groupTitle ? `${groupTitle}: ` : ""}
                                          {itemTitle}
                                          <span className="ms-1 opacity-80 font-medium">
                                            ({item.quantity} ×{" "}
                                            {formatPrice(addonPrice)})
                                          </span>
                                        </span>
                                     );
                                   })}
                                 </div>
                               </div>
                             )}
                            {item.otp && (
                              <Chip
                                size="sm"
                                color="default"
                                variant="bordered"
                                radius="sm"
                                title={item.otp}
                                classNames={{
                                  content: "text-xxs sm:text-xs cursor-pointer",
                                }}
                              >
                                {t("otp")}: {item.otp}
                              </Chip>
                            )}
                          </div>
                        </div>

                        {/* Price, Status and Review Row */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          {/* Price Info */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                            <span className="text-default-500">
                              {formatPrice(
                                Number(item.price) + Number(item.tax_amount),
                              )}{" "}
                              × {item.quantity}
                            </span>
                            <p className="font-semibold text-foreground">
                              {formatPrice(item.subtotal)}
                            </p>
                          </div>

                          {/* Status Chip — customer-friendly headline */}
                          <Chip
                            size="sm"
                            color={orderStatusColorMap(item?.customer_status?.code)}
                            variant="flat"
                            radius="sm"
                            className="hover:cursor-pointer"
                            classNames={{ content: "text-xs" }}
                            title={
                              item.customer_status?.label || item.status_label
                            }
                          >
                            {item.customer_status?.label || item.status_label}
                          </Chip>
                        </div>

                        {/* Active shipment details */}
                        {item.shipment && (
                          <div className="mt-2 rounded-lg border border-divider bg-content2 p-2.5 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <Icon icon="solar:delivery-linear" className="w-3.5 h-3.5 shrink-0 text-foreground/50" />
                                <span className="truncate text-xs font-medium text-foreground">
                                  {item.shipment.carrier_name || t("na", { defaultValue: "N/A" })}
                                </span>
                              </div>
                              {item.shipment.customer_status_label && (
                                <Chip size="sm" variant="flat" radius="sm" color="primary" classNames={{ content: "text-[11px]" }}>
                                  {item.shipment.customer_status_label}
                                </Chip>
                              )}
                            </div>
                            {item.shipment.tracking_number && (
                              <p className="text-[11px] text-foreground/50">
                                {t("trackingNumber", { defaultValue: "Tracking #" })}:{" "}
                                <span className="font-medium text-foreground/70">
                                  {item.shipment.tracking_number}
                                </span>
                              </p>
                            )}
                            {item.shipment.tracking_url && (
                              <a
                                href={item.shipment.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                {t("track", { defaultValue: "Track" })}
                                <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Review Section */}
                        {item.customer_status?.code === "delivered" && (
                          <div className="pt-1">
                            {item.is_user_review_given ? (
                              <OrderItemReviewCard
                                userReview={item.user_review}
                              />
                            ) : (
                              <Button
                                onPress={() => handleProductReview(item)}
                                size="sm"
                                variant="flat"
                                color="warning"
                                className="text-xs h-7 px-3"
                                startContent={<Icon icon="solar:star-bold" width={12} height={12} />}
                                title={t("review")}
                              >
                                {t("review")}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Attachments Section */}
                        {item.attachments && item.attachments.length > 0 && (
                          <FilePreview attachments={item.attachments} />
                        )}
                      </div>
                    </div>

                    {/* Divider between items */}
                    {itemIndex < group.items.length - 1 && (
                      <div className="my-3 border-t border-divider" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default OrderItems;
