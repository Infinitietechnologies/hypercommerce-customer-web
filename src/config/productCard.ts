export const PRODUCT_CARD_STYLES = [
  "standard",
  "compact",
  "minimal",
  "showcase",
] as const;

export type ProductCardStyle = (typeof PRODUCT_CARD_STYLES)[number];

export const DEFAULT_PRODUCT_CARD_STYLE: ProductCardStyle = "standard";

export const PRODUCT_CARD_GRID_CLASSES: Record<ProductCardStyle, string> = {
  standard: "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  compact:
    "grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]",
  minimal: "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
  showcase:
    "grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]",
};

export const isProductCardStyle = (value: unknown): value is ProductCardStyle =>
  typeof value === "string" &&
  PRODUCT_CARD_STYLES.includes(value as ProductCardStyle);

export const resolveProductCardStyle = (
  value?: string | null,
): ProductCardStyle =>
  isProductCardStyle(value) ? value : DEFAULT_PRODUCT_CARD_STYLE;
