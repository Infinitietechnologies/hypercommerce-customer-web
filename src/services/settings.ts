import { api } from "./client";
import {
  ApiResponse,
  Settings,
  VersionCheckData,
} from "@/types/ApiResponse";





// ALL Settings
/**
 * Settings are read by every SSR handler on every navigation. They change on
 * the ~30-minute scale (CLAUDE.md 7.3), so a short server-side memo keyed by
 * market spares the panel one round trip per page view. Only anonymous reads
 * are cached — a token makes the payload user-specific.
 */
const SETTINGS_TTL_MS = 60_000;
const settingsCache = new Map<
  string,
  { expires: number; value: ApiResponse<Settings> }
>();

export const getSettings = async (
  params: { access_token?: string | null; market?: string } = {},
): Promise<ApiResponse<Settings>> => {
  const cacheKey =
    typeof window === "undefined" && !params.access_token
      ? `settings:${params.market || "default"}`
      : null;

  if (cacheKey) {
    const hit = settingsCache.get(cacheKey);
    if (hit && hit.expires > Date.now()) return hit.value;
  }

  try {
    const response = await api.get<ApiResponse<Settings>>("/settings", {
      headers: {
        ...(params.market ? { "X-Market": params.market } : {}),
        ...(params.access_token
          ? { Authorization: `Bearer ${params.access_token}` }
          : {}),
      },
    });

    if (cacheKey && response.data?.success) {
      settingsCache.set(cacheKey, {
        expires: Date.now() + SETTINGS_TTL_MS,
        value: response.data,
      });
    }

    return response.data;
  } catch (error: any) {
    console.error("API error:", error);
    // Check if it's a 503 maintenance mode response
    if (error?.response?.status === 503) {
      const responseData = error.response?.data;
      if (
        responseData &&
        typeof responseData === "object" &&
        (responseData as any).maintenance === true
      ) {
        // Return maintenance mode response
        return {
          success: false,
          message: (responseData as any).message || "Maintenance mode active",
          data: null,
        };
      }
    }
    return { success: false, message: "An error occurred.", data: null };
  }
};

export const getVersionCheck = async (
  params: {
    app: string;
    current_version: string;
    platform: string;
  } = {
    app: "web",
    current_version: process.env.NEXT_PUBLIC_APP_VERSION || "0",
    platform: "android",
  },
): Promise<ApiResponse<VersionCheckData>> => {
  try {
    const response = await api.get<ApiResponse<VersionCheckData>>(
      "/settings/check-version",
      {
        params,
      },
    );
    return response.data;
  } catch (error: any) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: null };
  }
};

// User Interactions
