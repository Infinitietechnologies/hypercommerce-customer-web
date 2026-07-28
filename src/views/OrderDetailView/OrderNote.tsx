import { Order } from "@/types/ApiResponse";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface OrderItemsProps {
  order: Order;
}

const OrderNote: FC<OrderItemsProps> = ({ order }) => {
  const { t } = useTranslation();

  return (
    <>
      {order.order_note ? (
        <Card shadow="sm" radius="lg" className="border border-divider">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Icon icon="solar:notes-linear" className="w-4 h-4 text-default-500" />
              <h3 className="text-sm font-medium text-foreground">
                {t("orderNote")}
              </h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {/* Order Note */}
            <div className="text-sm font-medium text-foreground/50">
              {order.order_note}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
};

export default OrderNote;
