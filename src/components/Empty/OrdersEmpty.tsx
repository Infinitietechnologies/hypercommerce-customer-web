import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { EmptyState } from "@/components/ui";

const OrdersEmpty: React.FC = () => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={
        <Icon icon="solar:box-linear" width={40} height={40} className="text-primary-600" />
      }
      title={t("orders_empty_title")}
      description={t("orders_empty_description")}
      actionLabel={t("orders_empty_button")}
      onAction={() => {
        window.location.href = "/";
      }}
    />
  );
};

export default OrdersEmpty;
