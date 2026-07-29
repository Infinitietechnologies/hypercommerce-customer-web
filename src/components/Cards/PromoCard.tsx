import { useSettings } from "@/contexts/SettingsContext";
import { formatDate } from "@/helpers/validator";
import { PromoCode } from "@/types/ApiResponse";
import { Button, Card, CardBody, Chip, Divider, Progress } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface PromoCardProps {
  promo: PromoCode;
  onApply: (promoCode: string) => void;
  isDisabled: boolean;
}

const PromoCard: React.FC<PromoCardProps> = ({
  promo,
  onApply,
  isDisabled,
}) => {
  const { formatPrice } = useSettings();
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  // Show the More/Less toggle only when the (collapsed) HTML actually overflows.
  useEffect(() => {
    const measure = () => {
      const el = descRef.current;
      if (!el) return;
      if (expanded) return; // only measure in the clamped state
      setIsClamped(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [promo.description, expanded]);

  const getDiscountDisplay = () => {
    if (promo.discount_type === "percent") {
      return `${promo.discount_amount}%`;
    } else {
      return formatPrice(promo.discount_amount);
    }
  };

  const isExpired = new Date(promo.end_date) < new Date();

  return (
    <Card shadow="none">
      <CardBody className="h-full px-3 sm:px-4">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left section - Promo Details */}
          <div className="col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-bold text-sm sm:text-lg">{promo.code}</h3>
                <Chip
                  size="sm"
                  color={promo.promo_mode === "instant" ? "success" : "warning"}
                  variant="flat"
                  className="text-xs"
                  title={promo.promo_mode}
                >
                  {promo.promo_mode}
                </Chip>
                {isExpired && (
                  <Chip size="sm" color="danger" variant="flat">
                    {t("expired")}
                  </Chip>
                )}
              </div>

              {promo.description && (
                <div className="mb-2">
                  <div
                    ref={descRef}
                    className={`html-content text-xxs sm:text-xs text-foreground/50 ${
                      expanded ? "" : "line-clamp-2"
                    }`}
                    dangerouslySetInnerHTML={{ __html: promo.description }}
                  />
                  {(isClamped || expanded) && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="mt-0.5 text-xxs font-semibold text-primary-600 hover:opacity-80 sm:text-xs"
                    >
                      {expanded
                        ? t("showLess", { defaultValue: "Show less" })
                        : t("showMore", { defaultValue: "Show more" })}
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 text-xxs sm:text-xs text-foreground/50">
                <span>
                  {t("validTill")} {formatDate(promo.end_date)}
                </span>
                <Divider orientation="vertical" />
                <span>
                  {t("minOrder")}: {formatPrice(promo.min_order_total)}
                </span>
                {promo.max_discount_value && (
                  <>
                    <Divider orientation="vertical" />
                    <span>
                      {t("maxSave")}: {formatPrice(promo.max_discount_value)}
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Divider - Centered */}
          <div className="col-span-1 flex items-center justify-end">
            <div className="h-full w-px border-l-2 border-dotted border-divider"></div>
          </div>

          {/* Right section - Discount and Apply Button */}
          <div className="col-span-3 flex flex-col justify-between items-center h-full py-2">
            <div className="flex items-center justify-center">
              <span className="text-sm sm:text-2xl font-bold text-primary">
                {getDiscountDisplay()}
              </span>
            </div>

            <div className="flex items-end">
              <Button
                color="primary"
                variant={isExpired ? "flat" : "solid"}
                size="sm"
                onPress={() => !isExpired && onApply(promo.code)}
                isDisabled={isExpired || isDisabled}
                className="font-semibold text-xs"
              >
                {isExpired ? t("expired") : t("apply")}
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PromoCard;
