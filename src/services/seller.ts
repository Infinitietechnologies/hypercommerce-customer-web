import { api } from "./client";
import {
  ApiResponse,
  PaystackCreateOrderResponse,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
} from "@/config/constants";

export const sellerRegister = async (
  params:
    | FormData
    | {
        name?: string;
        email?: string;
        mobile?: string;
        password?: string;
        address?: string;
        city?: string;
        state?: string;
        landmark?: string;
        zipcode?: string;
        country?: string;
        latitude?: string;
        longitude?: string;
        business_license?: string | File;
        articles_of_incorporation?: string | File;
        national_identity_card?: string | File;
        authorized_signature?: string | File;
      },
): Promise<ApiResponse<PaystackCreateOrderResponse>> => {
  try {
    // Check if params is FormData
    const isFormData = params instanceof FormData;

    const response = await api.post("/seller/register", params, {
      headers: isFormData
        ? {
            // Let browser set Content-Type with boundary for FormData
            // Don't manually set 'Content-Type': 'multipart/form-data'
          }
        : {
            "Content-Type": "application/json",
          },
    });

    return response.data;
  } catch (error: any) {
    console.error("API error:", error);

    // Preserve error response if it exists (e.g., validation errors)
    if (error?.response?.data) {
      return error.response.data;
    }

    return fallbackApiRes;
  }
};
