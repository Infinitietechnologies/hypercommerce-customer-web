// /redesign/pdp — product detail.
// Source: PDP block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { ProductCard } from "@/redesign/components/cards";
import { Shell } from "@/redesign/components/Shell";
import { INITIAL_CART, PRODUCTS, findProduct } from "@/redesign/data/mock";
import {
  Grid,
  IconButton,
  ImageSlot,
  RdIcon,
  SectionHeader,
} from "@/redesign/primitives";
import { grids, radius, shadow, v } from "@/redesign/tokens";

const PROMISES = [
  { icon: "solar:delivery-linear", text: "Free delivery by ", strong: "Tomorrow, 8 PM" },
  { icon: "solar:refresh-linear", text: "7 day replacement policy" },
  { icon: "solar:shield-check-linear", text: "1 year manufacturer warranty" },
];

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const PdpPage: NextPageWithLayout = () => {
  const router = useRouter();
  const product = findProduct(router.query.slug as string);
  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <Shell cartCount={cartCount}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,460px) 1fr",
          gap: 40,
        }}
      >
        <div>
          <div
            style={{
              borderRadius: radius.panel,
              overflow: "hidden",
              aspectRatio: "1 / 1",
              border: `1px solid ${v.line}`,
            }}
          >
            <ImageSlot label={product.name} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: radius.sm,
                  overflow: "hidden",
                  border: `1px solid ${v.line}`,
                }}
              >
                <ImageSlot label="View" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".04em",
              color: v.amberDark,
            }}
          >
            {product.brand}
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: "6px 0 10px",
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: v.amberTint,
                color: v.amberDark,
                fontWeight: 700,
                fontSize: 13,
                borderRadius: radius.badge,
                padding: "4px 8px",
              }}
            >
              {product.rating}
              <RdIcon icon="solar:star-bold" size={13} />
            </span>
            <span style={{ fontSize: 13, color: v.inkSoft }}>
              {product.reviews} ratings
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700 }}>
              {product.priceFmt}
            </span>
            <span
              style={{
                fontSize: 15,
                color: v.inkSoft,
                textDecoration: "line-through",
              }}
            >
              {product.mrpFmt}
            </span>
            <span
              style={{ fontSize: 15, color: v.amberDark, fontWeight: 700 }}
            >
              {product.offPct}% off
            </span>
          </div>
          <div
            style={{ fontSize: 12.5, color: v.inkSoft, marginBottom: 20 }}
          >
            inclusive of all taxes
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 22,
              padding: 16,
              border: `1px solid ${v.line}`,
              borderRadius: radius.input,
              background: v.surface,
            }}
          >
            {PROMISES.map((p) => (
              <div
                key={p.icon}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13.5,
                }}
              >
                <RdIcon color={v.amberDark} icon={p.icon} size={18} />
                {p.text}
                {p.strong ? <strong>{p.strong}</strong> : null}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 26 }}>
            <button
              className="rd-btn rd-btn-primary"
              style={{
                flex: 1,
                background: v.amber,
                color: v.onAmber,
                border: "none",
                borderRadius: radius.input,
                padding: 14,
                fontWeight: 700,
                fontSize: 15,
                boxShadow: shadow.amber,
              }}
              type="button"
              onClick={() => router.push("/redesign/cart")}
            >
              Add to Cart
            </button>
            <IconButton
              icon="solar:share-linear"
              size={52}
              style={{ height: "auto", borderRadius: radius.input }}
              onClick={() => router.push("/redesign/share")}
            />
            <IconButton
              icon="solar:heart-linear"
              size={52}
              style={{ height: "auto", borderRadius: radius.input }}
              onClick={() => router.push("/redesign/account?tab=wishlists")}
            />
          </div>

          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Product details
            </h3>
            <p
              style={{
                fontSize: 13.5,
                color: v.inkSoft,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {product.description}
            </p>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 44 }}>
        <SectionHeader title="You may also like" />
        <Grid columns={grids.product}>
          {related.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              variant="price"
              showDiscount={false}
              onClick={() =>
                router.push({
                  pathname: "/redesign/pdp",
                  query: { slug: p.slug },
                })
              }
            />
          ))}
        </Grid>
      </section>
    </Shell>
  );
};

PdpPage.getLayout = (page) => page;

export default PdpPage;
