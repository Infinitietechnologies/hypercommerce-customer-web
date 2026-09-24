export type StockValue = number | null | undefined;

type StockAvailability = {
  availability?: boolean | null;
  is_in_stock?: boolean | null;
  stock?: StockValue;
};

export const hasFiniteStock = (stock: StockValue): stock is number =>
  stock !== null && stock !== undefined && Number.isFinite(Number(stock));

export const isVariantInStock = (variant: StockAvailability): boolean => {
  if (variant.availability === false) return false;
  if (typeof variant.is_in_stock === "boolean") return variant.is_in_stock;

  return !hasFiniteStock(variant.stock) || Number(variant.stock) > 0;
};

export const stockLimit = (stock: StockValue, fallback: number): number =>
  hasFiniteStock(stock)
    ? Math.min(Math.max(0, Number(stock)), fallback)
    : fallback;
