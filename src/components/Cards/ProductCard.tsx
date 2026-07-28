import { FC, memo, useState } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Image,
  toast,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import { Product } from "@/types/ApiResponse";
import { toggleFavorite } from "@/routes/api";
import { useSettings } from "@/contexts/SettingsContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useScreenType } from "@/hooks/useScreenType";
import { useAdTracking } from "@/hooks/useAdTracking";

interface ProductCardProps {
  product: Product;
}

/**
 * Listing card — amber redesign (sandbox `ProductCard`, full variant):
 * square media, brand · rating row, two-line title, then price / mrp / off%.
 * No add-to-bag or quick-view (product opens on the PDP); rating hides when the
 * product has none. Wishlist toggle stays as the one on-card action.
 */
const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const { formatPrice } = useSettings();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { variants = [] } = product;
  const router = useRouter();
  const { t } = useTranslation();
  const screen = useScreenType();
  const { elementRef, handleAdClick } = useAdTracking(product);

  const defaultVariant = variants?.find((v) => v.is_default) || variants?.[0];

  const [isFavorited, setIsFavorited] = useState(
    Array.isArray(product.favorite) && product.favorite.length > 0,
  );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  if (!defaultVariant) return null;

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      document.getElementById("login-btn")?.click();
      toast({ title: t("please_login"), color: "warning" });
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const response = await toggleFavorite({
        product_id: product.id,
        product_variant_id: defaultVariant.id ?? null,
        store_id: defaultVariant.store_id,
      });

      if (response.success && response.data) {
        setIsFavorited(response.data.is_favorited);
      } else {
        toast({ title: response.message || t("something_went_wrong"), color: "danger" });
      }
    } catch {
      toast({ title: t("something_went_wrong"), color: "danger" });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const price = Number(defaultVariant?.price) || 0;
  const specialPrice = Number(defaultVariant?.special_price) || 0;
  const hasDiscount = specialPrice > 0 && specialPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - specialPrice) / price) * 100)
    : 0;

  const rating = Number(product.ratings) || 0;
  const hasRating = (product.rating_count ?? 0) > 0 && rating > 0;

  return (
    <Card
      key={product.id}
      ref={elementRef}
      as="div"
      className="w-full h-full border border-divider hover:border-primary hover:shadow-md transition-all duration-200 overflow-hidden text-left"
      disableRipple
      isPressable={screen !== "mobile"}
      shadow="none"
      onPress={() => {
        handleAdClick();
        router.push(`/products/${product.slug}`);
      }}
    >
      <CardBody className="p-0 overflow-hidden">
        <div className="relative aspect-square w-full bg-gradient-to-br from-content2 to-background overflow-hidden">
          {product.main_image ? (
            <Link
              href={`/products/${product.slug}`}
              onClick={(e) => {
                e.stopPropagation();
                handleAdClick();
              }}
              title={product.title}
              className="absolute inset-0 block"
            >
              <Image
                alt={product.title ?? t("product_image_alt")}
                className={`absolute inset-0 h-full w-full ${
                  product.image_fit === "cover" ? "object-cover object-top" : "object-contain"
                }`}
                src={product.main_image}
                loading="eager"
                removeWrapper
                radius="none"
              />
            </Link>
          ) : (
            <div className="absolute inset-0 bg-content2" />
          )}

          <div className="absolute top-2.5 right-2.5 z-20">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              radius="full"
              isLoading={isTogglingFavorite}
              onPress={handleToggleFavorite}
              className="bg-content1 shadow-sm min-w-0 w-8 h-8 hover:text-danger transition-colors"
              title={t("pageTitle.wishlists")}
            >
              <Icon
                icon={isFavorited ? "solar:heart-bold" : "solar:heart-linear"}
                className={isFavorited ? "text-lg text-danger" : "text-lg text-default-500"}
              />
            </Button>
          </div>

          {product.is_sponsored && (
            <div className="absolute bottom-2 left-2 z-20">
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                <span className="text-[9px] font-bold text-white tracking-wider leading-none">Ad</span>
              </div>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter className="flex-col items-stretch gap-0.5 px-2 py-2 sm:gap-1 sm:px-4 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 min-h-4">
          {product.brand_name ? (
            <span className="truncate text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-default-500">
              {product.brand_name}
            </span>
          ) : (
            <span />
          )}

          {hasRating && (
            <span className="flex items-center gap-0.5 text-[11px] sm:text-xs font-bold shrink-0">
              <Icon icon="solar:star-bold" className="text-xs sm:text-sm text-rating-star" />
              {rating.toFixed(1)}
              <span className="text-default-400 font-medium">({product.rating_count})</span>
            </span>
          )}
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] sm:text-sm font-medium leading-snug line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem]"
          title={product.title}
          onClick={handleAdClick}
        >
          {product.title ?? t("untitled_product")}
        </Link>

        <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
          <span className="text-[15px] sm:text-lg font-extrabold leading-none">
            {formatPrice(hasDiscount ? specialPrice : price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] sm:text-[13px] text-default-400 line-through">
              {formatPrice(price)}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="text-[11px] sm:text-xs font-semibold text-primary-600">
              {t("discount", { percent: discountPercentage })}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default memo(ProductCard);
