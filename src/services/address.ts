import { api } from "./client";
import {
  Address,
  ApiResponse,
  PaginatedResponse,
} from "@/types/ApiResponse";
import {
  AddressParams,
} from "@/types/params";
import {
  fallbackApiRes,
  fallbackPaginateRes,
} from "@/config/constants";

// Address Interactions
export const getAddresses = async (
  params: {
    access_token?: string;
    page?: number;
    per_page?: number;
  } = {},
): Promise<PaginatedResponse<Address[]>> => {
  try {
    const response = await api.get("/user/addresses", { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

export const addAddress = async (params: AddressParams) => {
  try {
    // Pass params to the request
    const response = await api.post<ApiResponse<Address>>(
      "/user/addresses",
      params,
    );
    return response.data;
  } catch (error: any) {
    console.error("API error:", error);
    // Return validation errors from API response if available
    if (error?.response?.data) {
      return error.response.data;
    }
    return fallbackApiRes;
  }
};

export const editAddress = async (params: AddressParams) => {
  try {
    // Pass params to the request
    const response = await api.put<ApiResponse<Address>>(
      `/user/addresses/${params.id}`,
      params,
    );
    return response.data;
  } catch (error: any) {
    console.error("API error:", error);
    // Return validation errors from API response if available
    if (error?.response?.data) {
      return error.response.data;
    }
    return fallbackApiRes;
  }
};

export const deleteAddress = async (params: { id: string | number }) => {
  try {
    // Pass params to the request
    const response = await api.delete<ApiResponse<Address>>(
      `/user/addresses/${params.id}`,
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

//wallet
