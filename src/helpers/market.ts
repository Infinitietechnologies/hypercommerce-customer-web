import { geoDetectForCountry, switchMarket } from "@/routes/api";
import { setCookie } from "@/lib/cookies";
import { mutate } from "swr";

/**
 * Resolve the market a country belongs to and switch the storefront to it
 * (currency + catalogue follow). Shared by the header location selector and by
 * checkout, where the selected delivery address is authoritative for the
 * market. Returns the switched-to market code, or null if unchanged / failed.
 */
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
      await mutate("/settings");
      return market.code;
    }
  } catch (err) {
    console.error("[resolveMarketForCountry] failed:", err);
  }
  return null;
};
