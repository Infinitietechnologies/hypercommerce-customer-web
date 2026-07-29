import { Order, OrderShipment } from "@/types/ApiResponse";
import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { getFormattedDate } from "@/helpers/getters";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface DeliveryInfoProps {
  order: Order;
}

// DeliveryInfo — per-shipment tracking view (replaces delivery-boy tracking).
const DeliveryInfo: FC<DeliveryInfoProps> = ({ order }) => {
  const { t } = useTranslation();
  const shipments: OrderShipment[] = order.shipments ?? [];

  return (
    <Card shadow="none" radius="lg" className="border border-divider">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon icon="solar:delivery-linear" className="w-4 h-4 text-default-500" />
          <h3 className="text-sm font-medium text-foreground">
            {t("shipments") || t("delivery_info")}
          </h3>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
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
                  className="rounded-lg border border-divider bg-content2 p-3 space-y-2"
                >
                  {/* Carrier + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon icon="solar:delivery-linear" className="w-3.5 h-3.5 text-foreground/50 shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">
                          {shipment.carrier_name || t("na")}
                        </span>
                      </div>
                      {shipment.tracking_number && (
                        <p className="text-xxs text-foreground/50 mt-0.5">
                          {t("trackingNumber") || "Tracking #"}:{" "}
                          <span className="font-medium text-foreground/70">
                            {shipment.tracking_number}
                          </span>
                        </p>
                      )}
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      radius="sm"
                      color="primary"
                      classNames={{ content: "text-xxs" }}
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
                          className="flex items-center justify-between text-xxs text-foreground/70"
                        >
                          <span className="truncate">
                            {product.title || t("na")}
                            {product.variant ? ` — ${product.variant}` : ""}
                          </span>
                          <span className="shrink-0 ml-2 text-foreground/50">
                            × {product.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamps */}
                  {(shipment.picked_up_at || shipment.delivered_at) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xxs text-foreground/50">
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
