// /redesign/share — shared product landing card.
// Source: SHARE PAGE block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { Shell } from "@/redesign/components/Shell";
import { INITIAL_CART, findProduct } from "@/redesign/data/mock";
import { Button, ImageSlot } from "@/redesign/primitives";
import { radius, shadow, v } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const SharePage: NextPageWithLayout = () => {
  const router = useRouter();
  const product = findProduct(router.query.slug as string);

  return (
    <Shell cartCount={cartCount}>
      <div
        style={{
          maxWidth: 420,
          margin: "20px auto",
          textAlign: "center",
          border: `1px solid ${v.line}`,
          borderRadius: radius.banner,
          padding: 28,
          background: v.surface,
          boxShadow: "0 2px 12px -8px rgba(28,26,23,.08)",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            aspectRatio: "1 / 1",
            marginBottom: 16,
          }}
        >
          <ImageSlot label={product.name} />
        </div>
        <div
          style={{
            fontSize: 12,
            color: v.amberDark,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {product.brand}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, margin: "6px 0 10px" }}>
          {product.name}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {product.priceFmt}
        </div>
        <Button
          fullWidth
          style={{ borderRadius: radius.input, padding: 13, boxShadow: shadow.amber }}
          onClick={() =>
            router.push({
              pathname: "/redesign/pdp",
              query: { slug: product.slug },
            })
          }
        >
          Open product
        </Button>
      </div>
    </Shell>
  );
};

SharePage.getLayout = (page) => page;

export default SharePage;
