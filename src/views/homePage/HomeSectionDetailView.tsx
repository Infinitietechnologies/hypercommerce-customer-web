import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui";
import BrandCard from "@/components/Cards/BrandCard";
import CategoryCard from "@/components/Cards/CategoryCard";
import CategoryFullImageCard from "@/components/Cards/CategoryFullImageCard";
import CategoryHorizontalCard from "@/components/Cards/CategoryHorizontalCard";
import CategoryOverlayCard from "@/components/Cards/CategoryOverlayCard";
import HomeBannerCard from "@/components/Cards/HomeBannerCard";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import ProductFilter, {
  SelectedFilters,
} from "@/components/Products/ProductFilter";
import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import PageHead from "@/SEO/PageHead";
import { getHomeLayoutSection } from "@/routes/api";
import {
  Brand,
  Category,
  HomeBannerItem,
  HomeSectionType,
  Product,
  SidebarFilters,
} from "@/types/ApiResponse";

type Row = Product | Category | Brand | HomeBannerItem;

export interface HomeSectionDetailData {
  sectionId: number;
  type: HomeSectionType;
  style: string;
  title: string;
  items: Row[];
  currentPage: number;
  lastPage: number;
}

const EMPTY_FILTERS: SelectedFilters = {
  categories: [],
  brands: [],
  colors: [],
  attribute_values: [],
  sort: "relevance",
  search: "",
};

const productPrice = (p: Product) => {
  const v = p.variants?.find((x) => x.is_default) || p.variants?.[0];
  const price = Number(v?.price) || 0;
  const special = Number(v?.special_price) || 0;
  return special > 0 && special < price ? special : price;
};

/**
 * "See all" page for a home-builder section — paginated content of
 * `/home-layout/sections/{id}` with infinite scroll. Product sections reuse the
 * shared `ProductFilter` (same rail/drawer/sort as the listing pages), applied
 * client-side over the loaded rows since the section endpoint takes only
 * page/per_page.
 */
