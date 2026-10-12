import { Icon } from "@iconify/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Sheet, Tooltip, toastError, toastSuccess } from "@/components/ui";
import CartItemSelectionList from "@/features/cartSharing/components/CartItemSelectionList";
import { copyTextToClipboard } from "@/features/watchAndBuy/reelSharing";
import type { CartShareSelectionItem } from "@/types/sharedCart";

interface CartShareSheetProps {
  items: CartShareSelectionItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateLink: (items: CartShareSelectionItem[]) => Promise<string> | string;
}

const CartShareSheet = ({
  items,
  isOpen,
  onOpenChange,
  onCreateLink,
}: CartShareSheetProps) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [link, setLink] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const allIds = items.map((item) => item.id);
  const selected = selectedIds ?? allIds;
  const selectedItems = items.filter((item) => selected.includes(item.id));

  const changeSelection = (next: string[]) => {
    setSelectedIds(next);
    setLink("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedIds(null);
      setLink("");
    }
    onOpenChange(open);
  };

  const createLink = async () => {
    if (!selectedItems.length || isCreating) return;
    setIsCreating(true);
    try {
      const created = await onCreateLink(selectedItems);
      setLink(created);
      toastSuccess(t("cartShare.linkReady"));
    } catch {
      toastError(t("cartShare.createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = async () => {
    if (await copyTextToClipboard(link)) {
      toastSuccess(t("cartShare.linkCopied"));
    } else {
      toastError(t("cartShare.copyFailed"));
    }
  };

  const shareLink = async () => {
    try {
      await navigator.share({
        title: t("cartShare.title"),
        text: t("cartShare.message"),
        url: link,
      });
      toastSuccess(t("cartShare.shared"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toastError(t("cartShare.shareFailed"));
    }
  };

  const displayLink = link ? `${new URL(link).host}/shared-cart/…` : "";

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      size="lg"
      backdrop="blur"
      classNames={{
        backdrop: "z-sheet",
        wrapper: "z-sheet",
        base: "border border-divider bg-content1 shadow-overlay",
        closeButton: "end-3 top-3 rounded-medium p-2 text-base text-default-500 hover:bg-content2 hover:text-foreground",
      }}
      title={
        <div className="pe-8">
          <h2 className="text-xl font-bold text-foreground">{t("cartShare.title")}</h2>
          <p className="mt-1 text-sm font-normal text-default-500">
            {t("cartShare.selectItems")}
          </p>
        </div>
      }
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          {link ? (
            <Button
              fullWidth
              color="primary"
              className="text-sm font-semibold"
              startContent={<Icon icon="solar:copy-linear" width={18} height={18} />}
              onPress={() => void copyLink()}
            >
              {t("cartShare.copyLink")}
            </Button>
          ) : (
            <Button
              fullWidth
              color="primary"
              isLoading={isCreating}
              isDisabled={!selectedItems.length}
              className="text-sm font-semibold"
              startContent={<Icon icon="solar:link-linear" width={18} height={18} />}
              onPress={() => void createLink()}
            >
              {t("cartShare.createLink")}
            </Button>
          )}
          {link && typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <Button
              fullWidth
              variant="bordered"
              className="text-sm font-semibold"
              startContent={<Icon icon="solar:share-linear" width={18} height={18} />}
              onPress={() => void shareLink()}
            >
              {t("cartShare.shareLink")}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        <CartItemSelectionList
          items={items}
          selectedIds={selected}
          onSelectionChange={changeSelection}
        />

        {link ? (
          <div className="flex items-center gap-3 rounded-medium border border-divider bg-content2 px-3 py-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-small bg-content1 text-primary-600">
              <Icon icon="solar:link-linear" width={18} height={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-default-500">{t("cartShare.linkLabel")}</p>
              <p className="truncate text-sm font-medium text-foreground">{displayLink}</p>
            </div>
            <Tooltip content={t("cartShare.copyLink")}>
              <Button
                isIconOnly
                variant="light"
                aria-label={t("cartShare.copyLink")}
                className="size-10 min-w-10 !p-0 text-default-600"
                onPress={() => void copyLink()}
              >
                <Icon icon="solar:copy-linear" width={18} height={18} />
              </Button>
            </Tooltip>
          </div>
        ) : null}
        <p className="text-xs leading-5 text-default-500">
          {t("cartShare.guestLinkHint")}
        </p>
      </div>
    </Sheet>
  );
};

export default CartShareSheet;
