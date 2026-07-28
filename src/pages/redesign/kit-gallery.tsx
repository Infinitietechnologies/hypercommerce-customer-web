// /redesign/kit-gallery — every home section type × style variant.
//
// Ported 1:1 from `ecommerce-website-design/HyperCommerce Kit Gallery.dc.html`,
// including the exact VARIANTS list and item slices. Compose any subset in any
// order to build a home page.

import type { NextPageWithLayout } from "@/types";
import type { SectionSpec } from "@/redesign/components/HomeSection";

import { HomeSection } from "@/redesign/components/HomeSection";
import {
  BRANDS,
  CATEGORIES,
  KIT_BANNERS,
  PRODUCTS,
} from "@/redesign/data/mock";
import { layout, v } from "@/redesign/tokens";

/** Mirrors the design's `VARIANTS` array, label for label. */
const VARIANTS: { label: string; spec: SectionSpec }[] = [
  {
    label: "Products · rail · no background",
    spec: { type: "products", title: "Best Sellers", orientation: "horizontal", bg: "none", items: PRODUCTS.slice(0, 8) },
  },
  {
    label: "Products · grid · colour background",
    spec: { type: "products", title: "Recommended for you", orientation: "vertical", bg: "color", items: PRODUCTS.slice(0, 4) },
  },
  {
    label: "Products · grid · image background",
    spec: { type: "products", title: "Deals of the day", orientation: "vertical", bg: "image", items: PRODUCTS.slice(0, 4) },
  },
  {
    label: "Categories · default (row)",
    spec: { type: "categories", title: "Categories · default", style: "row", items: CATEGORIES },
  },
  {
    label: "Categories · full",
    spec: { type: "categories", title: "Categories · full", style: "full", items: CATEGORIES.slice(0, 6) },
  },
  {
    label: "Categories · card",
    spec: { type: "categories", title: "Categories · card", style: "card", items: CATEGORIES },
  },
  {
    label: "Categories · overlay",
    spec: { type: "categories", title: "Categories · overlay", style: "overlay", items: CATEGORIES.slice(0, 4) },
  },
  {
    label: "Brands · image + title",
    spec: { type: "brands", title: "Brands · image + title", style: "full", items: BRANDS },
  },
  {
    label: "Brands · full",
    spec: { type: "brands", title: "Brands · full", style: "full", items: BRANDS },
  },
  {
    label: "Banners · full",
    spec: { type: "banners", title: "Banners · full", style: "full", items: [KIT_BANNERS[0]] },
  },
  {
    label: "Banners · peek",
    spec: { type: "banners", title: "Banners · peek", style: "peek", items: KIT_BANNERS },
  },
];

const KitGalleryPage: NextPageWithLayout = () => {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src="/logo-icon.png"
            style={{ height: 36, width: 36, borderRadius: 10 }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Home section kit</div>
            <div style={{ fontSize: 12.5, color: v.inkSoft }}>
              Every section type × style variant — compose any subset in any
              order.
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: layout.maxWidth,
          margin: "0 auto",
          padding: "8px 24px 60px",
        }}
      >
        {VARIANTS.map((variant) => (
          <section
            key={variant.label}
            style={{
              borderTop: `1px solid ${v.line}`,
              paddingTop: 20,
              marginTop: 20,
            }}
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
                marginBottom: 14,
              }}
            >
              {variant.label}
            </span>
            <HomeSection spec={variant.spec} onSeeAll={() => undefined} />
          </section>
        ))}
      </main>
    </div>
  );
};

KitGalleryPage.getLayout = (page) => page;

export default KitGalleryPage;
