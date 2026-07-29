import React, { FC } from "react";
import { Avatar, Card, CardBody, CardHeader } from "@heroui/react";
import { Order } from "@/types/ApiResponse";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

interface ShippingInfoProps {
  order: Order;
}

const ShippingInfo: FC<ShippingInfoProps> = ({ order }) => {
  const { t } = useTranslation();

  return (
    <Card shadow="none" radius="lg" className="border border-divider">
      <CardHeader className="pb-2 flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Icon icon="solar:map-point-linear" className="w-4 h-4 text-default-500" />
          <h3 className="text-sm font-medium text-foreground">
            {t("shippingAddress")}
          </h3>
        </div>
        {/* Google Maps Link */}
        {order.shipping_latitude && order.shipping_longitude && (
          <div className="flex items-center gap-1 text-xs">
            <Icon icon="solar:map-linear" className="w-3.5 h-3.5 text-primary-500" />
            <a
              href={`https://www.google.com/maps?q=${order.shipping_latitude},${order.shipping_longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400"
              title={t("viewOnMap")}
            >
              {t("viewOnMap")}
            </a>
          </div>
        )}
      </CardHeader>

      <CardBody className="pt-0">
        <div className="flex items-start gap-3">
          <Avatar
            showFallback
            name={order.shipping_name}
            size="sm"
            className="shrink-0 w-8 h-8 text-[10px]"
            title={order.shipping_name}
          />

          <div className="flex-1 space-y-1">
            {/* Name */}
            <div className="text-sm font-medium text-foreground">
              {order.shipping_name}
            </div>

            {/* Full Address */}
            <div className="text-xs text-default-500 leading-snug space-y-1">
              {[
                [order.shipping_address_1, order.shipping_address_2]
                  .filter(Boolean)
                  .join(", "),
                `${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}, ${order.shipping_country}`,
              ].map((line, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <Icon icon="solar:map-point-linear" className="w-3.5 h-3.5 mt-0.5 text-default-500" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            {/* Phone */}
            {order.shipping_phone && (
              <div className="flex items-center gap-1 text-xs text-default-500 mt-1">
                <Icon icon="solar:phone-linear" className="w-3.5 h-3.5 text-default-400" />
                <span>{order.shipping_phone}</span>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ShippingInfo;
