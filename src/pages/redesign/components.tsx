// /redesign/components — the component gallery: every card and composite block
// the screens are assembled from, shown with all of its variants side by side.

import type { NextPageWithLayout } from "@/types";
import type { ReactNode } from "react";

import {
  BannerCard,
  BrandCard,
  CategoryCard,
  CategoryCircle,
  CategoryOverlay,
  CategoryRow,
  ProductCard,
  StoreCard,
  WishlistCard,
} from "@/redesign/components/cards";
import { Footer, FullHeader, MinimalHeader } from "@/redesign/components/Shell";
import {
  BRANDS,
  CATEGORIES,
  HOME_TABS,
  NOTIFICATIONS,
  ORDERS,
  PRODUCTS,
  STORES,
  WALLET_TXNS,
  money,
} from "@/redesign/data/mock";
import {
  Card,
  EmptyState,
  Grid,
  Rail,
  RdIcon,
  StatusPill,
} from "@/redesign/primitives";
import { grids, layout, radius, v } from "@/redesign/tokens";

function Block({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{ borderTop: `1px solid ${v.line}`, paddingTop: 20, marginTop: 20 }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".04em",
          color: v.amberDark,
          background: v.amberTint,
          borderRadius: 999,
          padding: "5px 12px",
          marginBottom: note ? 8 : 14,
        }}
      >
        {title}
      </span>
      {note ? (
        <div style={{ fontSize: 12.5, color: v.inkSoft, marginBottom: 14 }}>
          {note}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const ComponentsPage: NextPageWithLayout = () => {
  return (
    <div className="rd">
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: v.surface,
          borderBottom: `1px solid ${v.line}`,
        }}
      >
        <div
          style={{
            maxWidth: layout.maxWidth,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <img
            alt=""
            src="/logo-icon.png"
            style={{ height: 36, width: 36, borderRadius: 10 }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Component gallery</div>
            <div style={{ fontSize: 12.5, color: v.inkSoft }}>
              Cards, rows and composite blocks — every variant used by the
              screens.
            </div>
          </div>
        </div>
      </header>

      <main
        style={{ maxWidth: layout.maxWidth, margin: "0 auto", padding: "8px 24px 60px" }}
      >
        <Block
          note="Rail card is pinned to 200px; grid cards fill an auto-fill track from 200px."
          title="Product card · full"
        >
          <Rail>
            {PRODUCTS.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} width={200} />
            ))}
          </Rail>
        </Block>

        <Block
          note="Brand, name and price — used on category, store and related-product grids."
          title="Product card · price only"
        >
          <Grid columns={grids.product}>
            {PRODUCTS.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} variant="price" />
            ))}
          </Grid>
        </Block>

        <Block
          note="Name and price — brand detail grid."
          title="Product card · minimal"
        >
          <Grid columns={grids.product}>
            {PRODUCTS.slice(4, 8).map((p) => (
              <ProductCard key={p.id} product={p} variant="minimal" />
            ))}
          </Grid>
        </Block>

        <Block note="16px radius, no shadow — account wishlist." title="Wishlist card">
          <Grid columns={grids.productCompact}>
            {PRODUCTS.slice(2, 6).map((p) => (
              <WishlistCard key={p.id} product={p} />
            ))}
          </Grid>
        </Block>

        <Block title="Category · circle (row)">
          <Rail gap={20}>
            {CATEGORIES.map((c) => (
              <CategoryCircle key={c.id} category={c} />
            ))}
          </Rail>
        </Block>

        <Block title="Category · card">
          <Grid columns={grids.categoryCard}>
            {CATEGORIES.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </Grid>
        </Block>

        <Block title="Category · overlay">
          <Grid columns={grids.categoryOverlay}>
            {CATEGORIES.slice(0, 4).map((c) => (
              <CategoryOverlay key={c.id} category={c} />
            ))}
          </Grid>
        </Block>

        <Block title="Category · full (row)">
          <Grid columns={grids.categoryOverlay}>
            {CATEGORIES.slice(0, 6).map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </Grid>
        </Block>

        <Block note="`image` hides the name; `full` shows it." title="Brand card">
          <Grid columns={grids.brand}>
            {BRANDS.slice(0, 3).map((b) => (
              <BrandCard key={b.id} brand={b} showName={false} />
            ))}
            {BRANDS.slice(3).map((b) => (
              <BrandCard key={b.id} brand={b} />
            ))}
          </Grid>
        </Block>

        <Block title="Store card">
          <Grid columns={grids.store}>
            {STORES.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </Grid>
        </Block>

        <Block note="16:7, 85% width so the next banner peeks in." title="Banner · peek">
          <Rail>
            {[
              { id: 1, title: "Big Billion Days — up to 70% off electronics" },
              { id: 2, title: "New season fashion drop" },
            ].map((bn) => (
              <BannerCard key={bn.id} title={bn.title} variant="peek" />
            ))}
          </Rail>
        </Block>

        <Block note="21:7 edge-to-edge hero." title="Banner · full">
          <BannerCard title="Kitchen & home essentials" variant="full" />
        </Block>

        <Block title="Order row">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ORDERS.map((o) => (
              <div
                key={o.id}
                className="rd-row rd-row-quiet"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  border: `1px solid ${v.line}`,
                  borderRadius: 14,
                  padding: 14,
                  background: v.surface,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: radius.sm,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${v.amberTint}, ${v.surface})`,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    Order #{o.id}
                  </div>
                  <div style={{ fontSize: 12, color: v.inkSoft }}>
                    {o.date} · {o.itemsCount} item(s)
                  </div>
                </div>
                <StatusPill status={o.status} />
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    minWidth: 70,
                    textAlign: "right",
                  }}
                >
                  {money(o.total)}
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Transaction row">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WALLET_TXNS.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `1px solid ${v.line}`,
                  borderRadius: radius.md,
                  padding: "12px 16px",
                  background: v.surface,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.desc}</div>
                  <div style={{ fontSize: 11.5, color: v.inkSoft }}>
                    {tx.date} · {tx.type}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: tx.amount > 0 ? v.amberDark : v.ink,
                  }}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {money(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Notification row">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  gap: 12,
                  border: `1px solid ${v.line}`,
                  borderRadius: radius.md,
                  padding: "14px 16px",
                  background: v.surface,
                }}
              >
                <RdIcon color={v.amberDark} icon={n.icon} size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
                  <div
                    style={{ fontSize: 12, color: v.inkSoft, marginTop: 2 }}
                  >
                    {n.body}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: v.inkSoft,
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.time}
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Summary panel">
          <Card
            padding={20}
            style={{ maxWidth: 340, borderRadius: radius.card }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              Order summary
            </div>
            {[
              ["Subtotal", "₹5,498"],
              ["Discount", "−₹4,481"],
              ["Delivery", "Free"],
            ].map(([k, val]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13.5,
                  marginBottom: 8,
                  color: v.inkSoft,
                }}
              >
                <span>{k}</span>
                <span style={{ color: k === "Discount" ? v.amberDark : undefined }}>
                  {val}
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: `1px solid ${v.line}`,
                paddingTop: 12,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>₹5,498</span>
            </div>
          </Card>
        </Block>

        <Block title="Empty state">
          <EmptyState
            body="We're stocking this space with new products and offers. In the meantime, explore what's trending across the store."
            icon="solar:bag-smile-linear"
            minHeight="auto"
            title="Fresh finds on the way"
          />
        </Block>

        <Block note="Sticky, with optional category tab strip." title="Header · full">
          <div style={{ border: `1px solid ${v.line}`, borderRadius: radius.card, overflow: "hidden" }}>
            <FullHeader activeTab="All" cartCount={3} tabs={HOME_TABS} />
          </div>
        </Block>

        <Block note="Checkout, static and 404 screens." title="Header · minimal">
          <div style={{ border: `1px solid ${v.line}`, borderRadius: radius.card, overflow: "hidden" }}>
            <MinimalHeader title="Checkout" />
          </div>
        </Block>

        <Block title="Footer">
          <div style={{ border: `1px solid ${v.line}`, borderRadius: radius.card, overflow: "hidden" }}>
            <Footer />
          </div>
        </Block>
      </main>
    </div>
  );
};

ComponentsPage.getLayout = (page) => page;

export default ComponentsPage;
