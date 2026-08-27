import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import { Button, Divider, Image, Link, Sheet } from "@/components/ui";
import type { WatchBuyProduct } from "@/types/watchBuy";

interface ProductSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: WatchBuyProduct[];
}

const formatPrice = (product: WatchBuyProduct, value: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: product.currency_code,
    }).format(value);
  } catch {
    return `${product.currency_symbol}${value.toFixed(2)}`;
  }
};

const ProductSheet = ({
  isOpen,
  onOpenChange,
  products,
}: ProductSheetProps) => {
  const { t } = useTranslation();

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      backdrop="blur"
      title={
        <div>
          <p className="text-lg font-extrabold text-foreground">
            {t("watchBuy.products.title")}
          </p>
          <p className="text-sm font-normal text-default-500">
            {t("watchBuy.products.subtitle", { count: products.length })}
          </p>
        </div>
      }
    >
      <ul className="flex flex-col gap-3 pb-2">
        {products.map((product, index) => {
          const sellingPrice = product.special_price ?? product.price;
          const discounted =
            product.special_price != null &&
            product.special_price < product.price;

          return (
            <li key={`${product.variant_id}-${index}`}>
              <div className="flex gap-3 py-1">
                <Image
                  removeWrapper
                  disableAnimation
                  src={product.image ?? undefined}
                  alt={product.title}
                  className="size-20 shrink-0 rounded-medium border border-divider bg-content2 object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold text-foreground">
                    {product.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-default-500">
                    {product.variant_title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      {formatPrice(product, sellingPrice)}
                    </span>
                    {discounted ? (
                      <span className="text-xs text-default-400 line-through">
                        {formatPrice(product, product.price)}
                      </span>
                    ) : null}
                    {!product.available ? (
                      <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xxs font-bold text-danger">
                        {t("watchBuy.products.unavailable")}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button
                  as={Link}
                  href={`/products/${product.product_slug}`}
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="self-center"
                  endContent={<Icon icon="solar:arrow-right-linear" />}
                >
                  {t("watchBuy.products.view")}
                </Button>
              </div>
              {index < products.length - 1 ? (
                <Divider className="mt-3" />
              ) : null}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
};

export default ProductSheet;
