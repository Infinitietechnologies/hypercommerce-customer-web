/**
 * Backwards-compatible barrel.
 *
 * The endpoint callers now live in per-domain modules under `src/services/`,
 * all sharing the single axios instance in `src/services/client.ts`.
 * This file re-exports them so existing imports keep working.
 *
 * New code should import from the specific service module instead:
 *   import { getProducts } from "@/services/catalog";
 */

export { api } from "@/services/client";

export * from "@/services/address";
export * from "@/services/ads";
export * from "@/services/auth";
export * from "@/services/cart";
export * from "@/services/catalog";
export * from "@/services/content";
export * from "@/services/geo";
export * from "@/services/home";
export * from "@/services/market";
export * from "@/services/notifications";
export * from "@/services/orders";
export * from "@/services/payments";
export * from "@/services/reviews";
export * from "@/services/seller";
export * from "@/services/settings";
export * from "@/services/wallet";
export * from "@/services/wishlist";
