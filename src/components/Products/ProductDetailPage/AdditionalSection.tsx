import { Icon } from "@iconify/react";
import { FC } from "react";
import type { Product } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";
import { formatDeliveryByDate } from "@/helpers/delivery";

interface AdditionalSectionProps {
  product: Product;
}

/**
 * Redesign "promises" box (sandbox PDP) — a vertical list of the delivery /
 * returns / warranty / guarantee / cancellation / origin commitments, each
 * backed by a real product field. Rows only render when their field is present.
 */
const AdditionalSection: FC<AdditionalSectionProps> = ({ product }) => {
  const { t } = useTranslation();
  const {
    is_returnable,
    warranty_period,
    guarantee_period,
    made_in,
    returnable_days,
    is_cancelable,
    cancelable_till,
    estimated_delivery_time,
    delivery_eta,
  } = product;

  // Country/zone-based delivery date (backend resolveProductEta), shown as a
  // concrete "by <date>" from the worst-case max day; preferred over the
  // distance-based minutes estimate.
  const etaByDate = formatDeliveryByDate(delivery_eta);

  const getReturnLabel = () => {
    if (returnable_days)
      return t("return_days_policy", { count: returnable_days });
    return t("returnable");
  };

  const getCancelLabel = () => {
    if (cancelable_till)
      return t("cancel_till_policy", { date: cancelable_till });
    return t("cancelable");
  };

  const rows = [
    {
      icon: "solar:delivery-linear",
      label: t("delivery"),
      value: etaByDate
        ? t("deliveryByShort", { date: etaByDate, defaultValue: `By ${etaByDate}` })
        : estimated_delivery_time
          ? `${estimated_delivery_time} ${t("mins")}`
          : null,
      available: !!(etaByDate || estimated_delivery_time),
    },
    {
      icon: "solar:refresh-linear",
      label: t("returns"),
      value: getReturnLabel(),
      available: !!is_returnable,
    },
    {
      icon: "solar:close-circle-linear",
      label: t("cancellation"),
      value: getCancelLabel(),
      available: !!is_cancelable,
    },
    {
      icon: "solar:shield-check-linear",
      label: t("warranty"),
      value: warranty_period,
      available: !!warranty_period && warranty_period !== "0",
    },
    {
      icon: "solar:medal-ribbon-star-linear",
      label: t("guarantee"),
      value: guarantee_period,
      available: !!guarantee_period && guarantee_period !== "0",
    },
    {
      icon: "solar:map-point-linear",
      label: t("origin"),
      value: made_in,
      available: !!made_in,
    },
  ].filter((r) => r.available);

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-divider bg-content1 p-4">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3 text-sm">
          <Icon icon={row.icon} className="shrink-0 text-xl text-primary-600" />
          <span className="text-foreground/60">{row.label}</span>
          <span className="ms-auto font-semibold text-foreground">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default AdditionalSection;
