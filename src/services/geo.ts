import { api } from "./client";
import { ApiResponse } from "@/types/ApiResponse";
import { GeoCountry, GeoCity, PincodeResolution } from "@/types/geo";
import { fallbackApiRes } from "@/config/constants";

// The /geo/* endpoints wrap their payload under a `data` object with a
// per-endpoint key: countries → `items`, resolve-pincode → `matches`, etc.
// Rather than hard-code each key, we locate the payload array by shape.

const firstArray = (data: unknown): unknown[] | null => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v)) return v;
    }
  }
  return null;
};

// List endpoints (countries, cities) → the wrapped array, or [].
const unwrapList = <T>(data: unknown): T[] => (firstArray(data) as T[]) ?? [];

// Single-object endpoint (resolve-pincode) → one resolution. The response is
// either the resolution itself or a wrapper array of them (grouped by state);
// we must NOT mistake the resolution's own `cities` array for the wrapper.
const unwrapObject = <T>(data: unknown): T | null => {
  if (data == null || typeof data !== "object") return null;
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  const obj = data as Record<string, unknown>;
  if ("country_iso2" in obj || "state_name" in obj || "cities" in obj) {
    return obj as T;
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) return (v[0] as T) ?? null;
  }
  return null;
};

// Countries the storefront can deliver to, each tagged with how it is searched
// (`type`: "city" | "zipcode"). Drives the address form's field layout.
export const getGeoCountries = async (): Promise<
  ApiResponse<GeoCountry[]>
> => {
  try {
    const response = await api.get("/geo/countries");
    return {
      ...response.data,
      data: unwrapList<GeoCountry>(response.data?.data),
    };
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// City lookup for "city"-type countries. Returns matching cities with their
// state + country so the form can auto-select them.
export const searchGeoCities = async (
  country: string,
  search: string,
): Promise<ApiResponse<GeoCity[]>> => {
  try {
    const response = await api.get("/geo/cities", {
      params: { iso2: country, search },
    });
    return {
      ...response.data,
      data: unwrapList<GeoCity>(response.data?.data),
    };
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Pincode lookup for "zipcode"-type countries. Resolves a pincode to its
// country, state and the list of cities it covers.
export const resolvePincode = async (
  country: string,
  pincode: string,
): Promise<ApiResponse<PincodeResolution>> => {
  try {
    const response = await api.get("/geo/resolve-pincode", {
      params: { country, pincode },
    });
    return {
      ...response.data,
      data: unwrapObject<PincodeResolution>(response.data?.data),
    };
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};
