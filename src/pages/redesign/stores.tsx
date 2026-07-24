// /redesign/stores — nearby stores.
// Source: STORES LIST block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { StoreCard } from "@/redesign/components/cards";
import { Shell } from "@/redesign/components/Shell";
import { INITIAL_CART, STORES } from "@/redesign/data/mock";
import { Grid, PageTitle } from "@/redesign/primitives";
import { grids } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const StoresPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <Shell cartCount={cartCount}>
      <PageTitle>Nearby stores</PageTitle>
      <Grid columns={grids.store}>
        {STORES.map((s) => (
          <StoreCard
            key={s.id}
            store={s}
            onClick={() =>
              router.push({
                pathname: "/redesign/store",
                query: { slug: s.slug },
              })
            }
          />
        ))}
      </Grid>
    </Shell>
  );
};

StoresPage.getLayout = (page) => page;

export default StoresPage;
