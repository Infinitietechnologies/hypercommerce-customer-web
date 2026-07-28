import type { MarketFormat } from "./market";
import type { SellerFeedbackItem } from "./reviews";

/** Shopper-facing derived status (read-only tracker headline). */
export interface CustomerStatus {
  code: string;
  label: string;
  description: string;
  stage: string;
  is_exception: boolean;
}

/** A parcel/shipment on a seller-order (replaces delivery-boy live tracking). */

/** A parcel/shipment on a seller-order (replaces delivery-boy live tracking). */
export interface OrderShipment {
  id: number;
  seller_order_id: number;
  status: string;
  status_label: string;
  customer_status: string;
  customer_status_label: string;
  customer_status_stage: string;
  provider_code: string | null;
  carrier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  fulfillment_status: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  products: {
    title: string | null;
    variant: string | null;
    quantity: number;
  }[];
}

export interface Order {
  id: number;
  uuid: string;
  slug: string;
  user_id: number;
  email: string;
  currency_code: string;
  currency_rate: string;
  /** Market currency symbol for THIS order (may differ from active market). */
  currency_symbol: string;
  /** Market number-format rules for THIS order. */
  format?: MarketFormat;
  payment_method: string;
  payment_status: string;
  status: OrderStatus;
  status_label: string;
  /** Hypercommerce fulfillment rollup (separate from `status`). */
  fulfillment_status: string;
  fulfillment_status_label: string;
  /** Customer-friendly headline + canonical tracker (derived). */
  customer_status: CustomerStatus;
  /** Per-shipment tracking, flattened across the order's seller orders. */
  shipments?: OrderShipment[];
  invoice: string;
  /** @deprecated delivery-boy model removed — null stubs from the backend. */
  fulfillment_type?: string;
  estimated_delivery_time?: number | null;
  delivery_time_slot_id?: number | null;
  delivery_boy_id?: number | null;
  delivery_boy_name?: string;
  delivery_boy_phone?: number | string;
  delivery_boy_profile?: string;
  is_delivery_feedback_given?: boolean;

  delivery_feedback?: {
    id: number;
    title: string;
    slug: string;
    description: string;
    rating: number;
    created_at: string;
  } | null;

  wallet_balance: string;
  promo_code: string | null;
  promo_discount: string;
  promo_line: null | {
    cashback_flag: boolean;
    created_at: string;
    discount_amount: string;
    id: number;
    is_awarded: boolean;
    order_id: number;
    promo_code: string;
    promo_id: number;
    updated_at: string;
  };
  gift_card: string | null;
  gift_card_discount: string;
  delivery_charge: string | number;
  platform_fee: string | number;
  cod_fee: string | number;

  subtotal: string;
  total_payable: string;
  final_total: string;

  shipping_name: string;
  shipping_address_1: string;
  shipping_address_2: string | null;
  shipping_landmark: string;
  shipping_zip: string;
  shipping_phone: string;
  shipping_address_type: string;
  shipping_latitude: string;
  shipping_longitude: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_country_code: string;
  order_note: string;

  items: OrderItem[];
  seller_feedbacks: SellerFeedbackItem[];

  created_at: string;
  updated_at: string;

  /** NEW FIELD */
  payment_response: any | null;
}

/** One event inside a tracker step (order/item/return timeline). */
export interface TimelineEvent {
  code: string;
  label: string;
  done: boolean;
  at: string | null;
  is_exception: boolean;
  meta?: {
    courier?: string;
    tracking_id?: string;
    tracking_url?: string;
  };
}

/** A tracker step — a main status (e.g. "Shipped", "Delivered") + its events. */
export interface TimelineStep {
  key: string;
  /** Step-level label, e.g. "Shipped" (labels.step_<key>). */
  label?: string;
  done: boolean;
  current?: boolean;
  marker?: "done" | "current" | "pending";
  at: string | null;
  events: TimelineEvent[];
}

export interface OrderItemReturnRequest {
  id: number;
  order_item_id: number;
  order_id: number;
  user_id: number;
  seller_id: number;
  store_id: number;
  delivery_boy_id: number | null;
  quantity?: number;
  reason: string;
  seller_comment: string | null;
  images: string[];
  refund_amount: number;
  pickup_status: string;
  return_status: string;
  /** Shopper-facing return status (code/label/stage). */
  customer_status?: CustomerStatus;
  /** Return-specific tracker steps. */
  return_timeline?: TimelineStep[];
  seller_approved_at: string | null;
  picked_up_at: string | null;
  received_at: string | null;
  refund_processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_variant_id: number;
  store_id: number;

  seller_id: number;
  seller_name: string;

  title: string;
  variant_title: string;

  gift_card_discount: string;
  admin_commission_amount: string;
  seller_commission_amount: string;
  commission_settled: string;
  discounted_price: string;
  promo_discount: string;
  discount: string;
  tax_amount: string;
  tax_percent: string;

  sku: string;
  quantity: number;
  price: string;
  subtotal: string;

