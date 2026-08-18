import { api } from "./client";
import {
  ApiResponse,
  Brand,
  Category,
  HomeCategory,
  KeywordSearch,
  PaginatedResponse,
  Product,
  ProductFaq,
  SidebarFilters,
  Store,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
  fallbackPaginateRes,
} from "@/config/constants";

//categories
export const getCategories = async (
  params: {
    page?: string | number;
    per_page?: string | number;
    slug?: string;
    market?: string;
    /** Only the categories flagged for the home category strip. */
    home?: boolean;
  } = {},
): Promise<PaginatedResponse<Category[]>> => {
  try {
    const response = await api.get("/categories", { params });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackPaginateRes;
  }
};

export const getHomeCategories = async (
  params: {
    page?: string | number;
    per_page?: string | number;
    market?: string;
  } = {},
): Promise<PaginatedResponse<HomeCategory[]>> => {
  try {
    const response = await api.get("/categories", {
      params: { ...params, home: true },
    });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackPaginateRes;
  }
};

export const getSubCategories = async (
  params: {
    page?: string | number;
    per_page?: string | number;
    slug?: string;
    filter?: "random" | "top_category";
    market?: string;
  } = {},
): Promise<PaginatedResponse<Category[]>> => {
  try {
    const response = await api.get("/categories/sub-categories", { params });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackPaginateRes;
  }
};

// Address Interactions

// Brands
export const getBrands = async (
  params: {
    page?: string | number;
    per_page?: string | number;
    scope_category_slug?: string;
    market?: string;
  } = {},
): Promise<PaginatedResponse<Brand[]>> => {
  try {
    const response = await api.get("/brands", { params });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackPaginateRes;
  }
};

// Stores

// Stores
export const getStores = async (
  params: {
    page?: string | number;
    per_page?: string | number;
    search?: string;
    market?: string;
  } = {},
): Promise<PaginatedResponse<Store[]>> => {
  try {
    const response = await api.get("/stores", { params });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackPaginateRes;
  }
};

export const getSpecificStore = async (
  slug: string,
  market?: string,
): Promise<ApiResponse<Store>> => {
  try {
    const response = await api.get(`/stores/${slug}`, {
      params: market ? { market } : undefined,
    });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackApiRes;
  }
};

//Products

//Products
export const getProducts = async (
  params: {
    page?: string | number;
    slug?: string;
    per_page?: string | number;
    exclude_product?: string;
    access_token?: string | undefined;
    categories?: string;
    brands?: string;
    search?: string;
    store?: string;
    include_child_categories?: number;
    attribute_values?: string;
    market?: string;
  } = {},
): Promise<PaginatedResponse<Product[], { keywords: string[] }>> => {
  try {
    // Market product listing (full products + variants + keywords).
    // NOTE: /products/search is a legacy zone autocomplete (no variants) —
    // the listing/grid must use /markets/products (ProductApiController@index).
    const response = await api.get("/markets/products", {
      params,
    });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return {
      ...fallbackPaginateRes,
      data: {
        ...fallbackPaginateRes.data,
        keywords: [],
      },
    } as PaginatedResponse<Product[], { keywords: string[] }>;
  }
};

// Debug/testing helper: ask the backend which market a given country maps to.
// The backend's geo-detect resolves a market from the country header
// (X-Country-Code), so we can preview the market for a picked location.

export const getSidebarFilters = async (params: {
  attribute_values?: string;
  categories?: string;
  brands?: string;
  type?: string;
  value?: string;
  access_token?: string;
  market?: string;
}): Promise<ApiResponse<SidebarFilters>> => {
  try {
    const { access_token, ...rest } = params;
    const response = await api.get<ApiResponse<SidebarFilters>>(
      "/products/sidebar-filters",
      {
        params: rest,
        headers: access_token
          ? { Authorization: `Bearer ${access_token}` }
          : undefined,
      },
    );
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackApiRes;
  }
};

export const getProductBySlug = async (
  params: {
    slug?: string;
    access_token?: string | undefined;
    market?: string;
    /** ISO2 country of the delivery location; enables backend delivery_eta. */
    country_iso2?: string;
  } = {},
): Promise<ApiResponse<Product>> => {
  try {
    const { slug, ...rest } = params;
    const response = await api.get(`/products/${slug}`, {
      params: rest,
    });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackApiRes;
  }
};

export const getProductsByKeyword = async (
  params: {
    keywords?: string;
    per_page?: string | number;
    market?: string;
  } = {},
): Promise<ApiResponse<KeywordSearch>> => {
  try {
    const response = await api.get(`/products/search-by-keywords`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackApiRes;
  }
};

export const getProductFAQs = async (params: {
  page: string | number;
  per_page: string | number;
  access_token?: string | null;
  slug?: string;
  search?: string;
}): Promise<PaginatedResponse<ProductFaq[]>> => {
  try {
    const { slug } = params;
    const response = await api.get(`/products/${slug}/faqs`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.warn("API error:", error instanceof Error ? error.message : error);
    return fallbackPaginateRes;
  }
};

// Product Reviews
