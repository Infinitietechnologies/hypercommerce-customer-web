import { FC } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, MarketFormat } from "@/helpers/currency";

/**
 * useCurrency — market-aware currency helpers.
 *
 * `symbol` / `format` default to the active market (settings.markets.current);
 * `formatPrice(amount)` formats a number already in the market currency.
 * The backend does the FX conversion, so pass the converted amount directly.
 */
export const useCurrency = () => {
  const { currencySymbol, currencyFormat, formatPrice } = useSettings();
  return {
    symbol: currencySymbol,
    format: currencyFormat,
    /** Format an amount for the active market. */
    formatPrice,
    /** Format with explicit overrides (e.g. a variant's own symbol/format). */
    formatWith: (
      amount: number | string | null | undefined,
      symbol?: string,
      format?: MarketFormat | null,
    ) => formatCurrency(amount, symbol ?? currencySymbol, format ?? currencyFormat),
  };
};

interface PriceProps {
  /** Amount already in the market currency (backend-converted). */
  value: number | string | null | undefined;
  /** Optional per-response overrides (e.g. variant.currency_symbol / variant.format). */
  symbol?: string;
  format?: MarketFormat | null;
  /** If the backend already gave a ready `formatted` string, render it as-is. */
  formatted?: string | null;
  className?: string;
}

/**
 * <Price> — the reusable price renderer. Use anywhere a money value is shown so
 * the active market's currency symbol + number format are applied consistently.
 *
 *   <Price value={variant.price} />
 *   <Price value={item.price} symbol={variant.currency_symbol} format={variant.format} />
 *   <Price formatted={variant.formatted} />   // trust backend's formatted string
 */
const Price: FC<PriceProps> = ({ value, symbol, format, formatted, className }) => {
  const { formatWith } = useCurrency();
  const text = formatted ?? formatWith(value, symbol, format);
  return <span className={className}>{text}</span>;
};

export default Price;
