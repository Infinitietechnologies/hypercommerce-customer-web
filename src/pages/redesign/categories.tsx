// /redesign/categories — all categories.
// Source: CATEGORIES LIST block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { CategoryCard } from "@/redesign/components/cards";
import { Shell } from "@/redesign/components/Shell";
import { CATEGORIES, INITIAL_CART } from "@/redesign/data/mock";
import { Grid, PageTitle } from "@/redesign/primitives";
import { grids } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const CategoriesPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <Shell cartCount={cartCount}>
      <PageTitle>All categories</PageTitle>
      <Grid columns={grids.categoryTile}>
        {CATEGORIES.map((c) => (
          <CategoryCard
            key={c.id}
            captionPadding="10px"
            captionSize={13}
            category={c}
            onClick={() =>
              router.push({
                pathname: "/redesign/category",
                query: { slug: c.slug },
              })
            }
          />
        ))}
      </Grid>
    </Shell>
  );
};

CategoriesPage.getLayout = (page) => page;

export default CategoriesPage;
