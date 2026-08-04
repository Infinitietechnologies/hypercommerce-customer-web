import { api } from "./client";
import {
  ApiResponse,
  PaginatedResponse,
  Transaction,
  Wallet,
  WalletTransaction,
} from "@/types/ApiResponse";
import {
  AddBalanceParams,
  DeductBalanceParams,
  PrepareWalletRechargeResponse,
  WalletTransactionParams,
} from "@/types/params";
import {
  fallbackApiRes,
  fallbackPaginateRes,
} from "@/config/constants";

export const prepareWalletRecharge = async (params: AddBalanceParams) => {
  try {
    // Pass params to the request
    const response = await api.post<ApiResponse<PrepareWalletRechargeResponse>>(
      "/user/wallet/prepare-wallet-recharge",
      params,
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const deductBalance = async (params: DeductBalanceParams) => {
  try {
    // Pass params to the request
    const response = await api.post<ApiResponse<object>>(
      "/user/wallet/deduct-balance",
      params,
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const getTransactions = async (
  params: {
    payment_status?: string;
    limit?: string;
    type?: string;
    page?: string | number;
    per_page?: string | number;
    access_token?: string | null;
    search?: string;
    sort?: string;
  } = {},
): Promise<PaginatedResponse<Transaction[]>> => {
  try {
    const { access_token, ...queryParams } = params;
    const response = await api.get("/user/order-transactions", {
      headers: access_token
        ? { Authorization: `Bearer ${access_token}` }
        : undefined,
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

export const getWalletTransactions = async (
  params: WalletTransactionParams,
): Promise<PaginatedResponse<WalletTransaction[]>> => {
  try {
    const response = await api.get("/user/wallet/transactions", { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackPaginateRes;
  }
};

export const getWallet = async (
  params: { access_token?: string | null } = {},
): Promise<ApiResponse<Wallet>> => {
  try {
    const { access_token } = params;
    const response = await api.get<ApiResponse<Wallet>>("/user/wallet", {
      headers: access_token
        ? { Authorization: `Bearer ${access_token}` }
        : undefined,
    });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};
