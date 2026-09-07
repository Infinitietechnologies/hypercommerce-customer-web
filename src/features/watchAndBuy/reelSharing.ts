import type { TFunction } from "i18next";

import type { WatchBuyReel } from "@/types/watchBuy";

const MAX_SHARE_CAPTION_LENGTH = 110;

export const canUseMobileNativeShare = () => {
  if (typeof window === "undefined" || typeof navigator.share !== "function")
    return false;

  return window.innerWidth < 1024;
};

export const getReelShareImageUrl = (reel: WatchBuyReel) =>
  reel.cover_url ??
  (reel.preview_type === "image" ? reel.preview_url : null) ??
  reel.profile.photo_url ??
  reel.products.find((product) => product.image)?.image ??
  null;

export const loadReelShareImageFile = async (reel: WatchBuyReel) => {
  const imageUrl = getReelShareImageUrl(reel);
  if (
    !imageUrl ||
    typeof File === "undefined" ||
    typeof navigator.canShare !== "function"
  )
    return null;

  try {
    const response = await fetch(imageUrl, { credentials: "omit" });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    const subtype = blob.type.split("/")[1]?.split(";")[0] ?? "jpg";
    const extension = subtype === "jpeg" ? "jpg" : subtype;
    const file = new File([blob], `reel-${reel.slug}.${extension}`, {
      type: blob.type,
    });

    return navigator.canShare({ files: [file] }) ? file : null;
  } catch {
    return null;
  }
};

export const getReelShareMessage = (reel: WatchBuyReel, t: TFunction) => {
  const caption = reel.caption?.trim();
  const shortenedCaption =
    caption && caption.length > MAX_SHARE_CAPTION_LENGTH
      ? `${caption.slice(0, MAX_SHARE_CAPTION_LENGTH - 1).trimEnd()}…`
      : caption;

  return shortenedCaption
    ? t("watchBuy.share.messageWithCaption", {
        caption: shortenedCaption,
        count: reel.products.length,
        username: reel.profile.username,
      })
    : t("watchBuy.share.message", {
        count: reel.products.length,
        username: reel.profile.username,
      });
};

export const getReelShareText = (
  reel: WatchBuyReel,
  t: TFunction,
  url: string,
) => `${getReelShareMessage(reel, t)}\n\n${url}`;

export const copyTextToClipboard = async (text: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to the selection-based fallback.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.className =
    "pointer-events-none fixed start-0 top-0 h-px w-px opacity-0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
};
