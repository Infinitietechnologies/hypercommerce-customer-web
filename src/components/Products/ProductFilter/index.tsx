import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Select,
  SelectItem,
  Divider,
  Input,
  ScrollShadow,
} from "@/components/ui";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import BrandSection from "./BrandSection";
import CategorySection from "./CategorySection";
import ListingFilters from "./ListingFilters";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { getSidebarFilters } from "@/routes/api";
import { SidebarFilters } from "@/types/ApiResponse";
import AttributeSection from "./AttributeSection";

export interface SelectedFilters {
  categories: string[];
  brands: string[];
  colors: string[];
  attribute_values: string[];
  sort: SortOption;
  search?: string;
}

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "avg_rated"
  | "best_seller"
  | "featured";

interface ProductFilterProps {
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
  onApplyFilters: (filters: SelectedFilters) => void;
  totalProducts?: number;
  searchComponent?: boolean;
  sidebarType?: string;
  sidebarValue?: string;
  hideBrandFilter?: boolean;
  hideCategoryFilter?: boolean;
  /** When provided, use these facets directly instead of fetching from the API
   *  (e.g. the home-section "see all", whose facets are derived from its rows). */
  facets?: SidebarFilters | null;
}

const ProductFilter: FC<ProductFilterProps> = ({
  selectedFilters,
  onApplyFilters,
  searchComponent = false,
  sidebarType,
  sidebarValue,
  hideBrandFilter = false,
  hideCategoryFilter = false,
  facets = null,
}) => {
  const [searchInput, setSearchInput] = useState(selectedFilters?.search || "");
  const [pendingFilters, setPendingFilters] =
    useState<SelectedFilters>(selectedFilters);
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const { t } = useTranslation();

  const [sidebarData, setSidebarData] = useState<SidebarFilters | null>(null);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);

  // Caller-supplied facets (section see-all) win over the fetched ones.
  const effectiveSidebar = facets ?? sidebarData;

  const selectedFiltersRef = useRef(selectedFilters);
  const onApplyFiltersRef = useRef(onApplyFilters);
  const isFirstRender = useRef(true);
  const lastAppliedSearch = useRef(selectedFilters?.search || "");

  // Keep refs updated
  useEffect(() => {
    selectedFiltersRef.current = selectedFilters;
    onApplyFiltersRef.current = onApplyFilters;
  }, [selectedFilters, onApplyFilters]);

  // Sync pending filters when selectedFilters changes externally (e.g., route change, browser back)
  useEffect(() => {
    setPendingFilters(selectedFilters);
  }, [selectedFilters]);

  // Ref to track the last fetched key for sidebar filters
  const lastFetchedRef = useRef("");

  const fetchSidebarFilters = useCallback(
    async (filters: SelectedFilters) => {
      // Include sidebarValue so switching subcategory always triggers a fresh fetch
      const currentKey = `${sidebarValue || ""}-${filters.categories.join(",")}-${filters.brands.join(",")}-${filters.attribute_values.join(",")}`;
      if (lastFetchedRef.current === currentKey) return;
      lastFetchedRef.current = currentKey;

      setIsSidebarLoading(true);
      try {
        const res = await getSidebarFilters({
          categories: filters.categories.join(","),
          brands: filters.brands.join(","),
          attribute_values: filters.attribute_values.join(","),
          ...(sidebarType ? { type: sidebarType } : {}),
          ...(sidebarValue ? { value: sidebarValue } : {}),
        });

        if (res.success && res.data) {
          setSidebarData(res.data);
        }
      } catch (error) {
        console.error("Error fetching sidebar filters:", error);
      } finally {
        setIsSidebarLoading(false);
      }
    },
    [sidebarType, sidebarValue],
  );

  // Fetch sidebar data when filters change (skipped when facets are supplied).
  useEffect(() => {
    if (facets) return;
    fetchSidebarFilters(pendingFilters);
  }, [pendingFilters, fetchSidebarFilters, facets]);

  // Keep the latest pending filters reachable from the imperative refetch below.
  const pendingFiltersRef = useRef(pendingFilters);
  useEffect(() => {
    pendingFiltersRef.current = pendingFilters;
  }, [pendingFilters]);

  // Sidebar filter counts / enabled flags are market-scoped, but the filter key
  // doesn't change on a market switch — so bust the dedupe guard and refetch.
  // Triggered by `onLocationChange` clicking the hidden button below.
  const handleSidebarRefetch = useCallback(() => {
    lastFetchedRef.current = "";
    fetchSidebarFilters(pendingFiltersRef.current);
  }, [fetchSidebarFilters]);

  // Prune pending filters if they become disabled in the new sidebar data
  useEffect(() => {
    if (!effectiveSidebar) return;

    const newCategories = pendingFilters.categories.filter((slug) => {
      const cat = effectiveSidebar.categories.find((c) => c.slug === slug);
      if (cat && cat.enabled === false) return false;
      return true;
    });

    const newBrands = pendingFilters.brands.filter((slug) => {
      const br = effectiveSidebar.brands.find((b) => b.slug === slug);
      if (br && br.enabled === false) return false;
      return true;
    });

    const newAttrValues = pendingFilters.attribute_values.filter((id) => {
      const valId = Number(id);
      const attributeValue = effectiveSidebar.attributes
        .flatMap((attr) => attr.values)
        .find((v) => v.id === valId);
      if (attributeValue && attributeValue.enabled === false) return false;
      return true;
    });

    const isChanged =
      newCategories.length !== pendingFilters.categories.length ||
      newBrands.length !== pendingFilters.brands.length ||
      newAttrValues.length !== pendingFilters.attribute_values.length;

    if (isChanged) {
      const prunedKey = `${newCategories.join(",")}-${newBrands.join(",")}-${newAttrValues.join(",")}`;
      lastFetchedRef.current = prunedKey;

      setPendingFilters((prev) => {
        // Double-check to avoid unnecessary state updates
        if (
          prev.categories.length === newCategories.length &&
          prev.brands.length === newBrands.length &&
          prev.attribute_values.length === newAttrValues.length
        ) {
          return prev;
        }
        return {
          ...prev,
          categories: newCategories,
          brands: newBrands,
          attribute_values: newAttrValues,
        };
      });
    }
  }, [
    effectiveSidebar,
    pendingFilters.categories,
    pendingFilters.brands,
    pendingFilters.attribute_values,
  ]);

  const handleSearch = useCallback((value: string) => {
    const updatedFilters = { ...selectedFiltersRef.current, search: value };
    lastAppliedSearch.current = value;
    onApplyFiltersRef.current(updatedFilters);
  }, []);

  // Handle debounced search changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const trimmedSearch = debouncedSearch.trim();

    // Only trigger if the debounced search is different from what was last applied
    if (trimmedSearch !== lastAppliedSearch.current) {
      handleSearch(trimmedSearch);
    }
  }, [debouncedSearch, handleSearch]);

  // Sync searchInput when selectedFilters.search changes externally (e.g., browser back/forward)
  useEffect(() => {
    const externalSearch = selectedFilters?.search || "";

    // Only update if it's different from current input AND different from what we last applied
    // This prevents the circular update issue
    if (
      externalSearch !== searchInput &&
      externalSearch === lastAppliedSearch.current
    ) {
      setTimeout(() => {
        setSearchInput(externalSearch);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters?.search]);

  const sortOptions = [
    {
      key: "relevance",
      label: t("productFilter.sort.relevance"),
      icon: "solar:star-linear",
    },
    {
      key: "price_asc",
      label: t("productFilter.sort.priceLowToHigh"),
      icon: "solar:alt-arrow-up-linear",
    },
    {
      key: "price_desc",
      label: t("productFilter.sort.priceHighToLow"),
      icon: "solar:alt-arrow-down-linear",
    },
    {
      key: "avg_rated",
      label: t("productFilter.sort.highestRated"),
      icon: "solar:like-linear",
    },
    {
      key: "best_seller",
      label: t("productFilter.sort.bestSeller"),
      icon: "solar:fire-linear",
    },
    {
      key: "featured",
      label: t("productFilter.sort.featured"),
      icon: "solar:magic-stars-linear",
    },
  ];

  const getActiveFiltersCount = () => {
    const categoriesCount = pendingFilters?.categories?.length || 0;
    const brandsCount = pendingFilters?.brands?.length || 0;
    const colorsCount = pendingFilters?.colors?.length || 0;
    const attributesCount = pendingFilters?.attribute_values?.length || 0;

    return categoriesCount + brandsCount + colorsCount + attributesCount;
  };

  const clearAllFilters = () => {
    const newFilters: SelectedFilters = {
      categories: [],
      brands: [],
      colors: [],
      attribute_values: [],
      sort: "relevance",
      search: "",
    };
    setSearchInput("");
    lastAppliedSearch.current = "";
    setPendingFilters(newFilters);
    onApplyFilters(newFilters);
  };

  return (
    <>
      {/* Hidden hook for market/location change — refetches market-scoped
          sidebar filter counts. Clicked by `onLocationChange`. */}
      <button
        id="sidebar-filters-refetch"
        type="button"
        onClick={handleSidebarRefetch}
        className="hidden"
        aria-hidden
      />

      {/* Mobile — Myntra-style bottom bar + sort/filter sheets */}
      <ListingFilters
        activeCount={getActiveFiltersCount()}
        attributes={effectiveSidebar?.attributes || []}
        brands={effectiveSidebar?.brands || []}
        categories={effectiveSidebar?.categories || []}
        hideBrandFilter={hideBrandFilter}
        hideCategoryFilter={hideCategoryFilter}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
        sort={selectedFilters.sort}
        sortOptions={sortOptions}
        onApply={() => onApplyFilters(pendingFilters)}
        onClear={clearAllFilters}
        onSort={(key) =>
          onApplyFilters({ ...selectedFiltersRef.current, sort: key })
        }
      />

      {/* Desktop Filter Panel */}
      <div className="w-64 min-w-64 hidden md:block">
        <Card shadow="sm" classNames={{ body: "px-3 py-2" }}>
          <CardHeader className="pb-2">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="solar:filter-linear" className="text-base" />
                <h3 className="text-base font-semibold">
                  {t("productFilter.filters")}
                </h3>
              </div>
            </div>
          </CardHeader>

          <CardBody className="flex flex-col gap-4 border-t-2 border-gray-100 dark:border-default-100  pt-4">
            {/* Sort Section */}
            <div className="space-y-2">
              {searchComponent && (
                <Input
                  size="sm"
                  placeholder={t("search") || "Search products..."}
                  value={searchInput}
                  onValueChange={setSearchInput}
                  startContent={<Icon icon="solar:magnifer-linear" className="text-base text-default-400" />}
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-9",
                  }}
                  className="mb-3"
                />
              )}

              <div className="flex items-center gap-2">
                <Icon icon="solar:sort-vertical-linear" className="text-base" />
                <h4 className="text-sm font-medium">
                  {t("productFilter.sortBy")}
                </h4>
              </div>

              <Select
                aria-label="select-sort"
                size="sm"
                selectedKeys={[selectedFilters.sort]}
                onSelectionChange={(keys) => {
                  const newSort = Array.from(keys)[0] as SortOption;
                  if (newSort) {
                    const updatedFilters = { ...selectedFiltersRef.current, sort: newSort };
                    onApplyFilters(updatedFilters);
                  }
                }}
                className="w-full"
                classNames={{ trigger: "h-8 min-h-unit-8" }}
              >
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.key}
                    startContent={<Icon icon={option.icon} className="text-base" />}
                    textValue={option.label}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Divider />

            {/* Filter Sections */}
            <ScrollShadow className="flex flex-col gap-4 overflow-y-auto max-h-96">
              {!hideCategoryFilter && (
                <section id="product-filter-category-section">
                  <CategorySection
                    categories={effectiveSidebar?.categories || []}
                    isLoading={isSidebarLoading}
                    selectedFilters={pendingFilters}
                    setSelectedFilters={setPendingFilters}
                  />
                </section>
              )}

              {!hideBrandFilter && (
                <section id="product-filter-brand-section">
                  <BrandSection
                    brands={effectiveSidebar?.brands || []}
                    isLoading={isSidebarLoading}
                    selectedFilters={pendingFilters}
                    setSelectedFilters={setPendingFilters}
                  />
                </section>
              )}

              <section id="product-filter-attribute-section">
                <AttributeSection
                  attributes={effectiveSidebar?.attributes || []}
                  selectedFilters={pendingFilters}
                  setSelectedFilters={setPendingFilters}
                />
              </section>
            </ScrollShadow>
          </CardBody>

          <CardFooter className="flex gap-2 pt-2">
            <Button
              className="flex-1 text-xs"
              color="secondary"
              variant="bordered"
              size="sm"
              onPress={clearAllFilters}
              isDisabled={getActiveFiltersCount() === 0}
            >
              {t("productFilter.clearAll")}
            </Button>
            <Button
              className="flex-1 text-xs"
              color="primary"
              size="sm"
              onPress={() => onApplyFilters(pendingFilters)}
            >
              {t("productFilter.applyFilters")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default ProductFilter;
