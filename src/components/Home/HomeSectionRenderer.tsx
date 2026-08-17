import { CSSProperties, FC } from "react";

import BrandCard from "@/components/Cards/BrandCard";
import CategoryCard from "@/components/Cards/CategoryCard";
import CategoryFullImageCard from "@/components/Cards/CategoryFullImageCard";
import CategoryHorizontalCard from "@/components/Cards/CategoryHorizontalCard";
import CategoryOverlayCard from "@/components/Cards/CategoryOverlayCard";
import ProductCard from "@/components/Cards/ProductCard";
import CardSlider from "@/components/Home/CardSlider";
import HomeSectionHeader from "@/components/Home/HomeSectionHeader";
import HomeHeroSlider from "@/components/Home/HomeHeroSlider";
import HomePlayImageGrid from "@/components/Home/HomePlayImageGrid";
import {
  PRODUCT_CARD_GRID_CLASSES,
  resolveProductCardStyle,
} from "@/config/productCard";
import { HomeSection } from "@/types/ApiResponse";

type BgType = "none" | "color" | "image";

/** Fluid card grids — smaller minimums so cards stay compact. */
const GRID = {
  categoryDefault:
    "grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]",
  categoryCard:
    "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]",
  categoryOverlay:
    "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  categoryFull:
    "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]",
  brand: "grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(110px,1fr))]",
} as const;

interface HomeSectionRendererProps {
  section: HomeSection;
}

/**
 * Renders one home-builder section by type × style × config, wired to the live
 * `/home-layout` payload. Pixel + logic source: `HomeSection` in the
 * `src/redesign/` sandbox. Horizontal rails use Swiper sliders.
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
    ? {
        backgroundImage: `url(${background_image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : isColorBg
      ? { backgroundColor: bgColor }
      : {};

  const padded = isImageBg || isColorBg;

  const wrap = (children: React.ReactNode) => (
    <div
      className={`relative overflow-hidden ${padded ? "rounded-[18px] p-3.5 sm:rounded-[20px] sm:p-6" : ""} ${
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
  const productCardStyle = resolveProductCardStyle(style);
  const productSlider =
    productCardStyle === "compact"
      ? {
          slidesPerView: 1.25,
          breakpoints: {
            430: { slidesPerView: 1.7, spaceBetween: 12 },
            640: { slidesPerView: 2.4, spaceBetween: 14 },
            1024: { slidesPerView: 3.2, spaceBetween: 16 },
            1280: { slidesPerView: 4, spaceBetween: 16 },
          },
        }
      : productCardStyle === "showcase"
        ? {
            slidesPerView: 1.15,
            breakpoints: {
              430: { slidesPerView: 1.5, spaceBetween: 12 },
              640: { slidesPerView: 2.1, spaceBetween: 14 },
              1024: { slidesPerView: 2.8, spaceBetween: 16 },
              1280: { slidesPerView: 3.4, spaceBetween: 16 },
            },
          }
        : productCardStyle === "minimal"
          ? {
              slidesPerView: 1.8,
              breakpoints: {
                430: { slidesPerView: 2.3, spaceBetween: 10 },
                640: { slidesPerView: 3.3, spaceBetween: 14 },
                1024: { slidesPerView: 4, spaceBetween: 16 },
                1280: { slidesPerView: 4.8, spaceBetween: 16 },
              },
            }
          : {
              slidesPerView: 1.35,
              breakpoints: {
                430: { slidesPerView: 1.8, spaceBetween: 12 },
                640: { slidesPerView: 2.5, spaceBetween: 14 },
                1024: { slidesPerView: 3.3, spaceBetween: 16 },
                1280: { slidesPerView: 4.1, spaceBetween: 16 },
              },
            };
  const categories = content?.categories ?? [];
  const brands = content?.brands ?? [];
  const items = content?.items ?? [];

  if (
    (type === "products" && !products.length) ||
    (type === "categories" && !categories.length) ||
    (type === "brands" && !brands.length) ||
    (type === "hero" && !items.length)
  ) {
    return null;
  }

  return (
    <section className="mb-6 sm:mb-9 rd-fade">
      {title && title.trim() ? (
        <HomeSectionHeader
          title={title}
          seeAllHref={type === "hero" || type === "play_image" ? undefined : seeAllHref}
        />
      ) : null}

      {type === "products"
        ? wrap(
            config?.orientation === "horizontal" ? (
              <CardSlider
                slidesPerView={productSlider.slidesPerView}
                spaceBetween={10}
                breakpoints={productSlider.breakpoints}
                slides={products.map((p) => (
                  <ProductCard
                    key={p.id}
                    cardStyle={productCardStyle}
                    product={p}
                  />
                ))}
              />
            ) : (
              <div
                className={`grid gap-2.5 sm:gap-4 rd-stagger ${PRODUCT_CARD_GRID_CLASSES[productCardStyle]}`}
              >
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    cardStyle={productCardStyle}
                    product={p}
                  />
                ))}
              </div>
            ),
          )
        : null}

      {type === "categories"
        ? wrap(
            style === "overlay" ? (
              <div className={`grid gap-3 rd-stagger ${GRID.categoryOverlay}`}>
                {categories.map((c) => (
                  <CategoryOverlayCard key={c.id} category={c} />
                ))}
              </div>
            ) : style === "card" ? (
              <div className={`grid gap-3 rd-stagger ${GRID.categoryCard}`}>
                {categories.map((c) => (
                  <CategoryCard key={c.id} category={c} />
                ))}
              </div>
            ) : style === "full" ? (
              <div className={`grid gap-3 rd-stagger ${GRID.categoryFull}`}>
                {categories.map((c) => (
                  <CategoryHorizontalCard key={c.id} category={c} />
                ))}
              </div>
            ) : (
              <div className={`grid gap-3 rd-stagger ${GRID.categoryDefault}`}>
                {categories.map((c) => (
                  <CategoryFullImageCard key={c.id} category={c} />
                ))}
              </div>
            ),
          )
        : null}

      {type === "brands"
        ? wrap(
            <div className={`grid gap-2.5 sm:gap-4 rd-stagger ${GRID.brand}`}>
              {brands.map((b) => (
                <BrandCard
                  key={b.id}
                  brand={b}
                  showName={style === "image_title"}
                />
              ))}
            </div>,
          )
        : null}

      {type === "hero" ? <HomeHeroSlider items={items} /> : null}

      {type === "play_image" ? <HomePlayImageGrid section={section} /> : null}
    </section>
  );
};

export default HomeSectionRenderer;
