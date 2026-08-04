import type { PaymentDetails } from "./order";

export type TransactionQueryArgs = {
  page?: number;
  status?: string;
  payment_status?: string;
  transaction_type?: string;
  query?: string;
  search?: string;
};

export interface Wallet {
  id: number;
  user_id: number;
  type: string;
  balance: string | number;
  blocked_balance: string | number;
  /** Balance pre-formatted in the user's wallet currency (e.g. "₹1,250.00"). */
  formatted_balance: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

export type WalletTransaction = {
  formatted_amount: string;
  id: number;
  wallet_id: number;
  user_id: number;
  order_id: number | null;
  store_id: number | null;
  transaction_type: "deposit" | "withdraw" | string;
  payment_method: string;
  amount: string; // since "3.00" is a string
  currency_code: string;
  status: "pending" | "completed" | "failed" | string;
  transaction_reference: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export interface Transaction {
  formatted_amount: string;
  id: number;
  uuid: string;
  order_id: number | null;
  user_id: number;
  transaction_id: string;
  amount: string;
  currency: string;
  payment_method: string;
  payment_status: string;
  message: string;
  payment_details?: PaymentDetails;
  created_at: string;
  updated_at: string;
}
