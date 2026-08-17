import { Icon } from "@iconify/react";
import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import ProductCardAction from "@/components/Cards/ProductCardAction";
import ProductCardMedia from "@/components/Cards/ProductCardMedia";
import ProductCardPrice from "@/components/Cards/ProductCardPrice";
import type { ProductCardLayoutProps } from "@/components/Cards/productCardTypes";
import { Card, CardBody, CardFooter } from "@/components/ui";

const ProductCardShowcase: FC<ProductCardLayoutProps> = (props) => {
  const { t } = useTranslation();
  const {
    product,
    productHref,
    pricing,
    detailTags,
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
      className="h-full w-full rounded-large bg-content2 p-2 text-start shadow-sm"
      data-card-style="showcase"
    >
      <CardBody className="grow-0 overflow-hidden p-0">
        <ProductCardMedia
          {...props}
          cardStyle="showcase"
          onProductClick={onProductClick}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
        />
      </CardBody>

      <CardFooter className="mt-2 grow flex-col items-stretch gap-2.5 rounded-medium bg-content1 px-3 pb-3 pt-3">
        <div className="flex items-center justify-between gap-2">
          {pricing.discountPercentage > 0 ? (
            <span className="rounded-medium bg-success px-2 py-1 text-xs font-bold text-success-foreground">
              {t("discount", { percent: pricing.discountPercentage })}
            </span>
          ) : (
            <span className="truncate text-xs font-semibold text-primary-700">
              {product.brand_name || product.category_name}
            </span>
          )}
          {hasRating ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
              <Icon icon="solar:star-bold" className="text-rating-star" />
              {rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <Link
          href={productHref}
          className="line-clamp-2 min-h-10 text-base font-extrabold leading-snug text-foreground"
          title={product.title}
          onClick={onProductClick}
        >
          {product.title}
        </Link>

        <span className="truncate text-xs text-default-500">
          {product.category_name || product.brand_name}
        </span>

        {detailTags.length ? (
          <div className="flex min-h-6 flex-wrap gap-1.5">
            {detailTags.map((tag) => (
              <span
                key={tag}
                className="max-w-full truncate rounded-medium border border-divider bg-content2 px-2 py-1 text-xxs text-default-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          <ProductCardPrice
            pricing={pricing}
            showDiscount={false}
            size="large"
          />
        </div>

        {showAddToCart ? (
          <ProductCardAction
            isLoading={isAddingToCart}
            isOutOfStock={isOutOfStock}
            onPress={onAddToCart}
          />
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default ProductCardShowcase;
