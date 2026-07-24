// /redesign/shopping-list — saved shopping list.
// Source: SHOPPING LIST block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { Shell } from "@/redesign/components/Shell";
import { INITIAL_CART, PRODUCTS } from "@/redesign/data/mock";
import { Checkbox, ImageSlot, PageTitle } from "@/redesign/primitives";
import { radius, v } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const ShoppingListPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <Shell cartCount={cartCount}>
      <PageTitle>Shopping list</PageTitle>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 640,
        }}
      >
        {PRODUCTS.slice(0, 5).map((it) => (
          <div
            key={it.id}
            className="rd-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: `1px solid ${v.line}`,
              borderRadius: radius.input,
              padding: "12px 16px",
              background: v.surface,
            }}
          >
            <Checkbox />
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.sm,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <ImageSlot label={it.name} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 12, color: v.inkSoft }}>
                {it.priceFmt}
              </div>
            </div>
            <button
              className="rd-btn"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: v.amberDark,
                background: v.amberTint,
                border: "none",
                borderRadius: radius.badge,
                padding: "7px 12px",
              }}
              type="button"
              onClick={() =>
                router.push({
                  pathname: "/redesign/pdp",
                  query: { slug: it.slug },
                })
              }
            >
              View
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
};

ShoppingListPage.getLayout = (page) => page;

export default ShoppingListPage;
