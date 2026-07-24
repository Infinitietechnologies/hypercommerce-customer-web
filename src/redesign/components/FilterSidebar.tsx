// Listing filter panel.
//
// One panel body, two presentations: a sticky rail at ≥1024px, and a HeroUI
// `Drawer` (offcanvas) below it. The drawer renders through a portal, outside
// the `.rd` wrapper, so its content carries `rd-vars` to pick the redesign
// tokens back up.

import type { FilterState, PriceBucket } from "../data/filters";

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui";

import {
  DISCOUNT_OPTIONS,
  FILTER_BRANDS,
  FILTER_CATEGORIES,
  PRICE_BUCKETS,
  RATING_OPTIONS,
  activeFilterCount,
  toggleIn,
} from "../data/filters";
import { Button, Checkbox, Radio, RdIcon } from "../primitives";
import { radius, v } from "../tokens";

export type FilterSidebarProps = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  /** Result count shown in the drawer footer's apply button. */
  resultCount: number;
};

/* -------------------------------------------------------------------------- */
/* Building blocks                                                             */
/* -------------------------------------------------------------------------- */

function FacetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderTop: `1px solid ${v.line}`,
        padding: "16px 0",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          color: v.inkSoft,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function FacetRow({
  label,
  selected,
  control,
  onToggle,
  trailing,
}: {
  label: React.ReactNode;
  selected: boolean;
  control: "checkbox" | "radio";
  onToggle: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      role="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontSize: 13.5,
        color: selected ? v.ink : v.inkSoft,
        fontWeight: selected ? 600 : 400,
      }}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === "Enter" && onToggle()}
    >
      {control === "checkbox" ? (
        <Checkbox checked={selected} size={18} />
      ) : (
        <Radio checked={selected} size={16} />
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {trailing}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel body — shared by rail and drawer                                      */
/* -------------------------------------------------------------------------- */

export function FilterPanel({
  filters,
  onChange,
  onClear,
  showHeader = true,
}: Omit<FilterSidebarProps, "resultCount"> & { showHeader?: boolean }) {
  const count = activeFilterCount(filters);

  const setPrice = (key: PriceBucket) =>
    onChange({
      ...filters,
      price: filters.price.includes(key)
        ? filters.price.filter((x) => x !== key)
        : [...filters.price, key],
    });

  return (
    <div>
      {showHeader ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 14,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            Filters
            {count ? (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: v.amberTint,
                  color: v.amberDark,
                }}
              >
                {count}
              </span>
            ) : null}
          </div>
          {count ? (
            <button
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: v.amberDark,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              type="button"
              onClick={onClear}
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      <FacetGroup title="Category">
        {FILTER_CATEGORIES.map((c) => (
          <FacetRow
            key={c.slug}
            control="checkbox"
            label={c.title}
            selected={filters.categories.includes(c.slug)}
            onToggle={() =>
              onChange({
                ...filters,
                categories: toggleIn(filters.categories, c.slug),
              })
            }
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Brand">
        {FILTER_BRANDS.map((b) => (
          <FacetRow
            key={b.slug}
            control="checkbox"
            label={b.name}
            selected={filters.brands.includes(b.slug)}
            onToggle={() =>
              onChange({ ...filters, brands: toggleIn(filters.brands, b.slug) })
            }
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Price">
        {PRICE_BUCKETS.map((bucket) => (
          <FacetRow
            key={bucket.key}
            control="checkbox"
            label={bucket.label}
            selected={filters.price.includes(bucket.key)}
            onToggle={() => setPrice(bucket.key)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Customer rating">
        {RATING_OPTIONS.map((r) => (
          <FacetRow
            key={r}
            control="radio"
            label={
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                {r}
                <RdIcon color={v.amber} icon="solar:star-bold" size={13} />
                &amp; above
              </span>
            }
            selected={filters.minRating === r}
            onToggle={() =>
              onChange({
                ...filters,
                minRating: filters.minRating === r ? null : r,
              })
            }
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Discount">
        {DISCOUNT_OPTIONS.map((d) => (
          <FacetRow
            key={d}
            control="radio"
            label={`${d}% or more`}
            selected={filters.minDiscount === d}
            onToggle={() =>
              onChange({
                ...filters,
                minDiscount: filters.minDiscount === d ? null : d,
              })
            }
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Availability">
        <FacetRow
          control="checkbox"
          label="In stock only"
          selected={filters.inStockOnly}
          onToggle={() =>
            onChange({ ...filters, inStockOnly: !filters.inStockOnly })
          }
        />
      </FacetGroup>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop rail                                                                */
/* -------------------------------------------------------------------------- */

export function FilterRail(props: Omit<FilterSidebarProps, "resultCount">) {
  return (
    <aside
      className="rd-filter-rail"
      style={{
        border: `1px solid ${v.line}`,
        borderRadius: radius.card,
        background: v.surface,
        padding: "16px 18px",
        position: "sticky",
        top: 100,
        maxHeight: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      <FilterPanel {...props} />
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile offcanvas                                                            */
/* -------------------------------------------------------------------------- */

export function FilterDrawer({
  isOpen,
  onClose,
  resultCount,
  ...panel
}: FilterSidebarProps & { isOpen: boolean; onClose: () => void }) {
  return (
    <Drawer
      isOpen={isOpen}
      placement="left"
      size="xs"
      onClose={onClose}
      // `rd-vars` re-establishes the redesign tokens inside the portal.
      classNames={{ base: "rd-vars", wrapper: "rd-vars" }}
    >
      <DrawerContent style={{ background: v.surface, color: v.ink }}>
        <DrawerHeader
          style={{
            borderBottom: `1px solid ${v.line}`,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Filters
        </DrawerHeader>

        <DrawerBody style={{ paddingTop: 0 }}>
          <FilterPanel {...panel} showHeader={false} />
        </DrawerBody>

        <DrawerFooter
          style={{ borderTop: `1px solid ${v.line}`, gap: 10 }}
        >
          <Button
            style={{ flex: 1, borderRadius: radius.md }}
            variant="secondary"
            onClick={panel.onClear}
          >
            Clear all
          </Button>
          <Button
            style={{ flex: 1, borderRadius: radius.md }}
            onClick={onClose}
          >
            Show {resultCount} results
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
