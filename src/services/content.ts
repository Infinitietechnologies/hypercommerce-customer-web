import { api } from "./client";
import {
  FAQ,
  PaginatedResponse,
} from "@/types/ApiResponse";


import {
  fallbackPaginateRes,
} from "@/config/constants";

// FAQs
export const getFaqs = async (
  params: {
    page?: string | number;
    per_page?: string | number;
    search?: string;
  } = {},
): Promise<PaginatedResponse<FAQ[]>> => {
  try {
    const response = await api.get("/faqs", { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

// RazorPay
