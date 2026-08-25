import type { OrderItem } from "@/types/ApiResponse";
import {
  logEvent,
  setUserId as setFirebaseUserId,
  setUserProperties as setFirebaseUserProperties,
} from "firebase/analytics";
import type { FirebaseInstance } from "@/lib/firebase";

export const GOOGLE_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "G-WHEQTBMDCR";
export const GOOGLE_ANALYTICS_ENABLED = process.env.NODE_ENV === "production";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-change";
export const COOKIE_CONSENT_KEY = "cookie_consent_choice";

export type AnalyticsConsent = "accepted" | "declined";

type AnalyticsItem = {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_list_id?: string | number;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
};

type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined | AnalyticsItem[]
>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let isGoogleAnalyticsInitialized = false;
let firebaseInstance: FirebaseInstance | null = null;
const pendingFirebaseEvents: Array<{
  eventName: string;
  params: AnalyticsParams;
}> = [];
let analyticsUserId = "";
let analyticsUserProperties: Record<string, string> = {};

const flushFirebaseAnalytics = () => {
  const analytics = firebaseInstance?.analytics;
  if (!analytics || !GOOGLE_ANALYTICS_ENABLED) return;

  const usesSeparateMeasurementId =
    firebaseInstance?.app.options.measurementId !== GOOGLE_ANALYTICS_ID;
  pendingFirebaseEvents.splice(0).forEach(({ eventName, params }) => {
    if (usesSeparateMeasurementId) {
      logEvent(analytics, eventName, params);
    }
  });

  setFirebaseUserId(analytics, analyticsUserId || null);
  if (Object.keys(analyticsUserProperties).length > 0) {
    setFirebaseUserProperties(analytics, analyticsUserProperties);
  }
};

export function setFirebaseInstance(instance: FirebaseInstance | null): void {
  firebaseInstance = instance;
  flushFirebaseAnalytics();
}

const getGtag = () => {
  if (typeof window === "undefined") return null;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });

  return window.gtag;
};

export const getAnalyticsConsent = (): AnalyticsConsent | null => {
  if (typeof window === "undefined") return null;

  const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  return consent === "accepted" || consent === "declined" ? consent : null;
};

export const initializeGoogleAnalytics = (): void => {
  if (
    !GOOGLE_ANALYTICS_ENABLED ||
    isGoogleAnalyticsInitialized ||
    getAnalyticsConsent() !== "accepted"
  ) {
    return;
  }

  const gtag = getGtag();
  if (!gtag) return;

  gtag("js", new Date());
  gtag("config", GOOGLE_ANALYTICS_ID, { send_page_view: false });
  isGoogleAnalyticsInitialized = true;
};

export function trackEvent(eventName: string, params?: AnalyticsParams): void {
  if (
    !GOOGLE_ANALYTICS_ENABLED ||
    getAnalyticsConsent() !== "accepted"
  ) {
    return;
  }

  getGtag()?.("event", eventName, {
    ...(params || {}),
    send_to: GOOGLE_ANALYTICS_ID,
  });

  const eventParams = params || {};
  const usesSeparateFirebaseMeasurementId =
    firebaseInstance?.app.options.measurementId !== GOOGLE_ANALYTICS_ID;
  if (firebaseInstance?.analytics && usesSeparateFirebaseMeasurementId) {
    logEvent(firebaseInstance.analytics, eventName, eventParams);
  } else if (!firebaseInstance?.analytics && pendingFirebaseEvents.length < 50) {
    pendingFirebaseEvents.push({ eventName, params: eventParams });
  }
}

export function trackPageView(pagePath: string, pageTitle: string): void {
  if (typeof window === "undefined") return;

  trackEvent("page_view", {
    page_location: window.location.href,
    page_path: pagePath,
    page_title: pageTitle,
  });
}

export function trackProductView(
  productId: string,
  productName: string,
  category?: string,
  price?: number,
): void {
  trackEvent("view_item", {
    items: [
      {
        item_id: productId,
        item_name: productName,
        item_category: category,
        price: price || 0,
      },
    ],
  });
}

export function trackAddToCart(
  productId: string,
  productName: string,
  price: number,
  quantity: number,
): void {
  trackEvent("add_to_cart", {
    items: [{ item_id: productId, item_name: productName, price, quantity }],
  });
}

export function trackRemoveFromCart(
  productId: string,
  productName: string,
): void {
  trackEvent("remove_from_cart", {
    items: [{ item_id: productId, item_name: productName }],
  });
}

export function trackPurchase(
  orderId: string,
  total: number,
  currency: string = "USD",
  promocode: string = "",
  deliveryCharge: number | string = "0",
  orderItems: OrderItem[],
): void {
  const items: AnalyticsItem[] = orderItems.map((item, index) => ({
    item_id: item.sku || item.product_id.toString(),
    item_name: item.title,
    affiliation: item.store?.name || item.seller_name || "Online Store",
    coupon: item.promo_discount ? "applied" : undefined,
    discount:
      parseFloat(item.discount || "0") + parseFloat(item.promo_discount || "0"),
    index,
    item_brand: item.seller_name,
    item_list_id: item.product_variant_id || undefined,
    item_list_name: item.product.name || undefined,
    item_variant: item.variant_title || undefined,
    location_id: item.store_id?.toString(),
    price: parseFloat(item.price),
    quantity: item.quantity,
  }));

  trackEvent("purchase", {
    transaction_id: orderId,
    value: total,
    currency,
    tax: orderItems.reduce(
      (sum, item) => sum + parseFloat(item.tax_amount || "0"),
      0,
    ),
    coupon: promocode,
    shipping:
      typeof deliveryCharge === "string"
        ? parseFloat(deliveryCharge || "0")
        : deliveryCharge,
    items,
  });
}

export function trackSearch(searchTerm: string): void {
  trackEvent("search", { search_term: searchTerm });
}

export function trackLogin(method: string): void {
  trackEvent("login", { method });
}

export function trackSignUp(method: string): void {
  trackEvent("sign_up", { method });
}

export function trackCategoryView(
  categoryId: string,
  categoryName: string,
): void {
  trackEvent("view_item_list", {
    item_list_id: categoryId,
    item_list_name: categoryName,
  });
}

export function trackStoreView(storeId: string, storeName: string): void {
  trackEvent("view_store", { store_id: storeId, store_name: storeName });
}

export function setAnalyticsUserProperties(
  properties: Record<string, string>,
): void {
  analyticsUserProperties = { ...analyticsUserProperties, ...properties };

  if (
    !GOOGLE_ANALYTICS_ENABLED ||
    getAnalyticsConsent() !== "accepted"
  ) {
    return;
  }

  getGtag()?.("set", "user_properties", properties);
  if (firebaseInstance?.analytics) {
    setFirebaseUserProperties(firebaseInstance.analytics, properties);
  }
}

export function setAnalyticsUserId(userId: string): void {
  analyticsUserId = userId;

  if (
    !GOOGLE_ANALYTICS_ENABLED ||
    getAnalyticsConsent() !== "accepted"
  ) {
    return;
  }

  getGtag()?.("config", GOOGLE_ANALYTICS_ID, {
    send_page_view: false,
    user_id: userId || null,
  });
  if (firebaseInstance?.analytics) {
    setFirebaseUserId(firebaseInstance.analytics, userId || null);
  }
}
