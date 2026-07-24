// /redesign/store — store detail.
// Source: STORE DETAIL block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { ProductCard } from "@/redesign/components/cards";
import { Shell } from "@/redesign/components/Shell";
import { INITIAL_CART, PRODUCTS, STORES } from "@/redesign/data/mock";
import { Grid, ImageSlot } from "@/redesign/primitives";
import { grids, radius, v } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const StoreDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const store = STORES.find((s) => s.slug === router.query.slug) ?? STORES[0];

  return (
    <Shell cartCount={cartCount}>
      <div
        style={{
          borderRadius: radius.panel,
          overflow: "hidden",
          height: 220,
          marginBottom: 20,
          border: `1px solid ${v.line}`,
        }}
      >
        <ImageSlot label="Store front" />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
        {store.name}
      </h1>
      <div style={{ fontSize: 14, color: v.inkSoft, marginBottom: 4 }}>
        {store.address}
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 13,
          color: v.inkSoft,
          marginBottom: 24,
        }}
      >
        <span>{store.distance}</span>
        <span>{store.hours}</span>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>
        Available at this store
      </h2>
      <Grid columns={grids.product}>
        {PRODUCTS.slice(0, 4).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            variant="minimal"
            onClick={() =>
              router.push({ pathname: "/redesign/pdp", query: { slug: p.slug } })
            }
          />
        ))}
      </Grid>
    </Shell>
  );
};

StoreDetailPage.getLayout = (page) => page;

export default StoreDetailPage;
