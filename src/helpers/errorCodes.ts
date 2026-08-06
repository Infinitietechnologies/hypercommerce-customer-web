import type { TFunction } from "i18next";

/**
 * `getServerSideProps` runs outside the i18n instance, so it returns a stable
 * code and the page resolves it. Anything unrecognised (an SWR error message,
 * an API message) passes through unchanged.
 */
export const SSR_ERROR_CODES = {
  ordersLoadFailed: "orders_load_failed",
  orderDetailsLoadFailed: "order_details_load_failed",
  invalidOrderIdentifier: "invalid_order_identifier",
  addressesLoadFailed: "addresses_load_failed",
  profileLoadFailed: "profile_load_failed",
} as const;

const ERROR_KEYS: Record<string, string> = {
  [SSR_ERROR_CODES.ordersLoadFailed]: "errors.orders_load_failed",
  [SSR_ERROR_CODES.orderDetailsLoadFailed]: "errors.order_details_load_failed",
  [SSR_ERROR_CODES.invalidOrderIdentifier]: "errors.invalid_order_identifier",
  [SSR_ERROR_CODES.addressesLoadFailed]: "errors.addresses_load_failed",
  [SSR_ERROR_CODES.profileLoadFailed]: "errors.profile_load_failed",
};

export const translateErrorCode = (
  t: TFunction,
  value?: string | null,
): string => {
  if (!value) return "";

  const key = ERROR_KEYS[value];

  return key ? t(key) : value;
};
