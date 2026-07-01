export type ApiResponse<T> = {
  success: boolean;
  message: string;
  access_token?: string;
  data?: T | null;
  errors?: string[];
  total?: number;
};

// ---- Market currency / formatting (hypercommerce) ----
export interface MarketFormat {
  symbol_position?: "before" | "after" | string;
  space_between_symbol?: boolean;
  thousand_separator?: string;
  decimal_separator?: string;
  grouping_style?: string;
  decimal_places?: number;
  negative_format?: string;
}

export interface MarketCurrency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_base: boolean;
}

export interface MarketInfo {
  id: number;
  code: string;
  name: string;
  currency_code: string;
  default_language?: string;
  is_default: boolean;
  priority?: number;
  status?: string;
  countries?: { id: number; iso2: string; name: string }[];
  currency?: MarketCurrency;
  format?: MarketFormat;
}

export interface MarketsSetting {
  current: MarketInfo | null;
  default: MarketInfo | null;
  available: MarketInfo[];
}

export type VersionCheckData = {
  update_available: boolean;
  update_type: string;
  min_supported_version: string;
  latest_version: string;
  message: string;
  update_url: string;
};

export type PaginatedResponse<T, M = {}> = {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: T;
    first_page_url?: string;
    from?: number;
    last_page?: number;
    last_page_url?: string;
    links?: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    next_page_url?: string | null;
    path?: string;
    per_page: number;
    prev_page_url?: string | null;
    to?: number;
    total: number;
    keywords?: string[];
    category_ids?: number[];
    brand_ids?: number[];
    main_category_data?: {
      id: number;
      title: string;
      search_labels: string[];
    };
  } & M;
};

export type Settings = [
  {
    variable: "app";
    value: AppSettings;
  },
  {
    variable: "authentication";
    value: AuthenticationSettings;
  },
  {
    variable: "web";
    value: WebSettings;
  },
  {
    variable: "system";
    value: SystemSettings;
  },
  {
    variable: "payment";
    value: PaymentSettings;
  },
  {
    variable: "notification";
    value: NotificationSettings;
  },
  {
    variable: "home_general_settings";
    value: HomeGeneralSettings;
  },
  {
    variable: "advertisement";
    value: AdvertisementSettings;
  },
];

export type SystemSettings = {
  // App basics
  appName: string;
  logo: string;
  favicon: string;
  copyrightDetails: string;
  systemTimezone: string;

  // Support
  sellerSupportNumber: string;
  sellerSupportEmail: string;

  // Store & checkout
  systemVendorType: "single" | "multiple";
  checkoutType: "single_store" | "multi_store";
  minimumCartAmount: number;
  maximumItemsAllowedInCart: number;
  lowStockLimit: number | string;
  maximumDistanceToNearestStore: string | null;

  // Wallet
  enableWallet: boolean;
  welcomeWalletBalanceAmount: number;

  // Currency
  currency: string;
  currencySymbol: string;

  // Third-party integrations
  enableThirdPartyStoreSync: boolean;
  Shopify: boolean;
  Woocommerce: boolean;
  etsy: boolean;

  // Maintenance modes
  sellerAppMaintenanceMode: boolean;
  sellerAppMaintenanceMessage: string;
  webMaintenanceMode: boolean;
  webMaintenanceMessage: string;

  // Demo mode (✅ missing earlier)
  demoMode: boolean;
  adminDemoModeMessage: string;
  sellerDemoModeMessage: string;
  customerDemoModeMessage: string;
  customerLocationDemoModeMessage: string;
  deliveryBoyDemoModeMessage: string;

  // Refer & Earn
  referEarnStatus: boolean;
  referEarnMethodUser: "fixed" | "percentage" | string;
  referEarnBonusUser: string;
  referEarnMaximumBonusAmountUser: string;
  referEarnMethodReferral: "fixed" | "percentage" | string;
  referEarnBonusReferral: string;
  referEarnMaximumBonusAmountReferral: string;
  referEarnMinimumOrderAmount: string;
  referEarnNumberOfTimesBonus: string;
};

export interface PaymentSettings {
  stripePayment: boolean;
  stripePaymentMode: "test" | "live";
  stripePublishableKey: string;
  stripeCurrencyCode: string;

  razorpayPayment: boolean;
  razorpayPaymentMode: "test" | "live";
  razorpayKeyId: string;

