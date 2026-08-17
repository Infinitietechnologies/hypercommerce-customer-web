import { Icon } from "@iconify/react";
import clsx from "clsx";
import Link from "next/link";
import { CSSProperties, FC, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import type { ProductCardStyle } from "@/config/productCard";
import { Button, Image, Tooltip } from "@/components/ui";
import type { Product } from "@/types/catalog";

interface ProductCardMediaProps {
  product: Product;
  productHref: string;
  images: string[];
  cardStyle: ProductCardStyle;
  isFavorited: boolean;
  isWishlistMode: boolean;
  isFavoriteLoading: boolean;
  onProductClick: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}

const ProductCardMedia: FC<ProductCardMediaProps> = ({
  product,
  productHref,
  images,
  cardStyle,
  isFavorited,
  isWishlistMode,
  isFavoriteLoading,
  onProductClick,
  onToggleFavorite,
  onShare,
}) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const hasCarousel = images.length > 1;
  const showShare = cardStyle === "standard" || cardStyle === "showcase";
  const badge = product.badge;

  const badgeStyle: CSSProperties | undefined = badge
    ? {
        ...(badge.bg_color ? { backgroundColor: badge.bg_color } : {}),
        ...(badge.text_color ? { color: badge.text_color } : {}),
        ...(badge.border_color ? { borderColor: badge.border_color } : {}),
      }
    : undefined;

  const imageClass = clsx(
    "absolute inset-0 h-full w-full",
    cardStyle !== "standard" && product.image_fit === "cover"
      ? "object-cover object-top"
      : "object-contain",
    cardStyle === "standard" && "p-3",
    cardStyle === "compact" && "p-2",
    cardStyle === "showcase" && "p-3",
  );

  const renderSlide = (src: string, eager: boolean) => (
    <Link
      href={productHref}
      className="absolute inset-0 block"
      title={product.title}
      onClick={onProductClick}
    >
      <Image
        removeWrapper
        alt={product.title ?? t("product_image_alt")}
        className={imageClass}
        loading={eager ? "eager" : undefined}
        radius="none"
        src={src}
      />
    </Link>
  );

  return (
    <div
      className={clsx(
        "relative aspect-square w-full overflow-hidden bg-content2",
        (cardStyle === "compact" || cardStyle === "showcase") &&
          "rounded-medium",
      )}
    >
      {images.length === 0 ? (
        <div className="absolute inset-0 bg-content2" />
      ) : hasCarousel ? (
        <Swiper
          className="h-full w-full"
          slidesPerView={1}
          spaceBetween={0}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {images.map((src, index) => (
            <SwiperSlide key={src} className="h-full">
              <div className="relative h-full w-full">
                {renderSlide(src, index === 0)}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        renderSlide(images[0], true)
      )}

      {badge?.label ? (
        <span
          className="absolute start-2.5 top-2.5 z-20 inline-flex items-center rounded-medium border border-transparent bg-success px-2 py-1 text-xxs font-semibold leading-none text-success-foreground shadow-sm"
          style={badgeStyle}
        >
          {badge.label}
        </span>
      ) : null}

      <div className="absolute end-2.5 top-2.5 z-20 flex flex-col gap-2">
        <Tooltip
          content={isWishlistMode ? t("delete") : t("a11y.add_to_wishlist")}
        >
          <Button
            isIconOnly
            aria-label={
              isWishlistMode ? t("delete") : t("a11y.add_to_wishlist")
            }
            className="h-8 w-8 min-w-8 bg-content1 text-default-600 shadow-sm"
            isLoading={isFavoriteLoading}
            radius="full"
            size="sm"
            variant="light"
            onPress={onToggleFavorite}
          >
            <Icon
              className={clsx(
                "text-lg",
                isWishlistMode || isFavorited
                  ? "text-danger"
                  : "text-default-600",
              )}
              icon={
                isWishlistMode || isFavorited
                  ? "solar:heart-bold"
                  : "solar:heart-linear"
              }
            />
          </Button>
        </Tooltip>

        {showShare ? (
          <Tooltip content={t("a11y.share_product")}>
            <Button
              isIconOnly
              aria-label={t("a11y.share_product")}
              className="h-8 w-8 min-w-8 bg-content1 text-default-600 shadow-sm"
              radius="full"
              size="sm"
              variant="light"
              onPress={onShare}
            >
              <Icon icon="solar:share-linear" className="text-lg" />
            </Button>
          </Tooltip>
        ) : null}
      </div>

      {hasCarousel ? (
        <div className="absolute inset-x-0 bottom-2.5 z-20 flex items-center justify-center gap-1.5">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={`${t("product_image_alt")} ${index + 1}`}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-200",
                index === activeIndex
                  ? "w-4 bg-foreground/80"
                  : "w-1.5 bg-foreground/25",
              )}
              onClick={() => swiperRef.current?.slideTo(index)}
            />
          ))}
        </div>
      ) : null}

      {product.is_sponsored ? (
        <span className="absolute bottom-2 start-2 z-20 rounded-medium bg-foreground/70 px-2 py-1 text-xxs font-semibold text-background backdrop-blur-sm">
          {t("sponsored")}
        </span>
      ) : null}
    </div>
  );
};

export default ProductCardMedia;
