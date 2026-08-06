import { geoDetectForCountry, switchMarket } from "@/routes/api";
import { setCookie } from "@/lib/cookies";
import { mutate } from "swr";

/**
 * Resolve the market a country belongs to and switch the storefront to it
 * (currency + catalogue follow). Shared by the header location selector and by
 * checkout, where the selected delivery address is authoritative for the
 * market. Returns the switched-to market code, or null if unchanged / failed.
 */
/**
 * SWR keys whose payload changes with the active market: settings, the whole
 * catalogue, the home layout and search. A market switch has to drop all of
 * them, not just `/settings`.
 */
const MARKET_SCOPED_KEY_PREFIXES = [
  "/settings",
  "/products",
  "/categories",
  "/brands",
  "/stores",
  "/home-layout",
  "/infinite-data",
  "search:",
  "seller-reviews",
];

export const isMarketScopedKey = (key: unknown): boolean => {
  const head = Array.isArray(key) ? key[0] : key;

  return (
    typeof head === "string" &&
    MARKET_SCOPED_KEY_PREFIXES.some((prefix) => head.startsWith(prefix))
  );
};

export const resolveMarketForCountry = async (
  countryCode?: string,
): Promise<string | null> => {
  if (!countryCode) return null;
  try {
    const res = await geoDetectForCountry(countryCode);
    const market = res?.data?.suggested_market;
    if (market?.code) {
      setCookie<string>("market", market.code);
      await switchMarket(market.code);
      await mutate(isMarketScopedKey);
      return market.code;
    }
  } catch (err) {
    console.error("[resolveMarketForCountry] failed:", err);
  }
  return null;
};