  paystackPayment: boolean;
  paystackPaymentMode: "test" | "live";
  paystackPublicKey: string;

  cod: boolean;

  directBankTransfer: boolean;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
  bankExtraNote: string;

  flutterwavePayment: boolean;
  flutterwavePaymentMode: "test" | "live";
  flutterwavePublicKey: string;
  flutterwaveCurrencyCode: string;

  wallet: boolean;
}

export type AuthenticationSettings = {
  // SMS Gateway configuration
  customSms: boolean;
  customSmsUrl: string;
  customSmsMethod: "GET" | "POST" | string;
  googleRecaptchaSiteKey: string;
  customSmsTokenAccountSid: string;
  customSmsAuthToken: string;
  customSmsTextFormatData: string;
  customSmsHeaderKey: string[];
  customSmsHeaderValue: string[];
  customSmsParamsKey: string[];
  customSmsParamsValue: string[];
  customSmsBodyKey: string[];
  customSmsBodyValue: string[];
  firebase: boolean;

  /**
   * Selected SMS gateway for OTP flows.
   * "firebase" → use Firebase phone auth
   * "custom"   → use backend auth/send-otp & auth/verify-otp
   */
  smsGateway?: "firebase" | "custom";

  // Firebase configuration
  fireBaseApiKey: string;
  fireBaseAuthDomain: string;
  fireBaseDatabaseURL: string;
  fireBaseProjectId: string;
  fireBaseStorageBucket: string;
  fireBaseMessagingSenderId: string;
  fireBaseAppId: string;
  fireBaseMeasurementId: string;

  // Social login configuration
  appleLogin: boolean;
  googleLogin: boolean;
  facebookLogin: boolean;
  googleApiKey: string;
};

export type NotificationSettings = {
  firebaseProjectId: string;
  serviceAccountFile: string;
  vapIdKey: string;
};

export type WebSettings = {
  siteName: string;
  siteCopyright: string;
  supportNumber: string;
  supportEmail: string;
  address: string;
  shortDescription: string;
  siteHeaderLogo: string;
  siteHeaderDarkLogo: string;
  siteFooterLogo: string;
  siteFavicon: string;
  headerScript: string;
  footerScript: string;
  googleMapKey: string;
  mapIframe: string;
  appDownloadSection: boolean;
  appSectionTitle: string;
  appSectionTagline: string;
  appSectionPlaystoreLink: string;
  appSectionAppstoreLink: string;
  appSectionShortDescription: string;
  facebookLink: string;
  instagramLink: string;
  xLink: string;
  youtubeLink: string;
  shippingFeatureSection: string;
  shippingFeatureSectionTitle: string;
  shippingFeatureSectionDescription: string;
  returnFeatureSection: string;
  returnFeatureSectionTitle: string;
  returnFeatureSectionDescription: string;
  safetySecurityFeatureSection: string;
  safetySecurityFeatureSectionTitle: string;
  safetySecurityFeatureSectionDescription: string;
  supportFeatureSection: string;
  supportFeatureSectionTitle: string;
  supportFeatureSectionDescription: string;
  metaKeywords: string;
  metaDescription: string;
  defaultLatitude: string;
  defaultLongitude: string;
  enableCountryValidation: boolean;
  allowedCountries: string[];
  returnRefundPolicy: string;
  shippingPolicy: string;
  privacyPolicy: string;
  termsCondition: string;
  aboutUs: string;
};

export type AppSettings = {
  appstoreLink: string;
  playstoreLink: string;
  appScheme: string;
  appDomainName: string;
  customerAppScheme?: string;
  customerAppstoreLink?: string;
  customerPlaystoreLink?: string;
  sellerAppScheme?: string;
  sellerAppstoreLink?: string;
  sellerPlaystoreLink?: string;
};

export interface AdEvent {
  campaign_id: number;
  visitor_key: string;
  timestamp: string | null;
}

export type HomeGeneralSettings = {
  title: string;
  searchLabels: string[];
  backgroundType: "image" | "color";
  backgroundColor: string;
  backgroundImage?: string;
  icon?: string;
  activeIcon?: string;
  fontColor: string;
};

