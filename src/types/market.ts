// ---- Market currency / formatting (hypercommerce) ----
export interface MarketFormat {
  symbol_position?: "before" | "after" | string;
  space_between_symbol?: boolean;
  thousand_separator?: string;
  decimal_separator?: string;
  grouping_style?: string;
  decimal_places?: number;
  negative_format?: string;
}

export interface MarketCurrency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_base: boolean;
}

export interface MarketInfo {
  id: number;
  code: string;
  name: string;
  currency_code: string;
  default_language?: string;
  is_default: boolean;
  priority?: number;
  status?: string;
  countries?: { id: number; iso2: string; name: string }[];
  currency?: MarketCurrency;
  format?: MarketFormat;
}

export interface GeoDetectData {
  suggested_market?: MarketInfo | null;
  country?: string | null;
}

export interface MarketSwitchData {
  market?: MarketInfo | null;
}

export interface MarketsSetting {
  current: MarketInfo | null;
  default: MarketInfo | null;
  available: MarketInfo[];
}
