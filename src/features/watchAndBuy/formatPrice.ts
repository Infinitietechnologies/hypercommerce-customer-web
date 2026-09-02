import type { WatchBuyProduct } from "@/types/watchBuy";

export const formatWatchBuyPrice = (
  product: WatchBuyProduct,
  value: number,
) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: product.currency_code,
    }).format(value);
  } catch {
    return `${product.currency_symbol}${value.toFixed(2)}`;
  }
};
