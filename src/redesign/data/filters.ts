// Listing filter + sort model for the redesign sandbox.
//
// The design files have no filter/sort spec — `HyperCommerce App.dc.html` only
// shows a row of inert chips on the search screen. The facets below are derived
// from the fixture data (brand, price, rating, discount) and rendered with the
// kit's existing atoms, so the panel reads as part of the same system.

import type { Product } from "./mock";

import { BRANDS, CATEGORIES } from "./mock";

/* -------------------------------------------------------------------------- */
/* Sort                                                                        */
/* -------------------------------------------------------------------------- */

export type SortKey =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "discount"
  | "rating"
  | "newest";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "discount", label: "Discount" },
  { key: "rating", label: "Customer rating" },
  { key: "newest", label: "Newest first" },
];

export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((o) => o.key === value);
}

/* -------------------------------------------------------------------------- */
/* Facets                                                                      */
/* -------------------------------------------------------------------------- */

export type PriceBucket = "u1000" | "1000-2500" | "2500-5000" | "o5000";

export const PRICE_BUCKETS: {
  key: PriceBucket;
  label: string;
  min: number;
  max: number;
}[] = [
  { key: "u1000", label: "Under ₹1,000", min: 0, max: 1000 },
  { key: "1000-2500", label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { key: "2500-5000", label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  { key: "o5000", label: "Over ₹5,000", min: 5000, max: Infinity },
];

export const RATING_OPTIONS = [4, 3, 2] as const;
export const DISCOUNT_OPTIONS = [50, 25, 10] as const;

export const FILTER_CATEGORIES = CATEGORIES;
export const FILTER_BRANDS = BRANDS;

/* -------------------------------------------------------------------------- */
/* State                                                                       */
/* -------------------------------------------------------------------------- */

export type FilterState = {
  categories: string[];
  brands: string[];
  price: PriceBucket[];
  /** Minimum rating, e.g. 4 means "4★ & above". `null` = any. */
  minRating: number | null;
  /** Minimum discount percentage. `null` = any. */
  minDiscount: number | null;
  inStockOnly: boolean;
};

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  brands: [],
  price: [],
  minRating: null,
  minDiscount: null,
  inStockOnly: false,
};

/** How many facets are currently narrowing the list — drives the badge. */
export function activeFilterCount(f: FilterState): number {
  return (
    f.categories.length +
    f.brands.length +
    f.price.length +
    (f.minRating === null ? 0 : 1) +
    (f.minDiscount === null ? 0 : 1) +
    (f.inStockOnly ? 1 : 0)
  );
}

/** Toggle a value in one of the multi-select facets. */
export function toggleIn(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

/* -------------------------------------------------------------------------- */
/* Apply                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Fixtures carry no category or stock field, so both are derived — a product
 * belongs to the category at its position in the fixture order, and every
 * fourth one is treated as out of stock so the availability facet does
 * something visible. Real wiring replaces both with API facets.
 */
function categorySlugOf(p: Product): string {
  return CATEGORIES[(p.id - 1) % CATEGORIES.length].slug;
}

function isInStock(p: Product): boolean {
  return p.id % 4 !== 0;
}

export function applyFilters(
  products: Product[],
  filters: FilterState,
): Product[] {
  return products.filter((p) => {
    if (
      filters.categories.length &&
      !filters.categories.includes(categorySlugOf(p))
    ) {
      return false;
    }

    if (filters.brands.length) {
      const slug = BRANDS.find((b) => b.name === p.brand)?.slug;

      if (!slug || !filters.brands.includes(slug)) return false;
    }

    if (filters.price.length) {
      const inAnyBucket = filters.price.some((key) => {
        const bucket = PRICE_BUCKETS.find((b) => b.key === key)!;

        return p.price >= bucket.min && p.price < bucket.max;
      });

      if (!inAnyBucket) return false;
    }

    if (filters.minRating !== null && Number(p.rating) < filters.minRating) {
      return false;
    }

    if (filters.minDiscount !== null && p.offPct < filters.minDiscount) {
      return false;
    }

    if (filters.inStockOnly && !isInStock(p)) return false;

    return true;
  });
}

export function applySort(products: Product[], sort: SortKey): Product[] {
  const out = [...products];

  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "discount":
      return out.sort((a, b) => b.offPct - a.offPct);
    case "rating":
      return out.sort((a, b) => Number(b.rating) - Number(a.rating));
    case "newest":
      // Fixtures have no timestamp; highest id stands in for most recent.
      return out.sort((a, b) => b.id - a.id);
    default:
      return out;
  }
}
