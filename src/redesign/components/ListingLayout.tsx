// Listing shell: filter rail + toolbar + results, with the rail collapsing into
// a HeroUI drawer below 1024px. Used by search, category detail and brand
// detail so all three listings behave identically.

import type { ReactNode } from "react";
import type { FilterState, SortKey } from "../data/filters";

import { useState } from "react";

import { FilterDrawer, FilterRail } from "./FilterSidebar";
import {
  SORT_OPTIONS,
  activeFilterCount,
  isSortKey,
} from "../data/filters";
import { Chip, RdIcon } from "../primitives";
import { radius, v } from "../tokens";

/* -------------------------------------------------------------------------- */
/* Toolbar                                                                     */
/* -------------------------------------------------------------------------- */

function SortSelect({
  sort,
  onChange,
}: {
  sort: SortKey;
  onChange: (s: SortKey) => void;
}) {
  return (
    <label
      className="rd-field"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: `1px solid ${v.line}`,
        borderRadius: radius.md,
        background: v.surface,
        padding: "9px 12px",
        cursor: "pointer",
      }}
    >
      <RdIcon
        color={v.inkSoft}
        icon="solar:sort-vertical-linear"
        size={16}
      />
      <span style={{ fontSize: 12.5, color: v.inkSoft }}>Sort</span>
      <select
        aria-label="Sort products"
        className="rd-jump"
        style={{
          border: "none",
          background: "none",
          fontSize: 13,
          fontWeight: 600,
          color: v.ink,
          cursor: "pointer",
          outline: "none",
        }}
        value={sort}
        onChange={(e) => {
          if (isSortKey(e.target.value)) onChange(e.target.value);
        }}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Removable chips summarising what is currently filtered. */
function ActiveChips({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const chips: { label: string; clear: () => void }[] = [
    ...filters.categories.map((slug) => ({
      label: slug.replace(/-/g, " "),
      clear: () =>
        onChange({
          ...filters,
          categories: filters.categories.filter((x) => x !== slug),
        }),
    })),
    ...filters.brands.map((slug) => ({
      label: slug.replace(/-/g, " "),
      clear: () =>
        onChange({
          ...filters,
          brands: filters.brands.filter((x) => x !== slug),
        }),
    })),
    ...filters.price.map((key) => ({
      label: key.replace(/-/g, " – "),
      clear: () =>
        onChange({ ...filters, price: filters.price.filter((x) => x !== key) }),
    })),
    ...(filters.minRating
      ? [
          {
            label: `${filters.minRating}★ & above`,
            clear: () => onChange({ ...filters, minRating: null }),
          },
        ]
      : []),
    ...(filters.minDiscount
      ? [
          {
            label: `${filters.minDiscount}%+ off`,
            clear: () => onChange({ ...filters, minDiscount: null }),
          },
        ]
      : []),
    ...(filters.inStockOnly
      ? [
          {
            label: "In stock",
            clear: () => onChange({ ...filters, inStockOnly: false }),
          },
        ]
      : []),
  ];

  if (!chips.length) return null;

  return (
    <div
      className="rd-hscroll"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        marginBottom: 16,
      }}
    >
      {chips.map((c) => (
        <button
          key={c.label}
          aria-label={`Remove filter ${c.label}`}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
          }}
          type="button"
          onClick={c.clear}
        >
          <Chip
            selected
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textTransform: "capitalize",
            }}
          >
            {c.label}
            <RdIcon icon="solar:close-circle-bold" size={14} />
          </Chip>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function ListingLayout({
  filters,
  onFiltersChange,
  onClearFilters,
  sort,
  onSortChange,
  resultCount,
  header,
  children,
}: {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  onClearFilters: () => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  resultCount: number;
  /** Page-specific heading rendered above the toolbar. */
  header?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const count = activeFilterCount(filters);

  return (
    <div className="rd-listing">
      <FilterRail
        filters={filters}
        onChange={onFiltersChange}
        onClear={onClearFilters}
      />

      <FilterDrawer
        filters={filters}
        isOpen={drawerOpen}
        resultCount={resultCount}
        onChange={onFiltersChange}
        onClear={onClearFilters}
        onClose={() => setDrawerOpen(false)}
      />

      <div style={{ minWidth: 0 }}>
        {header}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <button
            className="rd-btn rd-btn-secondary rd-filter-trigger"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${v.line}`,
              borderRadius: radius.md,
              background: v.surface,
              color: v.ink,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
            type="button"
            onClick={() => setDrawerOpen(true)}
          >
            <RdIcon icon="solar:filter-linear" size={16} />
            Filters
            {count ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 999,
                  background: v.amber,
                  color: v.onAmber,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {count}
              </span>
            ) : null}
          </button>

          <div style={{ fontSize: 13, color: v.inkSoft }}>
            {resultCount} {resultCount === 1 ? "result" : "results"}
          </div>

          <div style={{ marginLeft: "auto" }}>
            <SortSelect sort={sort} onChange={onSortChange} />
          </div>
        </div>

        <ActiveChips filters={filters} onChange={onFiltersChange} />

        {children}
      </div>
    </div>
  );
}
