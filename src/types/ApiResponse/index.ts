/**
 * Backwards-compatible barrel.
 *
 * The types now live in per-domain modules under `src/types/`.
 * Import from the specific module in new code:
 *   import type { Product } from "@/types/catalog";
 */

export type * from "../ads";
export type * from "../cart";
export type * from "../catalog";
export type * from "../common";
export type * from "../content";
export type * from "../delivery";
export type * from "../geo";
export type * from "../home";
export type * from "../market";
export type * from "../order";
export type * from "../payments";
export type * from "../reviews";
export type * from "../settings";
export type * from "../user";
export type * from "../wallet";
export type * from "../wishlist";
