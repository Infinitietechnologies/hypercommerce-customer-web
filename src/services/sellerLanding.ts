import { api } from "./client";
import type { ApiResponse } from "@/types/common";
import type { SellerLandingSettings } from "@/types/sellerLanding";

export const getSellerLandingPage = async (): Promise<
  ApiResponse<SellerLandingSettings | null>
> => {
  try {
    const response = await api.get<ApiResponse<SellerLandingSettings>>(
      "/seller-landing",
    );

    return response.data;
  } catch (error) {
    console.error("Seller landing API error:", error);

    return {
      success: false,
      message: "Unable to load the seller landing page.",
      data: null,
    };
  }
};
