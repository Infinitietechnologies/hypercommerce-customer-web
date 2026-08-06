import { FC, memo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Image,
  toast,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Product } from "@/types/ApiResponse";
import { toggleFavorite, addToCart } from "@/routes/api";
import { updateCartData } from "@/helpers/updators";
import { handleOfflineAddToCart } from "@/helpers/functionalHelpers";
import { useSettings } from "@/contexts/SettingsContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAdTracking } from "@/hooks/useAdTracking";

interface ProductCardProps {
  product: Product;
  /** Renders the "Add to Cart" button in the footer. Defaults to on; pass false to hide it. */
  showAddToCart?: boolean;
  /**
   * When provided, the heart becomes a "remove from wishlist" action that calls
   * this instead of the internal favorite toggle (the caller owns the API call
   * and list sync). `isWishlistRemoving` drives its loading state.
   */
  onWishlistRemove?: () => void;
  isWishlistRemoving?: boolean;
}

/**
 * Listing card — new storefront design:
 * inset media well with a swipeable image carousel (main + additional images)
 * and dot indicators, a server-driven badge (`product.badge`) top-left, and a
 * stacked wishlist + share action rail top-right. Below the media: a category
 * chip and a rating pill on one row, a two-line title, then price / mrp / off%.
 * Product opens on the PDP; rating hides when the product has none.
 *
 * The wishlist reuses this same card via `showAddToCart` + `onWishlistRemove`.
 */
