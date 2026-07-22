import { api } from "./client";
import {
  ApiResponse,
  Settings,
  VersionCheckData,
} from "@/types/ApiResponse";





// ALL Settings
export const getSettings = async (
  params: { access_token?: string | null; market?: string } = {},
): Promise<ApiResponse<Settings>> => {
  try {
    const response = await api.get<ApiResponse<Settings>>("/settings", {
      headers: {
        ...(params.market ? { "X-Market": params.market } : {}),
        ...(params.access_token
          ? { Authorization: `Bearer ${params.access_token}` }
          : {}),
      },
    });

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
