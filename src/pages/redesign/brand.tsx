// /redesign/brand — brand detail with filter rail and sort.
// Source: BRAND DETAIL block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { ProductCard } from "@/redesign/components/cards";
import { ListingLayout } from "@/redesign/components/ListingLayout";
import { Shell } from "@/redesign/components/Shell";
import { BRANDS, INITIAL_CART, PRODUCTS } from "@/redesign/data/mock";
import { useListing } from "@/redesign/hooks/useListing";
import { EmptyState, Grid, ImageSlot } from "@/redesign/primitives";
import { grids, v } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const BrandDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const brand = BRANDS.find((b) => b.slug === router.query.slug) ?? BRANDS[0];
  const listing = useListing(PRODUCTS);

  return (
    <Shell cartCount={cartCount}>
      <ListingLayout
        filters={listing.filters}
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                overflow: "hidden",
                border: `1px solid ${v.line}`,
              }}
            >
              <ImageSlot label={brand.name} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              {brand.name}
            </h1>
          </div>
        }
        resultCount={listing.products.length}
        sort={listing.sort}
        onClearFilters={listing.clear}
        onFiltersChange={listing.setFilters}
        onSortChange={listing.setSort}
      >
        {listing.products.length === 0 ? (
          <EmptyState
            body="No products match the filters you picked. Try removing one or two."
            icon="solar:box-linear"
            minHeight="40vh"
            title="Nothing here yet"
          />
        ) : (
          <Grid columns={grids.product}>
            {listing.products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                variant="minimal"
                onClick={() =>
                  router.push({
                    pathname: "/redesign/pdp",
                    query: { slug: p.slug },
                  })
                }
              />
            ))}
          </Grid>
        )}
      </ListingLayout>
    </Shell>
  );
};

BrandDetailPage.getLayout = (page) => page;

export default BrandDetailPage;
