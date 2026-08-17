import clsx from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import type { ProductCardPricing } from "@/components/Cards/productCardTypes";

interface ProductCardPriceProps {
  pricing: ProductCardPricing;
  size?: "compact" | "default" | "large";
  stacked?: boolean;
  showDiscount?: boolean;
}

const ProductCardPrice: FC<ProductCardPriceProps> = ({
  pricing,
  size = "default",
  stacked = false,
  showDiscount = true,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={clsx(
        "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1",
        stacked && "flex-col items-start gap-y-0.5",
      )}
    >
      <span
        className={clsx(
          "font-display font-bold leading-none text-foreground",
          size === "compact" && "text-sm",
          size === "default" && "text-base sm:text-lg",
          size === "large" && "text-lg sm:text-xl",
        )}
      >
        {pricing.current}
      </span>

      {pricing.original ? (
        <span className="text-xs text-default-400 line-through">
          {pricing.original}
        </span>
      ) : null}

      {showDiscount && pricing.discountPercentage > 0 ? (
        <span
          className={clsx(
            "whitespace-nowrap font-bold leading-normal text-success",
            size === "compact" ? "text-xs" : "text-sm",
          )}
        >
          {t("discount", { percent: pricing.discountPercentage })}
        </span>
      ) : null}
    </div>
  );
};

export default ProductCardPrice;
