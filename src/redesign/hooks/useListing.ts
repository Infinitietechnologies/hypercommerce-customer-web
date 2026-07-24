// Shared listing state: filters + sort, applied to a product list.
// Keeps search / category / brand behaving identically.

import type { Product } from "../data/mock";
import type { FilterState, SortKey } from "../data/filters";

import { useMemo, useState } from "react";

import { EMPTY_FILTERS, applyFilters, applySort } from "../data/filters";

export function useListing(source: Product[]) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("relevance");

  const products = useMemo(
    () => applySort(applyFilters(source, filters), sort),
    [source, filters, sort],
  );

  return {
    filters,
    setFilters,
    sort,
    setSort,
    products,
    clear: () => setFilters(EMPTY_FILTERS),
  };
}
