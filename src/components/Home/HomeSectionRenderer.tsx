import { CSSProperties, FC } from "react";

import BrandCard from "@/components/Cards/BrandCard";
import CategoryCard from "@/components/Cards/CategoryCard";
import CategoryFullImageCard from "@/components/Cards/CategoryFullImageCard";
import CategoryOverlayCard from "@/components/Cards/CategoryOverlayCard";
import HomeBannerCard from "@/components/Cards/HomeBannerCard";
import ProductCard from "@/components/Cards/ProductCard";
import CardSlider from "@/components/Home/CardSlider";
import HomeSectionHeader from "@/components/Home/HomeSectionHeader";
import HomeHeroSlider from "@/components/Home/HomeHeroSlider";
import { HomeSection } from "@/types/ApiResponse";

type BgType = "none" | "color" | "image";

/** Fluid card grids, matching the sandbox `grids` tokens. */
const GRID = {
  product: "grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  categoryCard: "grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))]",
  categoryOverlay: "grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]",
  categoryFull: "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  brand: "grid-cols-[repeat(auto-fill,minmax(110px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))]",
} as const;

interface HomeSectionRendererProps {
  section: HomeSection;
}

/**
 * Renders one home-builder section by type × style × config, wired to the live
 * `/home-layout` payload. Pixel + logic source: `HomeSection` in the
 * `src/redesign/` sandbox. Horizontal rails and banners are Swiper sliders.
 */
const HomeSectionRenderer: FC<HomeSectionRendererProps> = ({ section }) => {
  const { type, title, style, config, content, background_image } = section;
  const bg = (config?.background_type as BgType) ?? "none";
  const bgColor = config?.background_color as string | undefined;
  const isImageBg = bg === "image" && Boolean(background_image);
  const isColorBg = bg === "color" && Boolean(bgColor);
  // The section-detail endpoint returns only rows (no type/style/title), so the
  // "see all" link carries them for the detail page to render the right cards.
  const seeAllHref =
    `/home/sections/${section.id}?type=${type}` +
    `&style=${encodeURIComponent(style ?? "")}&title=${encodeURIComponent(title ?? "")}`;

  // Only dynamic API-supplied hex/URL values live inline (Tailwind can't tokenise them).
  const panelStyle: CSSProperties = isImageBg
    ? { backgroundImage: `url(${background_image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : isColorBg
      ? { backgroundColor: bgColor }
      : {};

  const padded = isImageBg || isColorBg;

  const wrap = (children: React.ReactNode) => (
    <div
      className={`relative overflow-hidden ${padded ? "rounded-[20px] p-5 sm:p-6" : ""} ${
        isColorBg ? "shadow-[0_2px_12px_-8px_rgba(28,26,23,0.1)]" : ""
      }`}
      style={panelStyle}
    >
      {isImageBg ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );

  const products = content?.products ?? [];
  const categories = content?.categories ?? [];
  const brands = content?.brands ?? [];
  const items = content?.items ?? [];

  if (
    (type === "products" && !products.length) ||
    (type === "categories" && !categories.length) ||
    (type === "brands" && !brands.length) ||
    ((type === "banners" || type === "hero") && !items.length)
  ) {
    return null;
  }

  return (
    <section className="mb-9">
      {title ? (
        <HomeSectionHeader
          title={title}
          seeAllHref={type === "banners" || type === "hero" ? undefined : seeAllHref}
        />
      ) : null}

      {type === "products"
        ? wrap(
            config?.orientation === "horizontal" ? (
              <CardSlider
                slideClassName="w-[200px]"
                slides={products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              />
            ) : (
              <div className={`grid gap-4 ${GRID.product}`}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ),
          )
        : null}

      {type === "categories"
        ? wrap(
            style === "overlay" ? (
              <div className={`grid gap-4 ${GRID.categoryOverlay}`}>
                {categories.map((c) => (
                  <CategoryOverlayCard key={c.id} category={c} />
                ))}
              </div>
            ) : style === "card" ? (
              <div className={`grid gap-4 ${GRID.categoryCard}`}>
                {categories.map((c) => (
                  <CategoryCard key={c.id} category={c} />
                ))}
              </div>
            ) : (
              <div className={`grid gap-4 ${GRID.categoryFull}`}>
                {categories.map((c) => (
                  <CategoryFullImageCard key={c.id} category={c} />
                ))}
              </div>
            ),
          )
        : null}

      {type === "brands"
        ? wrap(
            <div className={`grid gap-4 ${GRID.brand}`}>
              {brands.map((b) => (
                <BrandCard key={b.id} brand={b} showName={style === "image_title"} />
              ))}
            </div>,
          )
        : null}

      {type === "banners" ? (
        <CardSlider
          autoplay
          loop
          pagination
          slidesPerView={style === "peek" ? 1.08 : 1}
          slides={items.map((bn) => (
            <HomeBannerCard key={bn.id} item={bn} variant={style === "peek" ? "peek" : "full"} />
          ))}
        />
      ) : null}

      {type === "hero" ? <HomeHeroSlider items={items} /> : null}
    </section>
  );
};

export default HomeSectionRenderer;
