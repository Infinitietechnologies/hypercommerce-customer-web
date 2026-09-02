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

  return (
    <li className="w-60 shrink-0 snap-start overflow-hidden rounded-medium bg-content1 p-1.5 shadow-overlay">
      <div className="flex h-28 gap-2">
        <Image
          removeWrapper
          disableAnimation
          src={product.image ?? undefined}
          alt={product.title}
          className="h-full w-20 rounded-small bg-content2 object-contain p-1"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="line-clamp-2 text-xs font-bold leading-4 text-foreground">
            {product.title}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <span className="text-sm font-extrabold text-foreground">
              {formatWatchBuyPrice(product, sellingPrice)}
            </span>
            {discounted ? (
              <span className="truncate text-xxs text-default-400 line-through">
                {formatWatchBuyPrice(product, product.price)}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xxs text-default-500">
            {product.store_name}
          </p>
          <Button
            as={Link}
            href={`/products/${product.product_slug}`}
            size="sm"
            color="primary"
            className="mt-auto h-7 min-h-7 w-full rounded-small px-2 text-xxs"
          >
            {t("watchBuy.products.viewProduct")}
          </Button>
        </div>
      </div>
    </li>
  );
};

export default ReelProductCard;
