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

      <CardFooter className="mt-2 grow flex-col items-stretch gap-2 rounded-medium bg-content1 px-3 pb-3 pt-3">
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
          <span
            className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${isOutOfStock ? "text-danger" : "text-success"}`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? "bg-danger" : "bg-success"}`}
            />
            {isOutOfStock ? t("out_of_stock") : t("in_stock")}
          </span>
        </div>

        <Link
          href={productHref}
          className="line-clamp-2 text-base font-extrabold leading-snug text-foreground"
          title={product.title}
          onClick={onProductClick}
        >
          {product.title}
        </Link>

        <div className="flex min-w-0 items-center gap-1.5 text-xs text-default-500">
          {product.brand_name ? (
            <span className="truncate font-semibold text-default-600">
              {product.brand_name}
            </span>
          ) : null}
          {product.brand_name && product.category_name ? (
            <span aria-hidden="true" className="shrink-0 text-default-300">
              •
            </span>
          ) : null}
          {product.category_name ? (
            <span className="truncate">{product.category_name}</span>
          ) : null}
        </div>

        {shortDescription ? (
          <p className="line-clamp-2 min-h-10 text-xs leading-relaxed text-default-500">
            {shortDescription}
          </p>
        ) : null}

        {detailTags.length ? (
          <div className="flex min-h-6 flex-wrap gap-1.5 overflow-hidden">
            {detailTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="max-w-full truncate rounded-medium border border-divider bg-content2 px-2 py-1 text-xxs text-default-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex min-h-5 items-center gap-1 text-xs text-default-500">
          <Icon
            icon="solar:star-bold"
            className={hasRating ? "text-rating-star" : "text-default-300"}
          />
          <strong className="font-semibold text-foreground">
            {hasRating ? rating.toFixed(1) : "0.0"}
          </strong>
          <span>
            ({product.rating_count ?? 0} {t("reviews")})
          </span>
        </div>

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