const HomeSectionDetailView: FC<{ data?: HomeSectionDetailData }> = ({ data }) => {
  const { t } = useTranslation();
  const { query, isReady } = useRouter();

  // A static export ships no SSR props, so fall back to the URL and fetch page 1 on mount.
  const sectionId = data?.sectionId ?? Number(query.id);
  const type = data?.type ?? ((query.type as HomeSectionType) || "products");
  const style = data?.style ?? ((query.style as string) || "");
  const title = data?.title ?? ((query.title as string) || "");

  const [items, setItems] = useState<Row[]>(data?.items ?? []);
  const [page, setPage] = useState(data?.currentPage ?? 1);
  const [lastPage, setLastPage] = useState(data?.lastPage ?? 1);
  const [loading, setLoading] = useState(!data);

  const isProducts = type === "products";

  const [filters, setFilters] = useState<SelectedFilters>(EMPTY_FILTERS);

  useEffect(() => {
    if (data || !isReady) return;
    let cancelled = false;

    (async () => {
      const res = Number.isFinite(sectionId)
        ? await getHomeLayoutSection({ sectionId, page: 1, per_page: 20 })
        : null;

      if (cancelled) return;
      if (res?.success && res.data) {
        setItems((res.data.data as unknown as Row[]) ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [data, isReady, sectionId]);

  const loadMore = useCallback(async () => {
    if (loading || page >= lastPage) return;
    setLoading(true);
    const res = await getHomeLayoutSection({ sectionId, page: page + 1, per_page: 20 });
    if (res.success && res.data) {
      setItems((prev) => [...prev, ...((res.data?.data as unknown as Row[]) ?? [])]);
      setPage(res.data.current_page);
      setLastPage(res.data.last_page ?? lastPage);
    }
    setLoading(false);
  }, [loading, page, lastPage, sectionId]);

  // Client-side apply — the section endpoint can't filter, so filter/sort the
  // loaded rows by category / brand / search / sort from the shared filter.
  const visibleProducts = useMemo(() => {
    if (!isProducts) return [];
    let list = [...(items as Product[])];
    if (filters.categories.length) list = list.filter((p) => filters.categories.includes(p.category));
    if (filters.brands.length) list = list.filter((p) => filters.brands.includes(p.brand));
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((p) => p.title?.toLowerCase().includes(q));
    }
    switch (filters.sort) {
      case "price_asc":
        return list.sort((a, b) => productPrice(a) - productPrice(b));
      case "price_desc":
        return list.sort((a, b) => productPrice(b) - productPrice(a));
      case "avg_rated":
        return list.sort((a, b) => Number(b.ratings) - Number(a.ratings));
      default:
        return list;
    }
  }, [items, isProducts, filters]);

  // The section endpoint has no /sidebar-filters scope, so derive the facets
  // (categories + brands present in the loaded rows) and feed them to the shared
  // filter — otherwise it would fetch an unscoped, empty facet set.
  const derivedFacets = useMemo<SidebarFilters | null>(() => {
    if (!isProducts) return null;
    const cats = new Map<string, string>();
    const brands = new Map<string, string>();
    (items as Product[]).forEach((p) => {
      if (p.category) cats.set(p.category, p.category_name || p.category);
      if (p.brand) brands.set(p.brand, p.brand_name || p.brand);
    });
    return {
      categories: [...cats].map(([slug, title]) => ({ slug, title, enabled: true })),
      brands: [...brands].map(([slug, title]) => ({ slug, title, enabled: true })),
      attributes: [],
      categories_count: cats.size,
      brands_count: brands.size,
      attributes_count: 0,
      // Only slug/title/enabled are read by the filter; the full Category/Brand
      // shapes aren't available from a section row, so widen through unknown.
    } as unknown as SidebarFilters;
  }, [items, isProducts]);

  const applyFilters = useCallback((next: SelectedFilters) => setFilters(next), []);

  const renderCards = () => {
    if (isProducts) {
      return (
        <div className="grid gap-2.5 sm:gap-4 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
          {visibleProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      );
    }
    if (type === "brands") {
      return (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(110px,1fr))]">
          {(items as Brand[]).map((b) => (
            <BrandCard key={b.id} brand={b} showName={style === "image_title"} />
          ))}
        </div>
      );
    }
    if (type === "categories") {
      const cats = items as Category[];
      if (style === "overlay")
        return (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {cats.map((c) => (
              <CategoryOverlayCard key={c.id} category={c} />
            ))}
          </div>
        );
      if (style === "card")
        return (
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
            {cats.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        );
      if (style === "full")
        return (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {cats.map((c) => (
              <CategoryHorizontalCard key={c.id} category={c} />
            ))}
          </div>
        );
      return (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {cats.map((c) => (
            <CategoryFullImageCard key={c.id} category={c} />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {(items as HomeBannerItem[]).map((bn) => (
          <HomeBannerCard key={bn.id} item={bn} variant="full" />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-site mx-auto px-4 sm:px-6 py-6">
      <PageHead pageTitle={title || t("see_all")} />

      <h1 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">{title}</h1>

      {items.length === 0 && !loading ? (
        <EmptyState icon={null} title={t("home.empty.title", "Nothing here yet")} />
      ) : (
        <div className="flex w-full gap-4 flex-col md:flex-row">
          {isProducts ? (
            <div className="flex-none">
              <ProductFilter
                selectedFilters={filters}
                setSelectedFilters={setFilters}
                onApplyFilters={applyFilters}
                totalProducts={visibleProducts.length}
                facets={derivedFacets}
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1 pb-28 md:pb-0">
            {renderCards()}
            <InfiniteSentinel hasMore={page < lastPage} isLoading={loading} onLoadMore={loadMore} />
            {loading ? (
              <div className="mt-3 grid gap-2.5 sm:gap-4 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSectionDetailView;
