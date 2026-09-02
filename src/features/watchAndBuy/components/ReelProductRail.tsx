import { useTranslation } from "react-i18next";

import type { WatchBuyProduct } from "@/types/watchBuy";

import ReelProductCard from "./ReelProductCard";

interface ReelProductRailProps {
  products: WatchBuyProduct[];
}

const ReelProductRail = ({ products }: ReelProductRailProps) => {
  const { t } = useTranslation();

  if (products.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 pb-2 ps-4">
      <div className="mb-1 flex items-center justify-between pe-4 text-xxs font-bold text-shell-foreground drop-shadow-sm">
        <span>{t("watchBuy.products.featuredTitle")}</span>
        <span className="text-shell-muted">
          {t("watchBuy.products.count", { count: products.length })}
        </span>
      </div>
      <ul className="scrollbar-hide flex snap-x gap-2 overflow-x-auto pe-4">
        {products.map((product, index) => (
          <ReelProductCard
            key={`${product.variant_id}-${index}`}
            product={product}
          />
        ))}
      </ul>
    </div>
  );
};

export default ReelProductRail;
