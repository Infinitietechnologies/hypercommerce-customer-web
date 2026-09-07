import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  PinterestIcon,
  PinterestShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  ThreadsIcon,
  ThreadsShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  XShareButton,
} from "react-share";

import {
  Button,
  Image,
  Sheet,
  toastError,
  toastSuccess,
} from "@/components/ui";
import {
  canUseMobileNativeShare,
  copyTextToClipboard,
  getReelShareImageUrl,
  getReelShareMessage,
  getReelShareText,
} from "@/features/watchAndBuy/reelSharing";
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
  const hasNativeShare = canUseMobileNativeShare();

  if (!reel) return null;

  const shareMessage = getReelShareMessage(reel, t);
  const pinterestMedia = getReelShareImageUrl(reel);
  const optionClass =
    "flex min-w-0 flex-col items-center gap-2 rounded-medium px-1 py-2 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  const shareToApps = async () => {
    try {
      await navigator.share({
        title: t("watchBuy.title"),
        text: getReelShareText(reel, t, url),
      });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const copied = await copyTextToClipboard(url);
      if (copied) {
        toastSuccess(t("watchBuy.shareFallbackCopied"));
        onOpenChange(false);
      } else {
        toastError(t("watchBuy.shareFailed"));
      }
    }
  };

  const copyLink = async () => {
    const copied = await copyTextToClipboard(url);
    if (copied) {
      toastSuccess(t("watchBuy.linkCopied"));
      onOpenChange(false);
    } else {
      toastError(t("watchBuy.shareFailed"));
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
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
        <div className="mb-5 flex gap-3 rounded-large border border-divider bg-content1 p-3 shadow-sm">
          <Image
            removeWrapper
            disableAnimation
            src={getReelShareImageUrl(reel) ?? undefined}
            fallbackSrc="/logo.png"
            alt={reel.caption ?? t("watchBuy.share.previewAlt")}
            className="h-28 w-20 shrink-0 rounded-medium object-cover"
          />
          <div className="min-w-0 flex-1 py-1">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                removeWrapper
                disableAnimation
                src={reel.profile.photo_url ?? undefined}
                fallbackSrc="/logo.png"
                alt=""
                radius="full"
                className="size-8 shrink-0 object-cover"
              />
              <span className="truncate text-sm font-bold text-foreground">
                @{reel.profile.username}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-foreground">
              {reel.caption ?? t("watchBuy.share.fallbackCaption")}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-default-500">
              <Icon icon="solar:bag-4-linear" className="text-base" />
              <span>
                {t("watchBuy.products.count", {
                  count: reel.products.length,
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <WhatsappShareButton
            url={url}
            title={shareMessage}
            separator=" — "
            className={optionClass}
            aria-label={t("watchBuy.share.whatsapp")}
          >
            <WhatsappIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.whatsapp")}
            </span>
          </WhatsappShareButton>
          <TelegramShareButton
            url={url}
            title={shareMessage}
            className={optionClass}
            aria-label={t("watchBuy.share.telegram")}
          >
            <TelegramIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.telegram")}
            </span>
          </TelegramShareButton>
          <FacebookShareButton
            url={url}
            className={optionClass}
            aria-label={t("watchBuy.share.facebook")}
          >
            <FacebookIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.facebook")}
            </span>
          </FacebookShareButton>
          <XShareButton
            url={url}
            title={shareMessage}
            hashtags={["WatchAndBuy"]}
            className={optionClass}
            aria-label={t("watchBuy.share.x")}
          >
            <XIcon size={44} round />
            <span className="w-full text-center">{t("watchBuy.share.x")}</span>
          </XShareButton>
          <ThreadsShareButton
            url={url}
            title={shareMessage}
            className={optionClass}
            aria-label={t("watchBuy.share.threads")}
          >
            <ThreadsIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.threads")}
            </span>
          </ThreadsShareButton>
          {pinterestMedia ? (
            <PinterestShareButton
              url={url}
              media={pinterestMedia}
              description={shareMessage}
              className={optionClass}
              aria-label={t("watchBuy.share.pinterest")}
            >
              <PinterestIcon size={44} round />
              <span className="w-full text-center">
                {t("watchBuy.share.pinterest")}
              </span>
            </PinterestShareButton>
          ) : null}
          <RedditShareButton
            url={url}
            title={shareMessage}
            className={optionClass}
            aria-label={t("watchBuy.share.reddit")}
          >
            <RedditIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.reddit")}
            </span>
          </RedditShareButton>
          <LinkedinShareButton
            url={url}
            title={t("watchBuy.share.emailSubject")}
            summary={shareMessage}
            source={t("watchBuy.title")}
            className={optionClass}
            aria-label={t("watchBuy.share.linkedin")}
          >
            <LinkedinIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.linkedin")}
            </span>
          </LinkedinShareButton>
          <EmailShareButton
            url={url}
            subject={t("watchBuy.share.emailSubject")}
            body={shareMessage}
            className={optionClass}
            aria-label={t("watchBuy.share.email")}
          >
            <EmailIcon size={44} round />
            <span className="w-full text-center">
              {t("watchBuy.share.email")}
            </span>
          </EmailShareButton>
        </div>
        {hasNativeShare ? (
          <div className="mt-4 flex gap-3 rounded-large border border-divider bg-default-100 p-3 text-default-600">
            <Icon
              icon="solar:smartphone-2-linear"
              className="mt-0.5 shrink-0 text-xl"
            />
            <p className="text-xs font-medium leading-5">
              {t("watchBuy.share.installedApps")}
            </p>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
};

export default ReelShareSheet;
