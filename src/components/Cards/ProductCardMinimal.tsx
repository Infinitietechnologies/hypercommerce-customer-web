import { Icon } from "@iconify/react";
import Link from "next/link";
import { FC } from "react";

import ProductCardAction from "@/components/Cards/ProductCardAction";
import ProductCardMedia from "@/components/Cards/ProductCardMedia";
import ProductCardPrice from "@/components/Cards/ProductCardPrice";
import type { ProductCardLayoutProps } from "@/components/Cards/productCardTypes";
import { Card, CardBody, CardFooter } from "@/components/ui";

const ProductCardMinimal: FC<ProductCardLayoutProps> = (props) => {
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
      className="h-full w-full overflow-hidden rounded-large text-start shadow-sm"
      data-card-style="minimal"
    >
      <CardBody className="grow-0 overflow-hidden p-0">
        <ProductCardMedia
          {...props}
          cardStyle="minimal"
          onProductClick={onProductClick}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
        />
      </CardBody>

      <CardFooter className="grow flex-col items-stretch gap-1.5 px-3 pb-3 pt-2.5">
        <span className="truncate text-xxs font-medium uppercase tracking-wide text-default-500">
          {product.category_name || product.brand_name}
        </span>

        <Link
          href={productHref}
          className="line-clamp-2 h-10 text-sm font-medium leading-snug text-foreground"
          title={product.title}
          onClick={onProductClick}
        >
          {product.title}
        </Link>

        {hasRating ? (
          <span className="flex items-center gap-1 text-xs text-default-500">
            <Icon icon="solar:star-bold" className="text-rating-star" />
            <strong className="font-semibold text-foreground">
              {rating.toFixed(1)}
            </strong>
            {product.rating_count > 0 ? (
              <span>({product.rating_count})</span>
            ) : null}
          </span>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <ProductCardPrice pricing={pricing} size="compact" />
          {showAddToCart ? (
            <ProductCardAction
              appearance="small"
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

export default ProductCardMinimal;
