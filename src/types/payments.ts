export interface RazorpayOrderData {
  amount: number;
  amount_due: number;
  amount_paid: number;
  attempts: number;
  created_at: number; // Unix timestamp
  currency: string; // e.g., "INR"
  entity: string; // usually "order"
  id: string; // e.g., "order_RF1iivHkU3Xbsi"
  notes: Record<string, string | number | boolean>[] | [];
  offer_id: string | null;
  receipt: string;
  status: "created" | "paid" | "attempted";
}

export interface PaystackCreateOrderResponse {
  transaction: {
    transaction_id: string;
    uuid: string;
    order_id: string | null;
    user_id: number;
    amount: string;
    currency: string;
    payment_method: string;
    payment_status: string;
    message: string;
    payment_details: {
      user_id: number;
      amount: number;
      currency: string;
    };
    updated_at: string;
    created_at: string;
    id: number;
  };
  payment_response: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}
