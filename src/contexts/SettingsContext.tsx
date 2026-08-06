// src/contexts/SettingsContext.tsx
import React, { createContext, useContext, useMemo } from "react";
import {
  AppSettings,
  AuthenticationSettings,
  HomeGeneralSettings,
  PaymentSettings,
  Settings,
  SystemSettings,
  AdvertisementSettings,
  MarketInfo,
  MarketsSetting,
  MarketFormat,
} from "@/types/ApiResponse";
import { getSpecificSettings, getWebSettings } from "@/helpers/getters";
import { formatCurrency } from "@/helpers/currency";
import { staticLat, staticLng } from "@/config/constants";

type LatLng = {
  lat: number;
  lng: number;
};

type SettingsContextType = {
  settings: Settings | null;
  webSettings: ReturnType<typeof getWebSettings> | null;
  paymentSettings: PaymentSettings | null;
  authSettings: AuthenticationSettings | null;
  homeGeneralSettings: HomeGeneralSettings | null;
  systemSettings: SystemSettings | null;
  appSettings: AppSettings | null;
  advertisementSettings: AdvertisementSettings | null;

  systemVendorType: "single" | "multiple";
  isSingleVendor: boolean;
  currencySymbol: string;
  currency: string;
  // Active market (from settings.markets.current) + its number-format rules.
  market: MarketInfo | null;
  currencyFormat: MarketFormat | null;
  // Format any amount (already in market currency) for the active market.
  formatPrice: (amount: number | string | null | undefined) => string;
  defaultLocation: LatLng | null;
  demoMode: boolean;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  webSettings: null,
  paymentSettings: null,
  authSettings: null,
  homeGeneralSettings: null,
  systemSettings: null,
  appSettings: null,
  advertisementSettings: null,
  systemVendorType: "multiple",
  isSingleVendor: false,
  currencySymbol: "",
  currency: "",
  market: null,
  currencyFormat: null,
  formatPrice: (amount) => String(amount ?? ""),
  defaultLocation: null,
  demoMode: false,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({
  settings,
  children,
}: {
  settings: Settings | null;
  children: React.ReactNode;
}) => {
  // One memo for the whole value: every field below derives from `settings`
  // alone, and the provider wraps the app — an unstable value re-renders every
  // consumer on every render.
  const value = useMemo(() => {
    const webSettings = settings ? getWebSettings(settings) : null;
    const systemSettings = settings
      ? (getSpecificSettings(settings, "system") as SystemSettings)
      : null;

    const paymentSettings = settings
      ? (getSpecificSettings(settings, "payment") as PaymentSettings)
      : null;

    const authSettings = settings
      ? (getSpecificSettings(
          settings,
          "authentication",
        ) as AuthenticationSettings)
      : null;

    const homeGeneralSettings = settings
      ? (getSpecificSettings(
          settings,
          "home_general_settings",
        ) as HomeGeneralSettings)
      : null;

    const appSettings = settings
      ? (getSpecificSettings(settings, "app") as AppSettings)
      : null;

    const advertisementSettings = settings
      ? (getSpecificSettings(
          settings,
          "advertisement",
        ) as AdvertisementSettings)
      : null;

    const systemVendorType = systemSettings?.systemVendorType || "multiple";
    const isSingleVendor = systemVendorType === "single";

    // Active market currency (from settings.markets.current). settings re-fetches
    // per market (X-Market), so this reflects the selected market. Falls back to
    // the static base-currency symbol when no market block is present.
    const marketsSetting = Array.isArray(settings)
      ? ((settings as { variable: string; value: unknown }[]).find(
          (s) => s?.variable === "markets",
        )?.value as MarketsSetting | undefined)
      : undefined;
    const market = marketsSetting?.current ?? null;
    const currencyFormat = market?.format ?? null;

    const currencySymbol =
      market?.currency?.symbol || systemSettings?.currencySymbol || "";
    const currency = market?.currency_code || systemSettings?.currency || "";
    const demoMode = systemSettings?.demoMode || false;

    const formatPrice = (amount: number | string | null | undefined) =>
      formatCurrency(amount, currencySymbol, currencyFormat);

    const defaultLocation =
      webSettings?.defaultLatitude && webSettings?.defaultLongitude
        ? {
            lat: parseFloat(webSettings.defaultLatitude),
            lng: parseFloat(webSettings.defaultLongitude),
          }
        : {
            lat: staticLat,
            lng: staticLng,
          };

    return {
      settings,
      webSettings,
      defaultLocation,
      currencySymbol,
      currency,
      market,
      currencyFormat,
      formatPrice,
      paymentSettings,
      authSettings,
      homeGeneralSettings,
      systemSettings,
      appSettings,
      advertisementSettings,
      systemVendorType,
      isSingleVendor,
      demoMode,
    };
  }, [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
