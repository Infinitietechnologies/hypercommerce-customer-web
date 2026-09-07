import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  TelegramIcon,
  TelegramShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  XShareButton,
} from "react-share";

import { Button, Sheet, toastError, toastSuccess } from "@/components/ui";
import type { WatchBuyReel } from "@/types/watchBuy";

interface ReelShareSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reel: WatchBuyReel | null;
  url: string;
}

const ReelShareSheet = ({
  isOpen,
  onOpenChange,
  reel,
  url,
}: ReelShareSheetProps) => {
  const { t } = useTranslation();
  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (!reel) return null;

  const shareTitle = reel.caption ?? t("watchBuy.shareText");
  const optionClass =
    "flex min-w-0 flex-col items-center gap-2 rounded-medium px-1 py-2 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  const shareToApps = async () => {
    try {
      await navigator.share({
        title: t("watchBuy.title"),
        text: shareTitle,
        url,
      });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toastError(t("watchBuy.shareFailed"));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toastSuccess(t("watchBuy.linkCopied"));
      onOpenChange(false);
    } catch {
      toastError(t("watchBuy.shareFailed"));
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="md"
      backdrop="blur"
      classNames={{ backdrop: "z-sheet", wrapper: "z-sheet" }}
      footer={
        <div
          className={clsx(
            "grid w-full gap-2",
            hasNativeShare && "sm:grid-cols-2",
          )}
        >
          {hasNativeShare ? (
            <Button
              fullWidth
              color="primary"
              startContent={<Icon icon="solar:share-linear" />}
              onPress={() => void shareToApps()}
            >
              {t("watchBuy.share.moreApps")}
            </Button>
          ) : null}
          <Button
            fullWidth
            variant="bordered"
            startContent={<Icon icon="solar:copy-linear" />}
            onPress={() => void copyLink()}
          >
            {t("watchBuy.share.copyLink")}
          </Button>
        </div>
      }
      title={
        <div>
          <p className="text-lg font-extrabold text-foreground">
            {t("watchBuy.share.title")}
          </p>
          <p className="text-sm font-normal text-default-500">
            {t("watchBuy.share.description")}
          </p>
        </div>
      }
    >
      <div className="pb-2">
        <div className="grid grid-cols-3 gap-3">
          <WhatsappShareButton
            url={url}
            title={shareTitle}
            separator=" — "
            className={optionClass}
          >
            <WhatsappIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.whatsapp")}
            </span>
          </WhatsappShareButton>
          <TelegramShareButton
            url={url}
            title={shareTitle}
            className={optionClass}
          >
            <TelegramIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.telegram")}
            </span>
          </TelegramShareButton>
          <FacebookShareButton url={url} className={optionClass}>
            <FacebookIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.facebook")}
            </span>
          </FacebookShareButton>
          <XShareButton
            url={url}
            title={shareTitle}
            hashtags={["WatchAndBuy"]}
            className={optionClass}
          >
            <XIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.x")}
            </span>
          </XShareButton>
          <EmailShareButton
            url={url}
            subject={t("watchBuy.share.emailSubject")}
            body={shareTitle}
            className={optionClass}
          >
            <EmailIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.email")}
            </span>
          </EmailShareButton>
        </div>
      </div>
    </Sheet>
  );
};

export default ReelShareSheet;
