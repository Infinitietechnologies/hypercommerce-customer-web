import { useTranslation } from "react-i18next";

import { Button, Image, Link } from "@/components/ui";
import { formatWatchBuyPrice } from "@/features/watchAndBuy/formatPrice";
import type { WatchBuyProduct } from "@/types/watchBuy";

interface ReelProductCardProps {
  product: WatchBuyProduct;
}

const ReelProductCard = ({ product }: ReelProductCardProps) => {
  const { t } = useTranslation();
  const sellingPrice = product.special_price ?? product.price;
  const discounted =
    product.special_price != null && product.special_price < product.price;
  const discountPercent = discounted
    ? Math.round(
        ((product.price - sellingPrice) / Math.max(product.price, 1)) * 100,
      )
    : 0;

  return (
    <li className="w-80 shrink-0 snap-start overflow-hidden rounded-large bg-content1 p-2 shadow-overlay">
      <div className="flex h-24 items-center gap-3">
        <Image
          removeWrapper
          disableAnimation
          src={product.image ?? undefined}
          alt={product.title}
          className="size-20 shrink-0 rounded-medium bg-content2 object-contain p-1"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-bold leading-4 text-foreground">
            {product.title}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-sm font-extrabold text-foreground">
              {formatWatchBuyPrice(product, sellingPrice)}
            </span>
            {discounted ? (
              <span className="truncate text-xxs text-default-400 line-through">
                {formatWatchBuyPrice(product, product.price)}
              </span>
            ) : null}
            {discounted ? (
              <span className="text-xxs font-bold text-danger">
                {t("discount", { percent: discountPercent })}
              </span>
            ) : null}
          </div>
        </div>
        <Button
          as={Link}
          href={`/products/${product.product_slug}`}
          size="sm"
          color="primary"
          isDisabled={!product.available}
          className="h-9 min-h-9 shrink-0 rounded-small px-3 text-xs"
        >
          {product.available
            ? t("watchBuy.products.view")
            : t("watchBuy.products.unavailable")}
        </Button>
      </div>
    </li>
  );
};

export default ReelProductCard;
