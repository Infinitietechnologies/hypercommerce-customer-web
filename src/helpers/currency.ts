// Market-aware currency formatting.
//
// The backend already FX-converts every amount to the active market's currency
// and returns the per-market number-format rules (symbol, separators, decimals,
// symbol position). This util applies those rules to a numeric amount so the UI
// formats prices consistently for the selected market instead of a static
// symbol + toFixed(2).

import type { MarketFormat } from "@/types/ApiResponse";
export type { MarketFormat };

const DEFAULT_FORMAT: Required<Omit<MarketFormat, "grouping_style">> = {
  symbol_position: "before",
  space_between_symbol: false,
  thousand_separator: ",",
  decimal_separator: ".",
  decimal_places: 2,
  negative_format: "-{n}",
};

/** Group the integer part with the given thousands separator (western style). */
const groupThousands = (intDigits: string, separator: string): string =>
  intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, separator || "");

/**
 * Format a numeric amount (already in the market currency) into a display
 * string using the market's number-format rules. Symbol is applied per
 * `symbol_position` / `space_between_symbol`. Negatives use `negative_format`.
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  symbol: string = "",
  format?: MarketFormat | null,
): string => {
  const f = { ...DEFAULT_FORMAT, ...(format || {}) };
  const num = Number(amount);
  const safe = Number.isFinite(num) ? num : 0;

  const negative = safe < 0;
  const abs = Math.abs(safe);

  const decimals =
    typeof f.decimal_places === "number" && f.decimal_places >= 0
      ? f.decimal_places
      : 2;

  const fixed = abs.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");

  const grouped = groupThousands(intPart, f.thousand_separator);
  let number =
    decimals > 0 && decPart !== undefined
      ? `${grouped}${f.decimal_separator}${decPart}`
      : grouped;

  const gap = f.space_between_symbol ? " " : "";
  let withSymbol = symbol
    ? f.symbol_position === "after"
      ? `${number}${gap}${symbol}`
      : `${symbol}${gap}${number}`
    : number;

  if (negative) {
    withSymbol = (f.negative_format || "-{n}").replace("{n}", withSymbol);
  }

  return withSymbol;
};
