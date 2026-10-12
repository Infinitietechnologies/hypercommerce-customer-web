import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import { Button, Checkbox } from "@/components/ui";
import type { SharedCartPreviewItem } from "@/types/sharedCart";

interface CartItemSelectionListProps {
  items: SharedCartPreviewItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const CartItemSelectionList = ({
  items,
  selectedIds,
  onSelectionChange,
}: CartItemSelectionListProps) => {
  const { t } = useTranslation();
  const selectedSet = new Set(selectedIds);
  const selectedCount = items.filter((item) => selectedSet.has(item.id)).length;
  const allSelected = selectedCount === items.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {t("cartShare.selectedCount", { count: selectedCount, total: items.length })}
        </p>
        <Button
          variant="light"
          size="md"
          className="h-9 px-2 text-sm font-semibold"
          onPress={() => onSelectionChange(allSelected ? [] : items.map((item) => item.id))}
        >
          {t(allSelected ? "cartShare.clearSelection" : "cartShare.selectAll")}
        </Button>
      </div>

      <ul className="max-h-80 space-y-2 overflow-x-hidden overflow-y-auto pe-1 md:max-h-96">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-large border border-divider bg-content1 shadow-sm transition-colors hover:border-primary-200 focus-within:border-primary"
          >
            <Checkbox
              isSelected={selectedSet.has(item.id)}
              onValueChange={(checked) => onSelectionChange(
                checked
                  ? [...selectedIds, item.id]
                  : selectedIds.filter((id) => id !== item.id),
              )}
              aria-label={item.name}
              classNames={{
                base: "!m-0 w-full max-w-full cursor-pointer p-3",
                wrapper: "shrink-0",
                label: "min-w-0 flex-1",
              }}
            >
              <span className="flex min-w-0 items-center gap-3">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="size-14 shrink-0 rounded-medium bg-content2 object-contain" />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-medium bg-content2 text-default-500">
                    <Icon icon="solar:box-linear" width={22} height={22} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-2 text-sm font-semibold text-foreground">{item.name}</span>
                  {item.variant ? <span className="mt-0.5 block truncate text-xs text-default-500">{item.variant}</span> : null}
                  <span className="mt-1 block text-xs text-default-500">
                    {t("cartShare.quantity", { count: item.quantity })}
                  </span>
                </span>
              </span>
            </Checkbox>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CartItemSelectionList;
