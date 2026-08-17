import { Icon } from "@iconify/react";
import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import ProductCardAction from "@/components/Cards/ProductCardAction";
import ProductCardMedia from "@/components/Cards/ProductCardMedia";
import ProductCardPrice from "@/components/Cards/ProductCardPrice";
import type { ProductCardLayoutProps } from "@/components/Cards/productCardTypes";
import { Card, CardBody, CardFooter } from "@/components/ui";

const ProductCardStandard: FC<ProductCardLayoutProps> = (props) => {
  const { t } = useTranslation();
  const {
    product,
    productHref,
    pricing,
    shortDescription,
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
      className="h-full w-full overflow-hidden rounded-large text-start shadow-sm"
      data-card-style="standard"
    >
      <CardBody className="grow-0 overflow-hidden p-0">
        <ProductCardMedia
          {...props}
          cardStyle="standard"
          onProductClick={onProductClick}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
        />
      </CardBody>

      <CardFooter className="grow flex-col items-stretch gap-2.5 px-3 pb-3 pt-3">
        <span className="truncate text-xxs font-semibold uppercase tracking-wide text-default-500">
          {product.brand_name || product.category_name}
        </span>

        <Link
          href={productHref}
          className="line-clamp-2 text-sm font-bold leading-snug text-foreground"
          title={product.title}
          onClick={onProductClick}
        >
          {product.title}
        </Link>

        {shortDescription ? (
          <p className="hidden line-clamp-2 text-xs leading-relaxed text-default-500 sm:block">
            {shortDescription}
          </p>
        ) : null}

        {detailTags.length ? (
          <div className="hidden min-h-6 flex-wrap gap-1.5 sm:flex">
            {detailTags.map((tag) => (
              <span
                key={tag}
                className="max-w-full truncate rounded-medium bg-content2 px-2 py-1 text-xxs text-default-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:items-end sm:justify-between">
          <ProductCardPrice pricing={pricing} />
          {showAddToCart ? (
            <ProductCardAction
              appearance="compact"
              isLoading={isAddingToCart}
              isOutOfStock={isOutOfStock}
              onPress={onAddToCart}
            />
          ) : null}
        </div>

        <div className="flex min-h-5 items-center justify-between gap-2 border-t border-divider pt-2 text-xs">
          {hasRating ? (
            <span className="flex items-center gap-1 text-default-500">
              <Icon icon="solar:star-bold" className="text-rating-star" />
              <strong className="font-semibold text-foreground">
                {rating.toFixed(1)}
              </strong>
              {product.rating_count > 0 ? (
                <span>({product.rating_count})</span>
              ) : null}
            </span>
          ) : (
            <span />
          )}
          <span className={isOutOfStock ? "text-danger" : "text-success"}>
            {isOutOfStock ? t("out_of_stock") : t("in_stock")}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCardStandard;
