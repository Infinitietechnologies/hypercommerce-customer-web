import type { SwiperOptions } from "swiper/types";

export const PRODUCT_CARD_STYLES = [
  "standard",
  "compact",
  "minimal",
  "showcase",
] as const;

export type ProductCardStyle = (typeof PRODUCT_CARD_STYLES)[number];

export const DEFAULT_PRODUCT_CARD_STYLE: ProductCardStyle = "minimal";

export const PRODUCT_CARD_GRID_CLASSES: Record<ProductCardStyle, string> = {
  standard:
    "grid-cols-1 xs:grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  compact:
    "grid-cols-1 xs:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]",
  minimal:
    "grid-cols-1 xs:grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
  showcase:
    "grid-cols-1 xs:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]",
};

export const PRODUCT_CARD_SLIDER_OPTIONS = {
  standard: {
    slidesPerView: 1,
    spaceBetween: 10,
    breakpoints: {
      375: { slidesPerView: 2, spaceBetween: 10 },
      640: { slidesPerView: 2.5, spaceBetween: 14 },
      1024: { slidesPerView: 3.3, spaceBetween: 16 },
      1280: { slidesPerView: 4.1, spaceBetween: 16 },
    },
  },
  compact: {
    slidesPerView: 1,
    spaceBetween: 10,
    breakpoints: {
      375: { slidesPerView: 2, spaceBetween: 10 },
      640: { slidesPerView: 2.4, spaceBetween: 14 },
      1024: { slidesPerView: 3.2, spaceBetween: 16 },
      1280: { slidesPerView: 4, spaceBetween: 16 },
    },
  },
  minimal: {
    slidesPerView: 1,
    spaceBetween: 10,
    breakpoints: {
      375: { slidesPerView: 2.3, spaceBetween: 10 },
      640: { slidesPerView: 3.3, spaceBetween: 14 },
      1024: { slidesPerView: 4, spaceBetween: 16 },
      1280: { slidesPerView: 4.8, spaceBetween: 16 },
    },
  },
  showcase: {
    slidesPerView: 1,
    spaceBetween: 10,
    breakpoints: {
      375: { slidesPerView: 2, spaceBetween: 10 },
      640: { slidesPerView: 2.1, spaceBetween: 14 },
      1024: { slidesPerView: 2.8, spaceBetween: 16 },
      1280: { slidesPerView: 3.4, spaceBetween: 16 },
    },
  },
} satisfies Record<
  ProductCardStyle,
  Pick<SwiperOptions, "slidesPerView" | "spaceBetween" | "breakpoints">
>;

export const isProductCardStyle = (value: unknown): value is ProductCardStyle =>
  typeof value === "string" &&
  PRODUCT_CARD_STYLES.includes(value as ProductCardStyle);

export const resolveProductCardStyle = (
  value?: string | null,
): ProductCardStyle =>
  isProductCardStyle(value) ? value : DEFAULT_PRODUCT_CARD_STYLE;
