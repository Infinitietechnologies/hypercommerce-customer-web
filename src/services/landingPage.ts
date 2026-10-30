import { api } from "./client";
import type { ApiResponse } from "@/types/common";
import type { LandingPageData } from "@/types/landingPage";

export interface GetLandingPageOptions {
  access_token?: string;
  market?: string;
}

export const getLandingPage = async (
  slug: string,
  options?: GetLandingPageOptions,
): Promise<ApiResponse<LandingPageData | null>> => {
  try {
    const response = await api.get<ApiResponse<LandingPageData>>(
      `/go/${encodeURIComponent(slug)}`,
      {
        params: {
          ...(options?.access_token ? { access_token: options.access_token } : {}),
          ...(options?.market ? { market: options.market } : {}),
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { message?: string };
      };
    };

    if (axiosError?.response?.status === 404) {
      return {
        success: false,
        message: axiosError.response?.data?.message || "Landing page not found",
        data: null,
      };
    }

    console.error("Landing page API error:", error);

    return {
      success: false,
      message: "Unable to load the landing page.",
      data: null,
    };
  }
};
