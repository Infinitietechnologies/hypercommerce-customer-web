import { api } from "./client";
import {
  ApiResponse,
  PaginatedResponse,
  ToggleFavoriteResponse,
  Wishlist,
  WishTitle,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
  fallbackPaginateRes,
} from "@/config/constants";

// WishList Management
// get WishList with their Items
export const getWishListWithItems = async (
  params: {
    page?: string | number;
    per_page?: string | number;
    access_token?: string | null;
  } = {},
): Promise<PaginatedResponse<Wishlist[]>> => {
  try {
    const response = await api.get("/user/wishlists", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

// One-tap add/remove of a product in the default "Favorite" wishlist

// One-tap add/remove of a product in the default "Favorite" wishlist
export const toggleFavorite = async (params: {
  product_id: number;
  product_variant_id?: number | null;
  store_id: number;
}): Promise<ApiResponse<ToggleFavoriteResponse>> => {
  try {
    const response = await api.post("/user/wishlists/toggle", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// get the default "Favorite" wishlist with its items

// get the default "Favorite" wishlist with its items
export const getFavoriteWishlist = async (
  params: {
    page?: string | number;
    per_page?: string | number;
  } = {},
): Promise<ApiResponse<Wishlist>> => {
  try {
    const response = await api.get("/user/wishlists/favorite", { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const CreateWishListWithOutItems = async (
  params: {
    title?: null | string;
  } = {},
): Promise<ApiResponse<object>> => {
  try {
    const response = await api.post("/user/wishlists/create", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// get all wishlist titles

// get all wishlist titles
export const getAllWishlistTitles = async (
  params: {
    access_token?: string | null;
  } = {},
): Promise<ApiResponse<WishTitle>> => {
  try {
    const response = await api.get("/user/wishlists/titles", { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// getSpecificWishlist

// getSpecificWishlist
export const getWishlistById = async (
  id: string,
): Promise<ApiResponse<Wishlist>> => {
  try {
    const response = await api.get(`/user/wishlists/${id}`);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Update a wishlist

// Update a wishlist
export const UpdateWishlistById = async (
  params: {
    id?: null | number;
    title?: string | null;
  } = {},
): Promise<ApiResponse<object>> => {
  const { id = "" } = params;

  try {
    const response = await api.put(`/user/wishlists/${id}`, params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// delete wishlist

// delete wishlist
export const deleteWishlistById = async (
  id: string,
): Promise<ApiResponse<object>> => {
  try {
    const response = await api.delete(`/user/wishlists/${id}`);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Move item to another wishlist

// Move item to another wishlist
export const moveItemFromAnotherWishList = async (
  params: {
    itemId?: null | number;
    target_wishlist_id?: string | number;
  } = {},
): Promise<ApiResponse<object>> => {
  const { itemId = "" } = params;

  try {
    const response = await api.put(
      `/user/wishlists/items/${itemId}/move`,
      params,
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// FAQs
