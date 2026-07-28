// /redesign/search — search results with filter rail and sort.
// Source: SEARCH block of `HyperCommerce App.dc.html`, extended with the filter
// sidebar and sort control (no design counterpart — built from the kit's atoms).

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { ProductCard } from "@/redesign/components/cards";
import { ListingLayout } from "@/redesign/components/ListingLayout";
import { Shell } from "@/redesign/components/Shell";
import { INITIAL_CART, PRODUCTS } from "@/redesign/data/mock";
import { useListing } from "@/redesign/hooks/useListing";
import { EmptyState, Grid, TextField } from "@/redesign/primitives";
import { grids } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const SearchPage: NextPageWithLayout = () => {
  const router = useRouter();
  const listing = useListing(PRODUCTS);

  return (
    <Shell cartCount={cartCount}>
      <ListingLayout
        filters={listing.filters}
        header={
          <TextField
            icon="solar:magnifer-linear"
            placeholder="What you want today"
            style={{
              borderRadius: 14,
              padding: "12px 16px",
              fontSize: 14,
              marginBottom: 18,
              maxWidth: 520,
            }}
          />
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
            icon="solar:magnifer-linear"
            minHeight="40vh"
            title="No results"
          />
        ) : (
          <Grid columns={grids.product}>
            {listing.products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                variant="price"
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

SearchPage.getLayout = (page) => page;

export default SearchPage;
