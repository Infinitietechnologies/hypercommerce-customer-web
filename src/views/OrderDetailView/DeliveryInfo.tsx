import type { OrderItem, OrderShipment } from "@/types/ApiResponse";

import { Icon } from "@iconify/react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface DeliveryInfoProps {
  item: OrderItem;
}

const terminalItemStatuses = new Set([
  "delivered",
  "cancelled",
  "returned",
  "refunded",
]);

const isDelivered = (shipment: OrderShipment) =>
  shipment.customer_status === "delivered" || shipment.status === "delivered";

const safeTrackingUrl = (url: string | null) =>
  url && /^https?:\/\//i.test(url) ? url : null;

// Each parcel independently shows either a compact carrier action or the
// availability notice. Delivered parcels disappear from the order card.
const DeliveryInfo: FC<DeliveryInfoProps> = ({ item }) => {
  const { t } = useTranslation();
  const allShipments = item.shipments ?? [];
  const openShipments = allShipments.filter((shipment) => !isDelivered(shipment));
  const itemStatus = item.customer_status?.code;

  if (
    (itemStatus && terminalItemStatuses.has(itemStatus)) ||
    (allShipments.length > 0 && openShipments.length === 0)
  ) {
    return null;
  }

  const trackableShipments = openShipments
    .map((shipment) => ({
      shipment,
      trackingUrl: safeTrackingUrl(shipment.tracking_url),
    }))
    .filter(
      (entry): entry is { shipment: OrderShipment; trackingUrl: string } =>
        Boolean(entry.trackingUrl),
    );
  const hasUnavailableTracking =
    openShipments.length === 0 || trackableShipments.length < openShipments.length;
  const showShipmentMeta = allShipments.length > 1;

  return (
    <section
      className="space-y-2 px-4 pb-4"
      aria-label={t("trackingDetails", "Tracking details")}
    >
      {trackableShipments.map(({ shipment, trackingUrl }) => (
        <div
          key={shipment.id}
          className="flex items-center gap-3 rounded-medium bg-primary-50 px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            {showShipmentMeta && (
              <div className="mb-0.5 text-[10px] font-medium text-default-500">
                {t("shipmentNumber", {
                  id: shipment.id,
                  defaultValue: "Shipment #{{id}}",
                })}{" "}
                · {t("qty")}: {shipment.quantity}
              </div>
            )}
            <div className="truncate text-sm font-semibold text-foreground">
              {shipment.carrier_name || t("carrier", "Carrier")}
            </div>
            <div className="mt-0.5 truncate text-xs text-default-500">
              {t("trackingNumber", "Tracking number")}: {shipment.tracking_number || t("notAvailable", "Not available")}
            </div>
          </div>

          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-content1 text-primary-600 shadow-sm transition-colors hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t("trackOrder", "Track order")}
            title={t("trackOrder", "Track order")}
          >
            <Icon icon="solar:map-arrow-square-linear" width={20} height={20} />
          </a>
        </div>
      ))}

      {hasUnavailableTracking && (
        <div className="flex items-start gap-2 rounded-medium bg-content2 px-3 py-2.5 text-xs leading-5 text-default-600">
          <Icon
            icon="solar:info-circle-linear"
            width={18}
            height={18}
            className="mt-px shrink-0"
          />
          <span>
            {t(
              "trackingLinkNotAvailable",
              "Tracking details will be available once the carrier provides them.",
            )}
          </span>
        </div>
      )}
    </section>
  );
};

export default DeliveryInfo;
