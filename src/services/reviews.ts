import { api } from "./client";
import {
  ApiResponse,
  PaginatedResponse,
  ProductReviews,
  SellerFeedbackItem,
  SellerReview,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
  fallbackPaginateRes,
  fallbackPaginateResOfProductReviews,
} from "@/config/constants";

/**
 * A 422 carries the reason the review was rejected (image too large, comment
 * too long). Swallowing it into the generic fallback leaves the shopper with
 * "something went wrong" and no way to fix the form.
 */
const validationError = (error: unknown): ApiResponse<object> | null => {
  const res = (error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } })
    .response;
  if (res?.status !== 422) return null;

  const first = Object.values(res.data?.errors ?? {})[0]?.[0];
  return { success: false, message: first || res.data?.message || "", data: {} };
};

export const getProductReviews = async (params: {
  page: string | number;
  per_page: string | number;
  access_token?: string | null;
  slug?: string;
}): Promise<PaginatedResponse<ProductReviews>> => {
  try {
    const { slug } = params;
    const response = await api.get(`/products/${slug}/reviews`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateResOfProductReviews;
  }
};

// Product Reviews
export const giveProductReview = async (
  params: {
    product_id?: string | number;
    order_item_id?: string | number;
    rating?: number;
    title?: string;
    comment?: string;
    images?: File[];
  } = {},
): Promise<ApiResponse<object>> => {
  try {
    const formData = new FormData();
    if (params.product_id)
      formData.append("product_id", params.product_id.toString());
    if (params.order_item_id)
      formData.append("order_item_id", params.order_item_id.toString());
    if (params.rating !== undefined)
      formData.append("rating", params.rating.toString());
    if (params.title) formData.append("title", params.title);
    if (params.comment) formData.append("comment", params.comment);

    if (params.images)
      params.images.forEach((file) => formData.append("review_images[]", file));

    const response = await api.post("/reviews", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return validationError(error) ?? fallbackApiRes;
  }
};

export const updateProductReview = async (
  params: {
    id?: string | number;
    rating?: number;
    title?: string;
    comment?: string;
    images?: File[];
    keepImages?: string[];
  } = {},
): Promise<ApiResponse<object>> => {
  try {
    let response;

    if (params.images || params.keepImages) {
      // The saved images NOT listed in `keepImages` were removed by the
      // shopper, so the replace flag tells the backend to drop them.
      const formData = new FormData();

      if (params.id) formData.append("id", params.id.toString());
      if (params.rating !== undefined)
        formData.append("rating", params.rating.toString());
      if (params.title) formData.append("title", params.title);
      if (params.comment) formData.append("comment", params.comment);
      formData.append("replace_review_images", "1");

      (params.keepImages ?? []).forEach((url) => {
        formData.append("keep_review_images[]", url);
      });

      (params.images ?? []).forEach((file) => {
        formData.append("review_images[]", file);
      });

      response = await api.post(`/reviews/${params.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // Send as JSON when the caller isn't touching images
      response = await api.post(`/reviews/${params.id}`, params);
    }

    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return validationError(error) ?? fallbackApiRes;
  }
};

export const giveOrderItemSellerReview = async (
  params: {
    seller_id?: string | number;
    order_id?: number;
    order_item_id?: string | number;
    rating?: string | number;
    title?: string;
    description?: string;
  } = {},
): Promise<ApiResponse<SellerFeedbackItem>> => {
  try {
    const response = await api.post("/seller-feedback", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const updateOrderItemSellerReview = async (
  params: {
    id?: number | string;
    rating?: string | number;
    title?: string;
    description?: string;
  } = {},
): Promise<ApiResponse<SellerFeedbackItem>> => {
  try {
    const response = await api.post(`/seller-feedback/${params.id}`, params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Home Layout (replaces featured-sections builder)

export const getSellerReviews = async (params: {
  seller_id?: string | number;
  page: string | number;
  per_page: string | number;
}): Promise<PaginatedResponse<SellerReview[]>> => {
  try {
    const response = await api.get(`seller-feedback`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

// Ad Tracking