export type AdvertisementSettings = {
  featureEnabled: boolean;
  disableBehavior: string;
  cpcRate: number;
  walletMinTopup: number;
  searchSlotCount: number;
  relatedSlotCount: number;
  impressionMultiplierMin: number;
  impressionMultiplierMax: number;
  adImpressionVisibilityPct: number;
  adImpressionVisibilityMs: number;
  broadcastDriver: string;
  pusherAppId: string;
  pusherKey: string;
  pusherSecret: string;
  pusherCluster: string;
  reverbAppId: string;
  reverbKey: string;
  reverbSecret: string;
  reverbHost: string;
  reverbPort: number | null;
  reverbScheme: string;
};

export type SEOMetadata = {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
};

export type Category = {
  id: number;
  title: string;
  slug: string;
  image: string;
  banner: string;
  icon: string;
  active_icon: string;
  background_type: string | null;
  background_color: string;
  background_image: string;
  font_color: string;
  parent_id: number | null;
  parent_slug: string | null;
  description: string | null;
  status: "active" | "inactive";
  requires_approval: boolean;
  metadata: SEOMetadata | string | null;
  subcategory_count: number;
  product_count: number;
  enabled?: boolean;
};

export type SliderImage = {
  id: string;
  url: string;
  alt: string;
};
// Extended type definitions
export interface AddonGroupItem {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  indicator: "veg" | "non_veg" | null;
  price: number;
  cost: number;
  stock: number;
  is_available: boolean;
}

export interface AddonGroup {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  sort_order: number;
  items: AddonGroupItem[];
}

export interface ProductVariant {
  id: number;
  title: string;
  slug: string;
  image: string;
  weight: number;
  height: number;
  breadth: number;
  length: number;
  availability: boolean;
  cart_item?: {
    exists: boolean;
    cart_item_id: number | null;
  };
  barcode: string;
  is_default: boolean;
  price: number;
  special_price: number;
  store_id: number;
  store_slug: string;
  store_name: string;
  stock: number;
  sku: string;
  attributes: Record<string, string>;
  addon_groups?: AddonGroup[];
  is_addons?: boolean;
}

export interface SwatchValue {
  value: string;
  swatch: string;
}

export interface ProductAttribute {
  name: string;
  slug: string;
  swatche_type: "text" | "image" | "color";
  values: string[];
  swatch_values: SwatchValue[];
}

export interface KeywordSearch {
  keyword: string;
  total_products: number;
  current_page: number;
  last_page: number;
  per_page: number;
  products: Product[];
}

export interface CustomFields {
  [key: string]: string | undefined;
}

export interface CustomProductSectionField {
  id: number;
  uuid: string;
  title: string;
  description: string;
  image: string;
  sort_order: number;
}

export interface CustomProductSection {
  id: number;
  uuid: string;
  title: string;
  description: string;
  sort_order: number;
  fields: CustomProductSectionField[];
}

export interface ProductBadge {
  id: number;
  label: string;
  bg_color: string;
  text_color: string;
  border_color: string;
}

export interface Product {
  id: number;
  uuid: string;
  category_id: number;
  brand_id: number | null;
  brand_name: string | null;
  seller_id: number;
  title: string;
  slug: string;
  type: "simple" | "variant";
  short_description: string;
  description: string;
  category: string;
  category_name: string;
  brand: string;
  seller: string | null;
  indicator: "veg" | "non_veg" | null;
  favorite: FavoriteItem[] | null;
  estimated_delivery_time: number | null;
  ratings: number;
  rating_count: number;
  main_image: string;
  image_fit?: "contain" | "cover";
  additional_images: string[];
  minimum_order_quantity: number;
  quantity_step_size: number;
  total_allowed_quantity: number;
  is_returnable: number;
  returnable_days: number | null;
  is_cancelable: number;
  cancelable_till: string | null;
  tags: string[];
  warranty_period: string | null;
  guarantee_period: string | null;
  made_in: string | null;
  is_inclusive_tax: string;
  video_type: "youtube" | "self_hosted" | null;
  video_link: string | null;
  status: string;
  featured: "1" | "0" | null;
  is_recommended?: boolean;
  badge?: ProductBadge | null;
  is_sponsored?: boolean;
  campaign_id?: number;
  visitor_key?: string;
  metadata: {
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
  } | string | null;
  item_count_in_cart?: string;
  seller_ratings?: {
    total_reviews: number | null;
    average_rating: number | null;
    one_star_count: number | null;
    two_star_count: number | null;
    three_star_count: number | null;
    four_star_count: number | null;
    five_star_count: number | null;
  };
  custom_fields: CustomFields;
  created_at: string;
  updated_at: string;
  store_status: {
    is_open: boolean;
    status: string;
    current_slot?: string | null;
    next_opening_time?: string;
  };
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  custom_product_sections: CustomProductSection[];
}

