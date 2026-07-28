import { FC, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import { Button, Checkbox, Sheet, useDisclosure } from "@/components/ui";
import { Brand, Category, FilterAttribute } from "@/types/ApiResponse";
import { SelectedFilters, SortOption } from ".";

type FacetField = "categories" | "brands" | "attribute_values";

interface FacetGroup {
  key: string;
  title: string;
  field: FacetField;
  options: { value: string; label: string; enabled: boolean }[];
}

interface ListingFiltersProps {
  sortOptions: { key: string; label: string; icon: string }[];
  sort: SortOption;
  onSort: (key: SortOption) => void;
  categories: Category[];
  brands: Brand[];
  attributes: FilterAttribute[];
  hideCategoryFilter?: boolean;
  hideBrandFilter?: boolean;
  pendingFilters: SelectedFilters;
  setPendingFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
  onApply: () => void;
  onClear: () => void;
  activeCount: number;
}

/**
 * Mobile listing filter UX (Myntra-style): a fixed bottom bar (Sort + quick
 * facets + Filters) that opens a sort sheet and a two-pane filter sheet
 * (group rail | values). Desktop keeps the sidebar rail in ProductFilter.
 */
const ListingFilters: FC<ListingFiltersProps> = ({
  sortOptions,
  sort,
  onSort,
  categories,
  brands,
  attributes,
  hideCategoryFilter = false,
  hideBrandFilter = false,
  pendingFilters,
  setPendingFilters,
  onApply,
  onClear,
  activeCount,
}) => {
  const { t } = useTranslation();
  const sortSheet = useDisclosure();
  const filterSheet = useDisclosure();

  const groups: FacetGroup[] = useMemo(() => {
    const g: FacetGroup[] = [];
    if (!hideCategoryFilter && categories.length) {
      g.push({
        key: "category",
        title: t("category.title", "Category"),
        field: "categories",
        options: categories.map((c) => ({
          value: c.slug,
          label: c.title,
          enabled: c.enabled !== false,
        })),
      });
    }
    if (!hideBrandFilter && brands.length) {
      g.push({
        key: "brand",
        title: t("brand.title", "Brand"),
        field: "brands",
        options: brands.map((b) => ({
          value: b.slug,
          label: b.title,
          enabled: b.enabled !== false,
        })),
      });
    }
    attributes.forEach((a) =>
      g.push({
        key: a.slug,
        title: a.title,
        field: "attribute_values",
        options: a.values.map((v) => ({
          value: String(v.id),
          label: v.title,
          enabled: v.enabled,
        })),
      }),
    );
    return g;
  }, [categories, brands, attributes, hideCategoryFilter, hideBrandFilter, t]);

  const [activeGroupKey, setActiveGroupKey] = useState<string>("");
  const activeGroup = groups.find((x) => x.key === activeGroupKey) || groups[0];

  const openFilters = (groupKey?: string) => {
    setActiveGroupKey(groupKey || groups[0]?.key || "");
    filterSheet.onOpen();
  };

  const toggle = (field: FacetField, value: string) =>
    setPendingFilters((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((x) => x !== value)
        : [...prev[field], value],
    }));

  const groupSelectedCount = (grp: FacetGroup) =>
    grp.options.filter((o) => pendingFilters[grp.field].includes(o.value)).length;

  // Bottom-bar quick facets: Sort + up to two groups + Filters.
  const quick = groups.slice(0, 2);

  const barBtn =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold text-foreground";

  return (
    <>
      {/* Fixed bottom action bar (floats above the tab nav) */}
      <div className="md:hidden fixed inset-x-3 bottom-[76px] z-40 flex items-stretch rounded-full border border-divider bg-content1 shadow-lg divide-x divide-divider">
        <button className={barBtn} type="button" onClick={sortSheet.onOpen}>
          <Icon icon="solar:sort-vertical-linear" className="text-lg" />
          {t("productFilter.sort.title", "Sort")}
        </button>
        {quick.map((grp) => (
          <button key={grp.key} className={barBtn} type="button" onClick={() => openFilters(grp.key)}>
            <Icon icon="solar:tag-horizontal-linear" className="text-lg" />
            <span className="max-w-full truncate px-1">{grp.title}</span>
          </button>
        ))}
        <button className={`${barBtn} relative`} type="button" onClick={() => openFilters()}>
          <Icon icon="solar:filter-linear" className="text-lg" />
          {t("productFilter.filters", "Filters")}
          {activeCount ? (
            <span className="absolute right-2 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Sort sheet */}
      <Sheet
        isOpen={sortSheet.isOpen}
        title={<span className="text-base font-bold">{t("productFilter.sortBy", "Sort by")}</span>}
        onOpenChange={(o) => !o && sortSheet.onClose()}
      >
        <div className="flex flex-col pb-2">
          {sortOptions.map((o) => {
            const active = o.key === sort;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  onSort(o.key as SortOption);
                  sortSheet.onClose();
                }}
                className={`flex items-center gap-3 px-1 py-3 text-start text-sm border-b border-divider last:border-b-0 ${
                  active ? "font-bold text-primary-600" : "text-foreground"
                }`}
              >
                <Icon icon={o.icon} className="text-lg" />
                <span className="flex-1">{o.label}</span>
                {active ? <Icon icon="solar:check-circle-bold" className="text-lg text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* Two-pane filter sheet */}
      <Sheet
        isOpen={filterSheet.isOpen}
        classNames={{ base: "max-h-[88dvh]" }}
        title={
          <div className="flex w-full items-center justify-between">
            <span className="text-base font-bold">{t("productFilter.filters", "Filters")}</span>
            {activeCount ? (
              <button
                type="button"
                className="text-xs font-semibold text-primary-600"
                onClick={onClear}
              >
                {t("productFilter.clearAll", "Clear all")}
              </button>
            ) : null}
          </div>
        }
        footer={
          <div className="flex w-full gap-2">
            <Button className="flex-1" variant="bordered" onPress={() => filterSheet.onClose()}>
              {t("close", "Close")}
            </Button>
            <Button
              className="flex-1"
              color="primary"
              onPress={() => {
                onApply();
                filterSheet.onClose();
              }}
            >
              {t("productFilter.applyFilters", "Apply")}
            </Button>
          </div>
        }
        onOpenChange={(o) => !o && filterSheet.onClose()}
      >
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-default-400">
            {t("filters.none", "No filters available")}
          </p>
        ) : (
          <div className="flex min-h-[50dvh] gap-0">
            {/* Left group rail */}
            <div className="w-32 shrink-0 overflow-y-auto border-e border-divider bg-content2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {groups.map((grp) => {
                const active = grp.key === activeGroup?.key;
                const n = groupSelectedCount(grp);
                return (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() => setActiveGroupKey(grp.key)}
                    className={`flex w-full items-center gap-1 px-3 py-3.5 text-start text-[13px] ${
                      active
                        ? "bg-content1 font-bold text-foreground border-s-2 border-primary"
                        : "text-default-500"
                    }`}
                  >
                    <span className="flex-1 truncate">{grp.title}</span>
                    {n ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                  </button>
                );
              })}
            </div>

            {/* Right values */}
            <div className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeGroup?.options.map((o) => (
                <Checkbox
                  key={`${activeGroup.field}-${o.value}`}
                  className="w-full max-w-none py-2"
                  isDisabled={!o.enabled}
                  isSelected={pendingFilters[activeGroup.field].includes(o.value)}
                  onValueChange={() => toggle(activeGroup.field, o.value)}
                >
                  <span className="text-sm">{o.label}</span>
                </Checkbox>
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
};

export default ListingFilters;
