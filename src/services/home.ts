import { api } from "./client";
import {
  ApiResponse,
  HomeLayout,
  HomeNavbarItem,
  HomeSection,
  PaginatedResponse,
} from "@/types/ApiResponse";

import { fallbackPaginateRes } from "@/config/constants";

// Home Layout (replaces featured-sections builder)
export const getHomeLayout = async (
  params: {
    category_slug?: string;
    navbar_slug?: string;
    page?: string | number;
    per_page?: string | number;
    market?: string;
    /** Storefront platform layout; the web storefront uses "web". */
    platform?: "app" | "web";
    /** SSR-only: forwarded as a Bearer token so per-user data (favorites) resolves. */
    access_token?: string;
  } = {},
): Promise<ApiResponse<HomeLayout>> => {
  try {
    const response = await api.get<ApiResponse<HomeLayout>>("/home-layout", {
      params: { platform: "web", ...params },
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: null };
  }
};

export const getHomeNavbar = async (
  platform: "app" | "web" = "web",
): Promise<ApiResponse<HomeNavbarItem[]>> => {
  try {
    const response = await api.get<ApiResponse<HomeNavbarItem[]>>(
      "/home-navbar",
      {
        params: { platform },
      },
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: [] };
  }
};

export const getHomeLayoutSection = async (params: {
  sectionId: string | number;
  page?: string | number;
  per_page?: string | number;
  market?: string;
  /** SSR-only: forwarded as a Bearer token so per-user data (favorites) resolves. */
  access_token?: string;
}): Promise<PaginatedResponse<HomeSection[]>> => {
  try {
    const { sectionId, ...rest } = params;
    const response = await api.get(`/home-layout/sections/${sectionId}`, {
      params: rest,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

// Cart Management
