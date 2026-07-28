import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import {
  Button,
  Checkbox,
  EmptyState,
  Input,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Sheet,
  useDisclosure,
} from "@/components/ui";
import BrandCard from "@/components/Cards/BrandCard";
import CategoryCard from "@/components/Cards/CategoryCard";
import CategoryFullImageCard from "@/components/Cards/CategoryFullImageCard";
import CategoryHorizontalCard from "@/components/Cards/CategoryHorizontalCard";
import CategoryOverlayCard from "@/components/Cards/CategoryOverlayCard";
import HomeBannerCard from "@/components/Cards/HomeBannerCard";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import PageHead from "@/SEO/PageHead";
import { getHomeLayoutSection } from "@/routes/api";
import {
  Brand,
  Category,
  HomeBannerItem,
  HomeSectionType,
  Product,
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

type Sort = "relevance" | "price_asc" | "price_desc" | "rating" | "discount";

const productPrice = (p: Product) => {
  const v = p.variants?.find((x) => x.is_default) || p.variants?.[0];
  const price = Number(v?.price) || 0;
  const special = Number(v?.special_price) || 0;
  return special > 0 && special < price ? special : price;
};

const productDiscount = (p: Product) => {
  const v = p.variants?.find((x) => x.is_default) || p.variants?.[0];
  const price = Number(v?.price) || 0;
  const special = Number(v?.special_price) || 0;
  return special > 0 && special < price ? Math.round(((price - special) / price) * 100) : 0;
};

/**
 * "See all" page for a home-builder section — paginated content of
 * `/home-layout/sections/{id}` with infinite scroll. Product sections add a
 * client-side filter sidebar (brand / price / rating) and sort over the
 * loaded items (the section endpoint itself takes only page/per_page).
 */
const HomeSectionDetailView: FC<{ data: HomeSectionDetailData }> = ({ data }) => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [items, setItems] = useState<Row[]>(data.items);
  const [page, setPage] = useState(data.currentPage);
  const [lastPage, setLastPage] = useState(data.lastPage);
  const [loading, setLoading] = useState(false);

  const isProducts = data.type === "products";

  const [sort, setSort] = useState<Sort>("relevance");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState("0");

  const loadMore = useCallback(async () => {
    if (loading || page >= lastPage) return;
    setLoading(true);
    const res = await getHomeLayoutSection({ sectionId: data.sectionId, page: page + 1, per_page: 20 });
    if (res.success && res.data) {
      setItems((prev) => [...prev, ...((res.data?.data as unknown as Row[]) ?? [])]);
      setPage(res.data.current_page);
      setLastPage(res.data.last_page ?? lastPage);
    }
    setLoading(false);
  }, [loading, page, lastPage, data.sectionId]);

  const brandOptions = useMemo(() => {
    if (!isProducts) return [];
    return Array.from(
      new Set((items as Product[]).map((p) => p.brand_name).filter(Boolean) as string[]),
    ).sort();
  }, [items, isProducts]);

  const visibleProducts = useMemo(() => {
    if (!isProducts) return [];
    let list = [...(items as Product[])];
    if (brandFilter.length) list = list.filter((p) => p.brand_name && brandFilter.includes(p.brand_name));
    const min = Number(priceMin);
    const max = Number(priceMax);
    if (priceMin) list = list.filter((p) => productPrice(p) >= min);
    if (priceMax) list = list.filter((p) => productPrice(p) <= max);
    const rt = Number(minRating);
    if (rt > 0) list = list.filter((p) => Number(p.ratings) >= rt);

    switch (sort) {
      case "price_asc":
        return list.sort((a, b) => productPrice(a) - productPrice(b));
      case "price_desc":
        return list.sort((a, b) => productPrice(b) - productPrice(a));
      case "rating":
        return list.sort((a, b) => Number(b.ratings) - Number(a.ratings));
      case "discount":
        return list.sort((a, b) => productDiscount(b) - productDiscount(a));
      default:
        return list;
    }
  }, [items, isProducts, brandFilter, priceMin, priceMax, minRating, sort]);

  const clearFilters = () => {
    setBrandFilter([]);
    setPriceMin("");
    setPriceMax("");
    setMinRating("0");
  };

  const activeFilterCount =
    brandFilter.length + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (minRating !== "0" ? 1 : 0);

  const FilterControls = (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2.5 text-sm font-bold">{t("filters.brand", "Brand")}</h3>
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {brandOptions.length === 0 ? (
            <span className="text-xs text-default-400">{t("filters.none", "No options yet")}</span>
          ) : (
            brandOptions.map((b) => (
              <Checkbox
                key={b}
                isSelected={brandFilter.includes(b)}
                size="sm"
                onValueChange={(on) =>
                  setBrandFilter((prev) => (on ? [...prev, b] : prev.filter((x) => x !== b)))
                }
              >
                <span className="text-sm">{b}</span>
              </Checkbox>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-sm font-bold">{t("filters.price", "Price")}</h3>
        <div className="flex items-center gap-2">
          <Input
            aria-label={t("filters.min", "Min")}
            placeholder={t("filters.min", "Min")}
            size="sm"
            type="number"
            value={priceMin}
            onValueChange={setPriceMin}
          />
          <span className="text-default-400">–</span>
          <Input
            aria-label={t("filters.max", "Max")}
            placeholder={t("filters.max", "Max")}
            size="sm"
            type="number"
            value={priceMax}
            onValueChange={setPriceMax}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-sm font-bold">{t("filters.rating", "Rating")}</h3>
        <RadioGroup size="sm" value={minRating} onValueChange={setMinRating}>
          <Radio value="0">{t("filters.any", "Any")}</Radio>
          <Radio value="4">4★ &amp; up</Radio>
          <Radio value="3">3★ &amp; up</Radio>
        </RadioGroup>
      </div>

      {activeFilterCount > 0 ? (
        <Button size="sm" variant="flat" onPress={clearFilters}>
          {t("filters.clear", "Clear all")}
        </Button>
      ) : null}
    </div>
  );

  const renderCards = () => {
    if (isProducts) {
      return (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {visibleProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      );
    }
    if (data.type === "brands") {
      return (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(110px,1fr))]">
          {(items as Brand[]).map((b) => (
            <BrandCard key={b.id} brand={b} showName={data.style === "image_title"} />
          ))}
        </div>
      );
    }
    if (data.type === "categories") {
      const cats = items as Category[];
      if (data.style === "overlay")
        return (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {cats.map((c) => (
              <CategoryOverlayCard key={c.id} category={c} />
            ))}
          </div>
        );
      if (data.style === "card")
        return (
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
            {cats.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        );
      if (data.style === "full")
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
      <PageHead pageTitle={data.title || t("see_all")} />

      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{data.title}</h1>
        {isProducts ? (
          <div className="flex items-center gap-2">
            <Button
              className="min-[1024px]:hidden"
              size="sm"
              startContent={<Icon icon="solar:filter-linear" className="text-base" />}
              variant="flat"
              onPress={onOpen}
            >
              {t("filters.title", "Filters")}
              {activeFilterCount ? ` (${activeFilterCount})` : ""}
            </Button>
            <Select
              aria-label={t("filters.sort", "Sort")}
              className="w-44"
              selectedKeys={[sort]}
              size="sm"
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              <SelectItem key="relevance">{t("sort.relevance", "Relevance")}</SelectItem>
              <SelectItem key="price_asc">{t("sort.price_asc", "Price: Low to High")}</SelectItem>
              <SelectItem key="price_desc">{t("sort.price_desc", "Price: High to Low")}</SelectItem>
              <SelectItem key="rating">{t("sort.rating", "Top rated")}</SelectItem>
              <SelectItem key="discount">{t("sort.discount", "Biggest discount")}</SelectItem>
            </Select>
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={null} title={t("home.empty.title", "Nothing here yet")} />
      ) : (
        <div className="flex gap-6">
          {isProducts ? (
            <aside className="hidden w-60 shrink-0 min-[1024px]:block">
              <div className="sticky top-24 rounded-large border border-divider bg-content1 p-4">
                {FilterControls}
              </div>
            </aside>
          ) : null}

          <div className="min-w-0 flex-1">
            {renderCards()}
            <InfiniteSentinel hasMore={page < lastPage} isLoading={loading} onLoadMore={loadMore} />
            {loading ? (
              <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {isProducts ? (
        <Sheet isOpen={isOpen} title={t("filters.title", "Filters")} onOpenChange={(o) => !o && onClose()}>
          <div className="pb-4">{FilterControls}</div>
        </Sheet>
      ) : null}
    </div>
  );
};

export default HomeSectionDetailView;
