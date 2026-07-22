import { api } from "./client";
import {
  ApiResponse,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
} from "@/config/constants";

// Debug/testing helper: ask the backend which market a given country maps to.
// The backend's geo-detect resolves a market from the country header
// (X-Country-Code), so we can preview the market for a picked location.
export const geoDetectForCountry = async (
  countryCode?: string,
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get("/geo-detect", {
      headers: countryCode ? { "X-Country-Code": countryCode } : undefined,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Switch the active market. Backend sets a `market` cookie (1yr) and, when
// authenticated, updates the user_market pivot. Body: { code }.

// Switch the active market. Backend sets a `market` cookie (1yr) and, when
// authenticated, updates the user_market pivot. Body: { code }.
export const switchMarket = async (
  code: string,
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post("/markets/switch", { code });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};
