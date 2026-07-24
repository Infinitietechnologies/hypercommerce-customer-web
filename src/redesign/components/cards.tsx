// Redesign cards — product, category (4 styles), brand, banner, store.
//
// Pixel source: `HyperCommerce Kit Gallery.dc.html` (the canonical variant
// sheet) and `HyperCommerce App.dc.html` (the in-screen usages).

import type { CSSProperties } from "react";

import type { Brand, Category, Product, Store } from "../data/mock";

import { ImageSlot, RatingLine, RdIcon } from "../primitives";
import { radius, shadow, v } from "../tokens";

/* -------------------------------------------------------------------------- */
/* Product                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `full` — brand, name, rating, price/mrp/discount (home rail + grid, search).
 * `price` — brand, name, price only (category, store, PDP related).
 * `minimal` — name and price (brand detail, wishlist).
 */
export type ProductCardVariant = "full" | "price" | "minimal";

export function ProductCard({
  product,
  variant = "full",
  width,
  showDiscount = true,
  onClick,
  style,
}: {
  product: Product;
  variant?: ProductCardVariant;
  /** Fixed width pins the card into a horizontal rail (200px in the design). */
  width?: number;
  showDiscount?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div
      className="rd-row rd-row-product"
      role="button"
      style={{
        ...(width ? { width, flexShrink: 0 } : null),
        background: v.surface,
        border: `1px solid ${v.line}`,
        borderRadius: radius.card,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: shadow.card,
        ...style,
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div style={{ aspectRatio: "1 / 1" }}>
        <ImageSlot label={product.name} />
      </div>
      <div style={{ padding: "11px 13px 15px" }}>
        {variant !== "minimal" ? (
          <div
            style={{
              fontSize: 11,
              color: v.inkSoft,
              textTransform: "uppercase",
              letterSpacing: ".03em",
              fontWeight: 600,
            }}
          >
            {product.brand}
          </div>
        ) : null}

        <div
          className="rd-clamp-2"
          style={{
            fontSize: 13,
            fontWeight: 500,
            margin: "2px 0 6px",
            lineHeight: 1.3,
          }}
        >
          {product.name}
        </div>

        {variant === "full" ? (
          <RatingLine rating={product.rating} reviews={product.reviews} />
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {product.priceFmt}
          </span>
          {variant === "full" ? (
            <span
              style={{
                fontSize: 12,
                color: v.inkSoft,
                textDecoration: "line-through",
              }}
            >
              {product.mrpFmt}
            </span>
          ) : null}
          {variant !== "minimal" && showDiscount ? (
            <span
              style={{ fontSize: 12, color: v.amberDark, fontWeight: 600 }}
            >
              {product.offPct}% off
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Compact wishlist tile — 16px radius, tighter padding, no shadow. */
export function WishlistCard({
  product,
  onClick,
}: {
  product: Product;
  onClick?: () => void;
}) {
  return (
    <div
      className="rd-row rd-row-quiet"
      role="button"
      style={{
        background: v.surface,
        border: `1px solid ${v.line}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div style={{ aspectRatio: "1 / 1" }}>
        <ImageSlot label={product.name} />
      </div>
      <div style={{ padding: "10px 12px 13px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 5 }}>
          {product.name}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          {product.priceFmt}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Category — four style variants                                              */
/* -------------------------------------------------------------------------- */

/** `row` — 96px circle above a centred caption, sits in a rail. */
export function CategoryCircle({
  category,
  onClick,
}: {
  category: Category;
  onClick?: () => void;
}) {
  return (
    <div
      role="button"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        width: 104,
        cursor: "pointer",
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div
        className="rd-row rd-row-circle"
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          border: `1px solid ${v.line}`,
          overflow: "hidden",
          boxShadow: shadow.circle,
        }}
      >
        <ImageSlot shape="circle" />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {category.title}
      </span>
    </div>
  );
}

/** `card` — square image with a caption strip below. */
export function CategoryCard({
  category,
  onClick,
  captionSize = 12,
  captionPadding = "9px 10px",
}: {
  category: Category;
  onClick?: () => void;
  captionSize?: number;
  captionPadding?: string;
}) {
  return (
    <div
      className="rd-row rd-row-tile"
      role="button"
      style={{
        border: `1px solid ${v.line}`,
        borderRadius: radius.card,
        overflow: "hidden",
        cursor: "pointer",
        background: v.surface,
        boxShadow: shadow.cardFlat,
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div style={{ aspectRatio: "1 / 1" }}>
        <ImageSlot />
      </div>
      <div
        style={{
          padding: captionPadding,
          fontSize: captionSize,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {category.title}
      </div>
    </div>
  );
}

/** `overlay` — 4:3 photo with a bottom gradient scrim and white label. */
export function CategoryOverlay({
  category,
  onClick,
}: {
  category: Category;
  onClick?: () => void;
}) {
  return (
    <div
      role="button"
      style={{
        position: "relative",
        aspectRatio: "4 / 3",
        borderRadius: radius.card,
        overflow: "hidden",
        cursor: "pointer",
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <ImageSlot label={category.title} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,.7), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 16,
          bottom: 14,
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {category.title}
      </span>
    </div>
  );
}

/** `full` — horizontal row: 56px thumb, title, "Shop now →". */
export function CategoryRow({
  category,
  onClick,
}: {
  category: Category;
  onClick?: () => void;
}) {
  return (
    <div
      className="rd-row rd-row-soft"
      role="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: `1px solid ${v.line}`,
        borderRadius: radius.card,
        padding: 11,
        cursor: "pointer",
        background: v.surface,
        boxShadow: shadow.cardFlat,
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <ImageSlot />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{category.title}</div>
        <div style={{ fontSize: 12, color: v.inkSoft }}>Shop now →</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Brand                                                                       */
/* -------------------------------------------------------------------------- */

export function BrandCard({
  brand,
  showName = true,
  padding = 14,
  nameSize = 12,
  onClick,
}: {
  brand: Brand;
  showName?: boolean;
  padding?: number;
  nameSize?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className="rd-row rd-row-soft"
      role="button"
      style={{
        border: `1px solid ${v.line}`,
        borderRadius: radius.card,
        background: v.surface,
        padding,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        boxShadow: shadow.cardFlat,
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div style={{ width: 64, height: 64 }}>
        <ImageSlot label={brand.name} />
      </div>
      {showName ? (
        <span style={{ fontSize: nameSize, fontWeight: 600 }}>
          {brand.name}
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Banner                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `peek` — 16:7, 85%-width cards in a rail so the next one peeks in.
 * `full`  — 21:7 edge-to-edge hero.
 */
export function BannerCard({
  title,
  variant,
  onClick,
}: {
  title: string;
  variant: "peek" | "full";
  onClick?: () => void;
}) {
  const peek = variant === "peek";

  return (
    <div
      className="rd-row rd-row-banner"
      role="button"
      style={{
        ...(peek
          ? { flex: "0 0 min(85%,720px)", aspectRatio: "16 / 7", minHeight: 220 }
          : { width: "100%", aspectRatio: "21 / 7", minHeight: 260 }),
        borderRadius: radius.banner,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: shadow.banner,
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <ImageSlot label={title} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

export function StoreCard({
  store,
  onClick,
}: {
  store: Store;
  onClick?: () => void;
}) {
  return (
    <div
      className="rd-row rd-row-soft"
      role="button"
      style={{
        border: `1px solid ${v.line}`,
        borderRadius: radius.card,
        background: v.surface,
        padding: 18,
        cursor: "pointer",
        boxShadow: shadow.cardFlat,
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <RdIcon color={v.amberDark} icon="solar:shop-linear" size={22} />
        <div style={{ fontWeight: 700, fontSize: 15 }}>{store.name}</div>
      </div>
      <div style={{ fontSize: 13, color: v.inkSoft, marginBottom: 6 }}>
        {store.address}
      </div>
      <div
        style={{ display: "flex", gap: 14, fontSize: 12.5, color: v.inkSoft }}
      >
        <span>{store.distance}</span>
        <span>{store.hours}</span>
      </div>
    </div>
  );
}
