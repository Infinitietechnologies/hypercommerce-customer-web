// /redesign/brands — all brands.
// Source: BRANDS LIST block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { BrandCard } from "@/redesign/components/cards";
import { Shell } from "@/redesign/components/Shell";
import { BRANDS, INITIAL_CART } from "@/redesign/data/mock";
import { Grid, PageTitle } from "@/redesign/primitives";
import { grids } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const BrandsPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <Shell cartCount={cartCount}>
      <PageTitle>All brands</PageTitle>
      <Grid columns={grids.brandList}>
        {BRANDS.map((b) => (
          <BrandCard
            key={b.id}
            brand={b}
            nameSize={13}
            padding={16}
            onClick={() =>
              router.push({
                pathname: "/redesign/brand",
                query: { slug: b.slug },
              })
            }
          />
        ))}
      </Grid>
    </Shell>
  );
};

BrandsPage.getLayout = (page) => page;

export default BrandsPage;
