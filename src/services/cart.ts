import { api } from "./client";
import {
  ApiResponse,
  CartResponse,
  CartSyncData,
  PromoCode,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
} from "@/config/constants";

// Cart Management
export const addToCart = async (params: {
  product_variant_id: string | number;
  store_id: string | number;
  quantity: string | number;
  replace_quantity?: boolean;
  addons?: { addon_group_id: number; addon_item_id: number }[];
}): Promise<ApiResponse<CartResponse>> => {
  try {
    const response = await api.post("/user/cart/add", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const getCart = async (
  params: {
    address_id?: string | number;
    promo_code?: string;
    use_wallet?: boolean;
    market?: string;
  } = {},
): Promise<ApiResponse<CartResponse>> => {
  try {
    const response = await api.get("/user/cart", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const getSaveForLaterItems = async (): Promise<
  ApiResponse<CartResponse>
> => {
  try {
    const response = await api.get("/user/cart/item/save-for-later");
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const saveCartItemToSaveForLater = async (
  cartItemId: string | number,
  quantity: string | number,
): Promise<ApiResponse<{}>> => {
  try {
    const response = await api.post(
      `/user/cart/item/save-for-later/${cartItemId}`,
      { quantity },
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const removeItemFromCart = async (
  cartItemId: string | number,
): Promise<ApiResponse<[]>> => {
  try {
    const response = await api.delete(`/user/cart/item/${cartItemId}`);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const updateCartItem = async (params: {
  cartItemId: string | number;
  quantity?: string | number;
  addons?: { addon_group_id: number; addon_item_id: number }[];
}): Promise<ApiResponse<[]>> => {
  try {
    const { cartItemId, ...rest } = params;
    const response = await api.post(`/user/cart/item/${cartItemId}`, rest);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const syncOfflineCart = async (params: {
  items: {
    store_id: number;
    product_variant_id: number;
    quantity: number;
  }[];
}): Promise<ApiResponse<CartSyncData>> => {
  try {
    const response = await api.post("/user/cart/sync", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const clearCart = async (): Promise<ApiResponse<null>> => {
  try {
    const response = await api.get("/user/cart/clear-cart");
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

//Promo code

//Promo code
export const getPromoCodes = async (): Promise<ApiResponse<PromoCode[]>> => {
  try {
    const response = await api.get("/user/promos/available");
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const validatePromoCode = async (
  params: {
    cart_amount?: string | number;
    promo_code?: string;
    delivery_charge?: string | number;
  } = {},
): Promise<ApiResponse<{ promo_code: string; discount: string }>> => {
  try {
    const response = await api.get("/user/promos/validate", { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Orders