  status: OrderStatus;
  status_label: string;
  /** Shopper-facing derived status for this item. */
  customer_status: CustomerStatus;
  /** Per-item tracker steps (scoped to this item's parcel + return/refund). */
  timeline?: TimelineStep[];
  can_cancel: boolean;
  cancelable_quantity: number;
  /** Snapshot ETA + upcoming delivery-date window. */
  eta_min?: number | null;
  eta_max?: number | null;
  eta_unit?: string | null;
  delivery_estimate?: {
    from: string;
    to: string;
    unit: string;
  } | null;
  otp: string | null;
  otp_verified: number;

  is_user_review_given: boolean;
  user_review: {
    id: number;
    product_id: number;
    rating: number;
    title: string;
    slug: string;
    comment: string;
    review_images: string[];
    user: {
      id: number;
      name: string;
    };
    created_at: string;
  } | null;

  product: OrderProduct;
  variant: OrderVariant;
  store: {
    id: number;
    name: string;
    slug: string;
  };

  return_eligible: boolean;
  can_return: boolean;
  return_deadline: string | null;
  returns: OrderItemReturnRequest[];
  attachments: string[];
  addons?: any[];

  created_at: string;
  updated_at: string;
}

export interface OrderProduct {
  id: number;
  name: string | null;
  slug: string;
  image: string;
  requires_otp: number;
  is_returnable: boolean;
  returnable_days: number;
  is_cancelable: boolean;
  cancelable_till: string | null;
  brand?: string;
  category?: string;
}

export interface OrderVariant {
  id: number;
  title: string;
  slug: string;
  image: string;
}

/**
 * Flat "My Orders" list entry — ONE order item plus its order context.
 * GET /user/orders now returns one of these per order ITEM (not per order).
 */

/**
 * Flat "My Orders" list entry — ONE order item plus its order context.
 * GET /user/orders now returns one of these per order ITEM (not per order).
 */
export interface OrderListItem {
  id: number;
  order_id: number;
  title: string;
  variant_title: string | null;
  /** Order slug (link target for the detail page). */
  slug: string;
  sku: string | null;
  quantity: number;
  price: string;
  subtotal: string;
  status: OrderStatus;
  status_label: string;
  customer_status: CustomerStatus;
  return_eligible: boolean;
  return_deadline: string | null;
  can_cancel: boolean;
  cancelable_quantity: number;
  seller_id: number | null;
  seller_name: string | null;
  is_user_review_given: boolean;
  user_review: OrderItem["user_review"];
  product?: {
    id: number | null;
    name: string | null;
    slug: string | null;
    image: string | null;
  };
  variant?: {
    id: number | null;
    title: string | null;
    image: string | null;
  };
  store?: {
    id: number | null;
    name: string | null;
    slug: string | null;
  };
  order: {
    id: number;
    uuid: string;
    slug: string;
    order_date: string | null;
    status: OrderStatus;
    status_label: string;
    payment_method: string;
    payment_status: string;
    currency: string;
    currency_symbol?: string | null;
    format?: MarketFormat | null;
    final_total: number;
    total_payable: number;
  } | null;
  created_at: string | null;
}

export type OrderStatus =
  | "awaiting_store_response"
  | "partially_accepted"
  | "ready_for_pickup"
  | "assigned"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "preparing"
  | "pending";

export interface OrderUser {
  id: number;
  name: string;
  email: string;
}

export interface OrderCheckoutResponse {
  id: number;
  uuid: string;
  slug: string;
  user_id: number;
  email: string;
  currency_code: string;
  currency_rate: number;
  payment_method: string;
  payment_status: string;
  status: string;
  invoice: string;
  fulfillment_type: string;
  estimated_delivery_time: number;
  delivery_time_slot_id: number | null;
  delivery_boy_id: number | null;
  delivery_boy_name: string;
  delivery_boy_phone: number | string;
  delivery_boy_profile: string;
  is_delivery_feedback_given: boolean;
  delivery_feedback: string | null;
  wallet_balance: number;
  promo_code: string | null;
  promo_discount: number;
  gift_card: string | null;
  gift_card_discount: number;
  delivery_charge: number;
  subtotal: number;
  total_payable: number;
  final_total: number;
  shipping_name: string;
  shipping_address_1: string;
  shipping_address_2: string | null;
  shipping_landmark: string | null;
  shipping_zip: string;
  shipping_phone: string;
  shipping_address_type: string;
  shipping_latitude: number;
  shipping_longitude: number;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_country_code: string;
  order_note: string;
  items: OrderItem[];
  user: OrderUser;
  created_at: string;
  updated_at: string;
  payment_response?: {
    link: string;
  };
}

export interface PaymentDetails {
  id: string | null;
  entity: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  order_id: string | null;
  invoice_id: string | null;
  international: boolean | null;
  method: string | null;
  amount_refunded: number | null;
  refund_status: string | null;
  captured: boolean | null;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string | null;
  contact: string | null;
  notes: {
    user_id: number | null;
    timeOfPayment: string | null;
  } | null;
  fee: number | null;
  tax: number | null;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: {
    bank_transaction_id: string | null;
  } | null;
  created_at: number | null;
  reward: string | null;
  base_amount: number | null;
}
