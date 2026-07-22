import { api } from "./client";
import {
  ApiResponse,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
} from "@/config/constants";

export const getNotifications = async (
  params: {
    page?: number;
    per_page?: number;
    access_token?: string | null;
  } = {},
): Promise<ApiResponse<any>> => {
  try {
    const { access_token, ...queryParams } = params;
    const response = await api.get("/user/notifications", {
      headers: access_token
        ? { Authorization: `Bearer ${access_token}` }
        : undefined,
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const markNotificationRead = async (
  id: string,
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`/user/notifications/${id}/read`, { id });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const markAllNotificationsRead = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post("/user/notifications/mark-all-read");
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Brands
