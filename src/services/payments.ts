import { api } from "./client";
import {
  ApiResponse,
  PaystackCreateOrderResponse,
  RazorpayOrderData,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
} from "@/config/constants";

// RazorPay
export const createRazorPayOrder = async (
  params: {
    amount?: string | number;
    currency?: string;
    receipt?: string;
  } = {},
): Promise<ApiResponse<RazorpayOrderData>> => {
  try {
    const response = await api.post("/razorpay/create-order", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Stripe

// Stripe
export const createStripeIntent = async (
  params: {
    amount?: string | number;
    currency?: string;
  } = {},
): Promise<ApiResponse<{ clientSecret: string }>> => {
  try {
    const response = await api.post("/stripe/create-order", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// PayStack

// PayStack
export const paystackCreateOrder = async (
  params: {
    amount?: string | number;
  } = {},
): Promise<ApiResponse<PaystackCreateOrderResponse>> => {
  try {
    const response = await api.post("/paystack/create-order", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};
