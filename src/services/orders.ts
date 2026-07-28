import { api } from "./client";
import {
  ApiResponse,
  Order,
  OrderListItem,
  OrderCheckoutResponse,
  PaginatedResponse,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
  fallbackPaginateRes,
} from "@/config/constants";

// Orders
export const getOrders = async (
  params: {
    per_page?: string | number;
    page?: string | number;
    access_token?: string | null;
    date_range?: string;
    status?: string;
  } = {},
): Promise<PaginatedResponse<OrderListItem[]>> => {
  try {
    const { access_token = "" } = params;
    const response = await api.get("/user/orders", {
      headers: access_token
        ? { Authorization: `Bearer ${access_token}` }
        : undefined,
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

export const reorderOrder = async (
  orderId: string | number,
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`/user/orders/${orderId}/reorder`);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const cancelOrderItem = async (
  params: {
    orderItemId?: string;
  } = {},
): Promise<ApiResponse<[]>> => {
  try {
    const response = await api.post(
      `/user/orders/items/${params.orderItemId}/cancel`,
      params,
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const returnOrderItem = async (
  params: {
    orderItemId?: string;
    reason_code?: string;
    reason?: string;
    quantity?: number;
    images?: File[];
  } = {},
): Promise<ApiResponse<[]>> => {
  try {
    const formData = new FormData();

    // Do NOT send orderItemId in the body.
    // Backend (CreateItemReturnRequest): reason_code (ReturnReasonCodeEnum) +
    // reason + images, images/reason required for evidence-critical reasons.
    if (params.reason_code) {
      formData.append("reason_code", params.reason_code);
    }
    if (params.reason) {
      formData.append("reason", params.reason);
    }
    if (params.quantity != null) {
      formData.append("quantity", String(params.quantity));
    }

    if (params?.images && params.images.length > 0) {
      params.images.forEach((file) => {
        formData.append("images[]", file);
      });
    }

    const response = await api.post(
      `/user/orders/items/${params.orderItemId}/return`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const cancelReturnReq = async (
  params: {
    orderItemId?: string;
  } = {},
): Promise<ApiResponse<[]>> => {
  try {
    const { orderItemId } = params;
    const response = await api.post(
      `/user/orders/items/${orderItemId}/return-cancel`,
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const getSpecificOrders = async (
  params: { slug?: string; access_token?: string | null } = {},
): Promise<ApiResponse<Order>> => {
  try {
    const { slug = "", access_token = "" } = params;
    const response = await api.get(`/user/orders/${slug}`, {
      headers: access_token
        ? { Authorization: `Bearer ${access_token}` }
        : undefined,
      params: params,
    });

    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const createOrder = async (
  params:
    | {
        payment_type?: string;
        promo_code?: string;
        promo_discount?: string;
        gift_card?: string;
        gift_card_discount?: string;
        use_wallet?: boolean | string | number;
        address_id?: string | number;
        order_note?: string;
        transaction_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
        redirect_url?: string;
      }
    | FormData = {},
): Promise<ApiResponse<OrderCheckoutResponse>> => {
  try {
    const isFormData = params instanceof FormData;
    const response = await api.post("/user/orders", params, {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : undefined,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// WishList Management
// get WishList with their Items
