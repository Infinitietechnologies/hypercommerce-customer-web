import { Icon } from "@iconify/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Sheet, Tooltip, toastError, toastSuccess } from "@/components/ui";
import { copyTextToClipboard } from "@/features/watchAndBuy/reelSharing";

interface CartShareSheetProps {
  itemCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateLink: () => Promise<string>;
}

const CartShareSheet = ({
  itemCount,
  isOpen,
  onOpenChange,
  onCreateLink,
}: CartShareSheetProps) => {
  const { t } = useTranslation();
  const [link, setLink] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setLink("");
    }
    onOpenChange(open);
  };

  const createLink = async () => {
    if (!itemCount || isCreating) return;
    setIsCreating(true);
    try {
      const created = await onCreateLink();
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

  const displayLink = link ? `${new URL(link).host}/cart/shared-lists/…` : "";

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
            {t("cartShare.description")}
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
              isDisabled={!itemCount}
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
        <div className="flex items-center gap-3 rounded-large border border-divider bg-content2 px-4 py-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-medium bg-content1 text-primary-600">
            <Icon icon="solar:cart-large-2-linear" width={20} height={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("cartShare.allItems")}</p>
            <p className="text-xs text-default-500">{t("cartShare.itemCount", { count: itemCount })}</p>
          </div>
        </div>

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
          {t("cartShare.linkHint")}
        </p>
      </div>
    </Sheet>
  );
};

export default CartShareSheet;