export interface FavoriteItem {
  id: number;
  wishlist_id: number;
  wishlist_title: string;
  variant_id: number;
  variant_name: string;
  store_id: number;
  store_name: string;
}

export interface ToggleFavoriteResponse {
  is_favorited: boolean;
  item_id: number | null;
  items_count: number;
}

export interface ProductReviews {
  total_reviews: number;
  average_rating: string;
  ratings_breakdown: RatingsBreakdown;
  reviews: Review[];
}

export interface RatingsBreakdown {
  "1_star": string;
  "2_star": string;
  "3_star": string;
  "4_star": string;
  "5_star": string;
}

export interface Review {
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
}

export interface SellerReview {
  id: number;
  user_id: number;
  seller_id: number;
  order_id: number;
  rating: number;
  title: string;
  slug: string;
  description: string;
  user: {
    id: number;
    name: string;
  };
  seller: {
    id: number;
    name: string;
  };
  order: {
    id: number;
    order_number: string | null;
  };
  created_at: string; // or Date if you convert later
  updated_at: string; // or Date if you convert later
}

export interface ProductFaq {
  id: number;
  product_id: number;
  product_slug: string;
  product: {
    id: number;
    title: string;
    slug: string;
  };
  question: string;
  answer: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// Orders Type

/** Shopper-facing derived status (read-only tracker headline). */
export interface CustomerStatus {
  code: string;
  label: string;
  description: string;
  stage: string;
  is_exception: boolean;
}

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

export interface OrderItemReturnRequest {
  id: number;
  order_item_id: number;
  order_id: number;
  user_id: number;
  seller_id: number;
  store_id: number;
  delivery_boy_id: number | null;
  reason: string;
  seller_comment: string | null;
  images: string[];
  refund_amount: number;
  pickup_status: string;
  return_status: string;
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
  timeline?: unknown;
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

export type SellerFeedbackItem = {
  seller_id: number;
  is_feedback_given: boolean;
  feedback: {
    id: number;
    user_id: number;
    seller_id: number;
    order_id: number;
    rating: number;
    title: string;
    slug: string;
    description: string;
    created_at: string;
    updated_at: string;
  } | null;
};

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

export type TransactionQueryArgs = {
  page?: number;
  status?: string;
  payment_status?: string;
  transaction_type?: string;
  query?: string;
  search?: string;
};

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

export type Address = {
  id: number;
  user_id: number;
  address_line1: string;
  address_line2: string | null;
  city: string;
  landmark: string | null;
  state: string;
  zipcode: string;
  mobile: string;
  address_type: "home" | "work" | string; // Extend with more types if needed
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  created_at: string; // or `Date` if parsed
  updated_at: string; // or `Date` if parsed
};

export type VerifyUserData = {
  exists: boolean;
  type: "email" | "mobile";
  value: string;
};

export type userData = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  profile?: string;
  profile_image?: string;
  wallet_balance?: string | number;
  new_user?: boolean;
  friends_code?: string;
  email_verified_at?: string | null;
  mobile_verified_at?: string | null;
  otp_verified?: number | boolean | string;
  created_at?: string;
  country: string;
  iso_2: string;
};

export type SectionType =
  | "trending"
  | "best_seller"
  | "featured"
  | "on_sale"
  | "recommended";

export interface FeaturedSection {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  style: "without_background" | "with_background";
  section_type: SectionType;
  sort_order: number;
  status: "active" | "inactive" | string;
  scope_type: "global" | "local" | string;
  scope_id: number | null;
  scope_category_slug: string;
  scope_category_title: string;
  background_type: "image" | "color" | string | null;
  background_color: string | null;
  background_image: string;
  desktop_4k_background_image: string;
  desktop_fdh_background_image: string;
  tablet_background_image: string;
  mobile_background_image: string;
  text_color: string;
  categories: Category[];
  products: Product[];
  products_count: number;
  created_at: string;
  updated_at: string;
}

// Home Layout (replaces featured-sections builder)
export type HomeSectionType =
  | "hero"
  | "banners"
  | "products"
  | "categories"
  | "brands";

export interface HomeSectionItem {
  id: number;
  title?: string;
  image: string;
  default_image?: string;
  type?: string;
  link_type?: string;
  link_url?: string;
  target_id: number | string | null;
  slug: string;
}

// Hero items use `type`; banner items use `link_type` (+ optional link_url).
// Both share the common image/slug fields of HomeSectionItem.
export interface HomeHeroItem extends HomeSectionItem {
  type?: string;
}

export interface HomeBannerItem extends HomeSectionItem {
  link_type?: string;
  link_url?: string;
}

export interface HomeSection {
  id: number;
  type: HomeSectionType;
  title: string;
  style: string | null;
  config: Record<string, unknown> | null;
  background_image: string | null;
  hero_media: string | null;
  card_background_image: string | null;
  content: {
    products?: Product[];
    categories?: Category[];
    brands?: Brand[];
    items?: HomeSectionItem[];
  };
}

export interface HomeLayout {
  scope_type: string;
  scope_id: number | null;
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  sections: HomeSection[];
}

// Cart API Type

export interface CartApiResponse {
  success: boolean;
  message: string;
  data: CartResponse;
}

export interface CartResponse {
  id: number;
  uuid: string;
  user_id: number;
  items_count: number;
  total_quantity: number;
  items: CartItem[];
  removed_items: {
    product_name: string;
    variant_name: string;
    store_name: string;
    quantity: number;
    reason: string;
  }[];
  removed_count: number;
  payment_summary: PaymentSummary;
  delivery_zone: DeliveryZone;
  created_at: string;
  updated_at: string;
}

export interface FailedCartItem {
  store_id: number;
  product_variant_id: number;
  quantity?: number;
  product: {
    id: number;
    store_id: number;
    sku: string;
    price: number;
    special_price: number;
    cost: string;
    stock: number;
  };
  product_name?: string;
  product_image?: string;
  variant_name?: string;
  store_name?: string;
  reason: string;
}

export interface CartSyncData {
  cart: CartResponse;
  synced_items: {
    store_id: number;
    product_variant_id: number;
    quantity: number;
    product: {
      id: number;
      store_id: number;
      sku: string;
      price: number;
      special_price: number;
      cost: string;
      stock: number;
    };
  }[];
  failed_items: FailedCartItem[];
}

export interface CartItemAddon {
  addon_group_id: number;
  addon_item_id: number;
  title: string;
  price: number;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  product_variant_id: number;
  store_id: number;
  quantity: number;
  save_for_later: boolean;
  product: {
    id: number;
    name: string | null;
    slug: string;
    image: string;
    minimum_order_quantity: number;
    quantity_step_size: number;
    total_allowed_quantity: number;
    is_attachment_required?: boolean;
    attachment_mode?: string;
  };
  variant: {
    id: number;
    title: string;
    slug: string;
    image: string;
    price: string | number;
    special_price: string | number;
    stock: number;
    sku: string;
    is_addons?: boolean;
  };
  store: {
    id: number;
    name: string;
    slug: string;
    total_products: number;
    status: {
      is_open: boolean;
      status: string;
    };
  };
  addons?: CartItemAddon[];
  total_item_price?: number;
  total_item_special_price?: number;
  created_at: string;
  updated_at: string;
}

export interface SellerShippingItem {
  cart_item_id: number;
  product_name: string;
  is_fulfillable: boolean;
  unfulfillable_reason: string | null;
  shipping_rate: number | null;
  location_id: number | null;
  location_name: string | null;
  shipping_zone_id: number | null;
}

export interface SellerShippingCost {
  store_id: number;
  store_name: string;
  shipping_cost: number | null;
  is_fulfillable: boolean;
  items: SellerShippingItem[];
}

export interface PendingCharge {
  id: number;
  amount: number;
  reason: string;
  reason_note: string | null;
  seller_order_id: number | null;
}

export interface TaxBreakdownLine {
  tax_rate_id: number;
  title: string;
  rate: number;
  amount: number;
}

export interface PaymentSummary {
  items_total: number;
  total_saving: number;
  cod_available: boolean;
  platform_fee: number;
  cod_fee: number;
  additional_charges_total: number;
  delivery_charges: number;
  use_wallet: boolean;
  promo_code: string;
  promo_discount: number;
  promo_applied: PromoCode | [];
  promo_error: string | null;
  wallet_balance: number;
  wallet_amount_used: number;
  payable_amount: number;
  order_total: number;
  seller_shipping_costs: SellerShippingCost[];
  pending_charges: PendingCharge[];
  pending_charges_total: number;
  tax_breakdown: TaxBreakdownLine[];
  tax_total: number;
  minimum_cart_amount: number;
  currency_code: string;
  currency_symbol: string;
  format?: Record<string, unknown>;
}

export interface Wishlist {
  id: number;
  title: string;
  slug: string;
  items_count: number;
  items: WishlistItem[];
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: number;
  wishlist_id: number;
  product: {
    id: number;
    title: string;
    slug: string;
    image: string;
    short_description: string;
  };
  variant: {
    id: number;
    sku: string | null;
    image: string;
    price: number | null;
  };
  store: {
    id: number;
    name: string;
    slug: string;
  };
  created_at: string;
  updated_at: string;
}

export interface WishTitle {
  id: number;
  title: string;
  slug: string;
  items_count: number;
  created_at: string;
}

// FAQs
export interface FAQ {
  id: number;
  question: string;
  answer: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  description: string;
  start_date: string;
  end_date: string;
  discount_type: "flat" | "percent" | "free_shipping";
  discount_amount: string;
  promo_mode: "instant" | "cashback";
  usage_count: number;
  individual_use: number;
  max_total_usage: number;
  max_usage_per_user: number;
  min_order_total: string;
  max_discount_value: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Delivery Zone
export interface BoundaryPoint {
  lat: number;
  lng: number;
}

export interface DeliveryZone {
  id: number;
  zone_id: number;
  name: string;
  slug: string;
  center_latitude: string;
  center_longitude: string;
  radius_km: number;
  boundary_json: BoundaryPoint[];
  rush_delivery_enabled: boolean;
  delivery_time_per_km: number;
  rush_delivery_time_per_km: number;
  rush_delivery_charges: number;
  regular_delivery_charges: number;
  free_delivery_amount: number | null;
  distance_based_delivery_charges: number;
  per_store_drop_off_fee: number;
  handling_charges: number;
  buffer_time: number;
  status: "active" | "inactive" | string;
  delivery_boy_base_fee: string;
  delivery_boy_per_store_pickup_fee: string;
  delivery_boy_distance_based_fee: string;
  delivery_boy_per_order_incentive: string;
  created_at: string;
  updated_at: string;
}

export interface firebaseConfigType {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

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

export interface SidebarFilters {
  categories_count: number;
  brands_count: number;
  attributes_count: number;
  categories: Category[];
  brands: Brand[];
  attributes: FilterAttribute[];
}

export interface FilterAttribute {
  title: string;
  slug: string;
  values: FilterAttributeValue[];
}

export interface FilterAttributeValue {
  id: number;
  title: string;
  swatche_value: string;
  enabled: boolean;
}

export interface Brand {
  id: number;
  title: string;
  slug: string;
  logo: string;
  description?: string | null;
  enabled?: boolean;
  metadata?: SEOMetadata | string | null;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  address: string;
  latitude: string;
  longitude: string;
  lat?: string | number;
  lng?: string | number;
  enabled?: boolean;
  status?: {
    is_open: boolean;
    status: string;
  };
  avg_store_rating: string;
  total_store_feedback: number;
  distance: string | number;
  timing?: string;
  product_count?: number;
  description?: string;
  contact_number?: string;
  contact_email?: string;
  metadata?: SEOMetadata | string | null;
  is_recommended?: boolean;
}

export interface BannerData {
  top: Banner[];
  carousel: Banner[];
  sidebar?: Banner[];
}

export interface Banner {
  id: number;
  type: string;
  type_id: number;
  image: string;
  banner_image: string;
  title: string;
  slug?: string;
  brand_slug?: string;
  category_slug?: string;
  product_slug?: string;
  custom_url?: string;
  metadata?: SEOMetadata | string | null;
}

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  total_bonus: number;
  program?: {
    referrer_bonus_value?: string | number;
    referrer_bonus_method?: string;
    referrer_bonus_max_cap?: string | number;
    referee_bonus_value?: string | number;
    referee_bonus_method?: string;
    referee_bonus_max_cap?: string | number;
  };
}