const ProductCard: FC<ProductCardProps> = ({
  product,
  showAddToCart = true,
  onWishlistRemove,
  isWishlistRemoving = false,
}) => {
  const { formatPrice } = useSettings();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { variants = [] } = product;
  const { t } = useTranslation();
  const { elementRef, handleAdClick } = useAdTracking(product);

  const defaultVariant = variants?.find((v) => v.is_default) || variants?.[0];

  const [isFavorited, setIsFavorited] = useState(
    Array.isArray(product.favorite) && product.favorite.length > 0,
  );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const isWishlistMode = typeof onWishlistRemove === "function";

  if (!defaultVariant) return null;

  const productHref = `/products/${product.slug}`;

  // Unique, non-empty image list: main first, then additional.
  const images = Array.from(
    new Set([product.main_image, ...(product.additional_images ?? [])].filter(Boolean)),
  );
  const hasCarousel = images.length > 1;

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

  const handleAddToCart = async () => {
    if (!defaultVariant.id) return;

    // Guests add to the local (offline) cart — same behaviour as the PDP — so
    // they are not forced to log in just to build a cart.
    if (!isLoggedIn) {
      handleOfflineAddToCart({
        product,
        variant: defaultVariant,
        quantity: product.minimum_order_quantity || 1,
        renderToast: true,
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      const response = await addToCart({
        product_variant_id: defaultVariant.id,
        store_id: defaultVariant.store_id,
        quantity: 1,
      });

      if (response.success) {
        toast({
          title: t("cart_updated_title"),
          description: t("cart_updated_description"),
          color: "success",
        });
        await updateCartData(true, true, 0, true, false);
      } else {
        toast({ title: response.message || t("something_went_wrong"), color: "danger" });
      }
    } catch {
      toast({ title: t("something_went_wrong"), color: "danger" });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${productHref}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title ?? "", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast({ title: t("link_copied", { defaultValue: "Link copied" }), color: "success" });
      }
    } catch {
      // User dismissed the share sheet, or share/clipboard unavailable — no-op.
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

  const badge = product.badge;

  const imageClass = `absolute inset-0 h-full w-full ${
    product.image_fit === "cover" ? "object-cover object-top" : "object-contain"
  }`;

  const renderSlide = (src: string, eager: boolean) => (
    <Link
      href={productHref}
      onClick={handleAdClick}
      title={product.title}
      className="absolute inset-0 block"
    >
      <Image
        alt={product.title ?? t("product_image_alt")}
        className={imageClass}
        src={src}
        // NB: don't pass loading="lazy" here. HeroUI's <Image> preloads through a
        // detached `new Image()` and forwards this attribute to it; a detached
        // lazy image never loads, so `data-loaded` never flips and the img is
        // stuck at the base `opacity-0`. Eager for the first slide, normal load
        // (attribute omitted) for the rest — every slide still loads.
        loading={eager ? "eager" : undefined}
        removeWrapper
        radius="none"
      />
    </Link>
  );

  return (
    <Card
      key={product.id}
      ref={elementRef}
      as="div"
      className="w-full h-full border border-divider bg-content1 rounded-large hover:shadow-md hover:border-default-300 transition-all duration-200 overflow-hidden text-left"
      shadow="none"
    >
      {/* grow-0: HeroUI CardBody is `flex-1 flex-auto` and would grow to fill a
          grid-stretched card, opening a gap under the image (above the brand)
          on shorter cards. Pin it to the media height so every card aligns. */}
      <CardBody className="grow-0 p-0 overflow-hidden">
        <div className="relative aspect-square w-full bg-primary-50 overflow-hidden">
          {images.length === 0 ? (
            <div className="absolute inset-0 bg-primary-50" />
          ) : hasCarousel ? (
            <Swiper
              slidesPerView={1}
              spaceBetween={0}
              className="h-full w-full"
              onSwiper={(s) => {
                swiperRef.current = s;
              }}
              onSlideChange={(s) => setActiveIndex(s.activeIndex)}
            >
              {images.map((src, i) => (
                <SwiperSlide key={src} className="h-full">
                  <div className="relative h-full w-full">{renderSlide(src, i === 0)}</div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            renderSlide(images[0], true)
          )}

          {badge?.label && (
            <div className="absolute top-2.5 left-2.5 z-20">
              <span
                style={{
                  backgroundColor: badge.bg_color || "#16a34a",
                  color: badge.text_color || "#ffffff",
                  borderColor: badge.border_color || "transparent",
                }}
                className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm"
              >
                {badge.label}
              </span>
            </div>
          )}

          <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-2">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              radius="full"
              isLoading={isWishlistMode ? isWishlistRemoving : isTogglingFavorite}
              onPress={isWishlistMode ? onWishlistRemove : handleToggleFavorite}
              className="bg-content1 shadow-sm min-w-0 w-8 h-8 hover:text-danger transition-colors"
              title={isWishlistMode ? t("delete") : t("pageTitle.wishlists")}
            >
              <Icon
                icon={isWishlistMode || isFavorited ? "solar:heart-bold" : "solar:heart-linear"}
                className={
                  isWishlistMode || isFavorited
                    ? "text-lg text-danger"
                    : "text-lg text-default-500"
                }
              />
            </Button>

            <Button
              isIconOnly
              variant="light"
              size="sm"
              radius="full"
              onPress={handleShare}
              className="bg-content1 shadow-sm min-w-0 w-8 h-8 hover:text-primary transition-colors"
              title={t("share", { defaultValue: "Share" })}
            >
              <Icon icon="solar:share-linear" className="text-lg text-default-500" />
            </Button>
          </div>

          {hasCarousel && (
            <div className="absolute bottom-2.5 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`${t("product_image_alt")} ${i + 1}`}
                  onClick={() => swiperRef.current?.slideTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === activeIndex ? "w-4 bg-foreground/80" : "w-1.5 bg-foreground/25"
                  }`}
                />
              ))}
            </div>
          )}

          {product.is_sponsored && (
            <div className="absolute bottom-2 left-2 z-20">
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                <span className="text-[9px] font-bold text-white tracking-wider leading-none">Ad</span>
              </div>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter className="grow flex-col items-stretch gap-2 px-2.5 pb-3 pt-3 sm:px-3 sm:pb-3.5">
        <div className="flex items-center justify-between gap-2 min-h-6">
          {product.brand_name ? (
            <span className="truncate rounded-md bg-blue-50 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-blue-600">
              {product.brand_name}
            </span>
          ) : (
            <span />
          )}

          {hasRating && (
            <span className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] sm:text-xs font-bold text-foreground shrink-0">
              <Icon icon="solar:star-bold" className="text-xs sm:text-sm text-rating-star" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <Link
          href={productHref}
          className="truncate text-[13px] sm:text-sm font-semibold leading-snug"
          title={product.title}
          onClick={handleAdClick}
        >
          {product.title ?? t("untitled_product")}
        </Link>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[15px] sm:text-lg font-bold leading-none">
            {hasDiscount
              ? (defaultVariant.formatted_special_price ?? formatPrice(specialPrice))
              : (defaultVariant.formatted ?? formatPrice(price))}
          </span>
          {hasDiscount && (
            <span className="text-[11px] sm:text-[13px] text-default-400 line-through">
              {defaultVariant.formatted ?? formatPrice(price)}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="text-[11px] sm:text-[13px] font-semibold text-success">
              {t("discount", { percent: discountPercentage })}
            </span>
          )}
        </div>

        {showAddToCart && (
          <Button
            color="primary"
            radius="lg"
            className="mt-auto w-full font-medium"
            isLoading={isAddingToCart}
            onPress={handleAddToCart}
            startContent={isAddingToCart ? undefined : <Icon icon="mdi:plus" className="text-lg" />}
          >
            {t("add_to_cart", { defaultValue: "Add To Cart" })}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default memo(ProductCard);
