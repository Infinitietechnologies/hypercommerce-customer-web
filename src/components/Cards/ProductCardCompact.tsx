import { Icon } from "@iconify/react";
import Link from "next/link";
import { FC } from "react";

import ProductCardAction from "@/components/Cards/ProductCardAction";
import ProductCardMedia from "@/components/Cards/ProductCardMedia";
import ProductCardPrice from "@/components/Cards/ProductCardPrice";
import type { ProductCardLayoutProps } from "@/components/Cards/productCardTypes";
import { Card, CardBody, CardFooter } from "@/components/ui";

const ProductCardCompact: FC<ProductCardLayoutProps> = (props) => {
  const {
    product,
    productHref,
    pricing,
    rating,
    hasRating,
    showAddToCart,
    isAddingToCart,
    isOutOfStock,
    productRef,
    onProductClick,
    onToggleFavorite,
    onShare,
    onAddToCart,
  } = props;

  return (
    <Card
      ref={productRef}
      as="div"
      className="h-full w-full rounded-large p-3 text-start shadow-sm"
      data-card-style="compact"
    >
      <CardBody className="grow-0 overflow-hidden p-0">
        <ProductCardMedia
          {...props}
          cardStyle="compact"
          onProductClick={onProductClick}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
        />
      </CardBody>

      <CardFooter className="grow flex-col items-stretch gap-2 px-0 pb-1 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-default-500">
            {product.category_name || product.brand_name}
          </span>
          {hasRating ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
              <Icon icon="solar:star-bold" className="text-rating-star" />
              {rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <Link
          href={productHref}
          className="truncate text-base font-bold leading-snug text-foreground"
          title={product.title}
          onClick={onProductClick}
        >
          {product.title}
        </Link>

        <div className="mt-auto flex items-start justify-between gap-3 border-t border-divider pt-3">
          <div className="min-w-0 flex-1 pb-1">
            <ProductCardPrice pricing={pricing} stacked />
          </div>
          {showAddToCart ? (
            <ProductCardAction
              appearance="compact"
              isLoading={isAddingToCart}
              isOutOfStock={isOutOfStock}
              onPress={onAddToCart}
            />
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCardCompact;
