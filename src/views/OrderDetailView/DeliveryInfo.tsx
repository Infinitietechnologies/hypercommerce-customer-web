import { Order, OrderShipment } from "@/types/ApiResponse";
import { Card, CardBody, CardHeader, Chip, Divider } from "@/components/ui";
import { Icon } from "@iconify/react";
import { getFormattedDate } from "@/helpers/getters";
import { orderStatusColorMap } from "@/config/constants";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface DeliveryInfoProps {
  order: Order;
  itemId: number;
}

export function shipmentsForItem(shipments: OrderShipment[], itemId: number): OrderShipment[] {
  return shipments
    .filter((shipment) => shipment.products.some((product) => product.order_item_id === itemId))
    .map((shipment) => ({
      ...shipment,
      products: shipment.products.filter((product) => product.order_item_id === itemId),
    }));
}

// DeliveryInfo — per-shipment tracking view (replaces delivery-boy tracking).
const DeliveryInfo: FC<DeliveryInfoProps> = ({ order, itemId }) => {
  const { t } = useTranslation();
  const shipments = shipmentsForItem(order.shipments ?? [], itemId);

  return (
    <Card shadow="none" radius="lg" className="border border-divider">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Icon icon="solar:delivery-linear" className="w-4 h-4 text-default-500" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("shipments") || t("delivery_info")}
          </h3>
          <span className="text-xs text-default-400">{t("pages.order.selectedItem", "Selected item")}</span>
        </div>
      </CardHeader>
      <CardBody className="px-4 pb-4 pt-0">
        {shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Icon icon="solar:box-linear" className="w-6 h-6 text-foreground/30" />
            <p className="text-xs text-default-500">
              {t("notYetShipped") || "Not yet shipped"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((shipment) => {
              const statusText =
                shipment.customer_status_label || shipment.status_label;
              return (
                <div
                  key={shipment.id}
                  className="rounded-medium border border-divider p-3 space-y-3"
                >
                  {/* Carrier + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon icon="solar:delivery-linear" className="w-3.5 h-3.5 text-default-500 shrink-0" />
                        <span className="text-sm font-semibold text-foreground break-words">
                          {shipment.carrier_name || t("na")}
                        </span>
                      </div>
                      {shipment.tracking_number && (
                        <p className="text-xs text-default-500 mt-1 break-all">
                          {t("trackingNumber") || "Tracking #"}:{" "}
                          <span className="font-medium text-default-600">
                            {shipment.tracking_number}
                          </span>
                        </p>
                      )}
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      radius="sm"
                      color={orderStatusColorMap(shipment.customer_status || shipment.status)}
                      classNames={{ content: "text-xs" }}
                      title={statusText}
                    >
                      {statusText}
                    </Chip>
                  </div>

                  {/* Parcel products */}
                  {shipment.products.length > 0 && (
                    <div className="space-y-1">
                      {shipment.products.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 text-sm leading-5 text-default-600"
                        >
                          <div className="min-w-0 break-words">
                            <p className="font-medium text-foreground">{product.title || t("na")}</p>
                            {product.variant && <p className="mt-0.5 text-xs text-default-500">{product.title && product.variant.startsWith(product.title) ? product.variant.slice(product.title.length).replace(/^\s*[-–—]\s*/, "") : product.variant}</p>}
                          </div>
                          <span className="shrink-0 text-xs font-medium text-default-500">
                            × {product.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamps */}
                  {(shipment.picked_up_at || shipment.delivered_at) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-default-500">
                      {shipment.picked_up_at && (
                        <span>
                          {t("pickedUp") || "Picked up"}:{" "}
                          {getFormattedDate(shipment.picked_up_at)}
                        </span>
                      )}
                      {shipment.delivered_at && (
                        <span>
                          {t("delivered") || "Delivered"}:{" "}
                          {getFormattedDate(shipment.delivered_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Track link (external) */}
                  {shipment.tracking_url && (
                    <>
                      <Divider className="opacity-50" />
                      <a
                        href={shipment.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        {t("track") || "Track"}
                        <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default DeliveryInfo;
