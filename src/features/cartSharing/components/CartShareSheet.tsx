import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import { Button, Sheet, toastError, toastSuccess } from "@/components/ui";
import { copyTextToClipboard } from "@/features/watchAndBuy/reelSharing";
import type { CartResponse } from "@/types/cart";

interface CartShareSheetProps {
  cart: CartResponse;
  link: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartShareSheet = ({ cart, link, isOpen, onOpenChange }: CartShareSheetProps) => {
  const { t } = useTranslation();

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

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <Button
            fullWidth
            variant="bordered"
            startContent={<Icon icon="solar:copy-linear" width={18} height={18} />}
            onPress={() => void copyLink()}
          >
            {t("cartShare.copyLink")}
          </Button>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <Button
              fullWidth
              color="primary"
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
        <div className="rounded-large border border-divider bg-content1 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-default-500">
            {t("cartShare.previewLabel")}
          </p>
          <ul className="mt-3 space-y-3">
            {cart.items.slice(0, 3).map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                {item.product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.image}
                    alt=""
                    className="size-12 shrink-0 rounded-medium bg-content2 object-contain"
                  />
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-medium bg-content2">
                    <Icon icon="solar:box-linear" width={20} height={20} />
                  </div>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {item.product.name || item.variant.title}
                </span>
                <span className="text-sm text-default-500">×{item.quantity}</span>
              </li>
            ))}
          </ul>
          {cart.items.length > 3 ? (
            <p className="mt-3 border-t border-divider pt-3 text-sm text-default-500">
              {t("cartShare.moreItems", { count: cart.items.length - 3 })}
            </p>
          ) : null}
        </div>
        <div className="rounded-medium border border-divider bg-content2 px-3 py-2.5">
          <p className="mb-1 text-xs font-semibold text-default-500">
            {t("cartShare.linkLabel")}
          </p>
          <p className="select-all break-all text-sm font-medium text-foreground">{link}</p>
        </div>
        <p className="text-xs leading-5 text-default-500">{t("cartShare.linkHint")}</p>
      </div>
    </Sheet>
  );
};

export default CartShareSheet;
