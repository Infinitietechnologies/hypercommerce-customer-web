// Home section composer — the single component that renders every section type
// × style variant the storefront home page can be built from.
//
// Pixel + logic source: `makeSection()` in `HyperCommerce Kit Gallery.dc.html`.
// The section descriptor below mirrors that function's options exactly, so the
// kit gallery and the home screen render from one implementation.

import type { Brand, Category, Product } from "../data/mock";

import {
  BannerCard,
  BrandCard,
  CategoryCard,
  CategoryCircle,
  CategoryOverlay,
  CategoryRow,
  ProductCard,
} from "./cards";
import { Grid, Rail, SectionHeader } from "../primitives";
import { grids, radius, v } from "../tokens";

/** Background treatment behind a products section. */
export type SectionBg = "none" | "color" | "image";

export type SectionSpec =
  | {
      type: "products";
      title?: string | null;
      /** `horizontal` renders a rail; anything else renders a grid. */
      orientation?: "horizontal" | "vertical";
      bg?: SectionBg;
      items: Product[];
    }
  | {
      type: "categories";
      title?: string | null;
      style: "row" | "card" | "overlay" | "full";
      items: Category[];
    }
  | {
      type: "brands";
      title?: string | null;
      /** `full` shows the brand name under the logo. */
      style?: "full" | "image";
      items: Brand[];
    }
  | {
      type: "banners";
      title?: string | null;
      style: "peek" | "full";
      items: { id: number; title: string }[];
    };

export function HomeSection({
  spec,
  onSelectProduct,
  onSelectCategory,
  onSelectBrand,
  onSelectBanner,
  onSeeAll,
}: {
  spec: SectionSpec;
  onSelectProduct?: (p: Product) => void;
  onSelectCategory?: (c: Category) => void;
  onSelectBrand?: (b: Brand) => void;
  onSelectBanner?: () => void;
  onSeeAll?: () => void;
}) {
  const bg: SectionBg = spec.type === "products" ? (spec.bg ?? "none") : "none";
  const bgImage = bg === "image";
  const bgTint = bg === "color";

  // On an image background the section's text flips to white, matching
  // `contentStyle` in the design's makeSection().
  const contentColor = bgImage ? "#fff" : v.ink;

  return (
    <section style={{ marginBottom: 36 }}>
      {spec.title ? (
        <SectionHeader title={spec.title} onAction={onSeeAll} />
      ) : null}

      {spec.type === "products" ? (
        <div
          style={{
            display: "grid",
            borderRadius: radius.panel,
            overflow: "visible",
            ...(bgImage ? { minHeight: 380 } : null),
            background: bgTint ? v.amberTint : "transparent",
            ...(bgTint
              ? { boxShadow: "0 2px 12px -8px rgba(28,26,23,.1)" }
              : null),
          }}
        >
          {bgImage ? (
            <>
              <div
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  width: "100%",
                  height: "100%",
                  borderRadius: radius.panel,
                  overflow: "hidden",
                  background: `linear-gradient(135deg, ${v.amberTint}, ${v.surface})`,
                }}
              />
              <div
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  width: "100%",
                  height: "100%",
                  borderRadius: radius.panel,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,.62), rgba(0,0,0,.2))",
                  pointerEvents: "none",
                }}
              />
            </>
          ) : null}

          <div
            style={{
              gridColumn: 1,
              gridRow: 1,
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              padding: bgTint || bgImage ? 24 : 0,
              color: contentColor,
            }}
          >
            {spec.orientation === "horizontal" ? (
              <Rail>
                {spec.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    width={200}
                    onClick={() => onSelectProduct?.(p)}
                  />
                ))}
              </Rail>
            ) : (
              <Grid columns={grids.product}>
                {spec.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => onSelectProduct?.(p)}
                  />
                ))}
              </Grid>
            )}
          </div>
        </div>
      ) : null}

      {spec.type === "categories" && spec.style === "row" ? (
        <Rail gap={20}>
          {spec.items.map((c) => (
            <CategoryCircle
              key={c.id}
              category={c}
              onClick={() => onSelectCategory?.(c)}
            />
          ))}
        </Rail>
      ) : null}

      {spec.type === "categories" && spec.style === "card" ? (
        <Grid columns={grids.categoryCard}>
          {spec.items.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              onClick={() => onSelectCategory?.(c)}
            />
          ))}
        </Grid>
      ) : null}

      {spec.type === "categories" && spec.style === "overlay" ? (
        <Grid columns={grids.categoryOverlay}>
          {spec.items.map((c) => (
            <CategoryOverlay
              key={c.id}
              category={c}
              onClick={() => onSelectCategory?.(c)}
            />
          ))}
        </Grid>
      ) : null}

      {spec.type === "categories" && spec.style === "full" ? (
        <Grid columns={grids.categoryOverlay}>
          {spec.items.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              onClick={() => onSelectCategory?.(c)}
            />
          ))}
        </Grid>
      ) : null}

      {spec.type === "brands" ? (
        <Grid columns={grids.brand}>
          {spec.items.map((b) => (
            <BrandCard
              key={b.id}
              brand={b}
              showName={(spec.style ?? "full") === "full"}
              onClick={() => onSelectBrand?.(b)}
            />
          ))}
        </Grid>
      ) : null}

      {spec.type === "banners" && spec.style === "peek" ? (
        <Rail>
          {spec.items.map((bn) => (
            <BannerCard
              key={bn.id}
              title={bn.title}
              variant="peek"
              onClick={onSelectBanner}
            />
          ))}
        </Rail>
      ) : null}

      {spec.type === "banners" && spec.style === "full" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {spec.items.map((bn) => (
            <BannerCard
              key={bn.id}
              title={bn.title}
              variant="full"
              onClick={onSelectBanner}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
