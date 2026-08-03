import Router from "next/router";

/**
 * The panel caps payment attempts at 3 (see OrderService::retryOrderPayment).
 * On the next retry it CANCELS the order and returns
 * `labels.payment_retry_limit_reached` — so there is nothing left to pay here.
 * We detect that message and send the shopper back to checkout to place a
 * fresh order rather than re-showing the error.
 */
const RETRY_LIMIT_RE = /retry limit/i;

type PayResult = { success?: boolean; message?: string } | null | undefined;

export const isPaymentRetryLimitReached = (res: PayResult): boolean =>
  !!res && res.success === false && RETRY_LIMIT_RE.test(res.message ?? "");

/**
 * When the retry limit is hit, redirect to checkout. Returns true if it
 * redirected, so callers can stop and skip the failure toast.
 */
export const redirectToCheckoutOnRetryLimit = (res: PayResult): boolean => {
  if (!isPaymentRetryLimitReached(res)) return false;
  void Router.replace("/cart/checkout");
  return true;
};
