import { api } from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  SellerRegistrationFields,
  SellerRegistrationResponse,
} from "@/types/seller";

export const getSellerRegistrationFields = async (
  countryIso2: string,
): Promise<ApiResponse<SellerRegistrationFields>> => {
  const response = await api.get<ApiResponse<SellerRegistrationFields>>(
    "/seller/registration-fields",
    { params: { country_iso2: countryIso2 } },
  );
  return response.data;
};

export const sellerRegister = async (
  params: FormData,
): Promise<SellerRegistrationResponse> => {
  try {
    const response = await api.post<SellerRegistrationResponse>(
      "/seller/register",
      params,
    );
    return response.data;
  } catch (error: unknown) {
    const response = (
      error as { response?: { data?: SellerRegistrationResponse } }
    )?.response;
    if (response?.data) return response.data;
    throw error;
  }
};
