import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Image } from "@/components/ui";
import type {
  WatchBuyProduct,
  WatchBuyReel,
  WatchBuyStatusSummary,
} from "@/types/watchBuy";

interface ReelCardProps {
  onLike: (reel: WatchBuyReel) => void;
  onOpenProfile: (story: WatchBuyStatusSummary) => void;
  onShare: (reel: WatchBuyReel) => void;
  onShowProducts: (products: WatchBuyProduct[]) => void;
  reel: WatchBuyReel;
}

const ReelCard = ({
  onLike,
  onOpenProfile,
  onShare,
  onShowProducts,
  reel,
}: ReelCardProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const primaryProduct =
    reel.products.find((product) => product.is_primary) ?? reel.products[0];

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          void video
            .play()
            .then(() => setIsPaused(false))
            .catch(() => undefined);
        } else {
          video.pause();
          setIsPaused(true);
        }
      },
      { threshold: [0.3, 0.65, 0.9] },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video
        .play()
        .then(() => setIsPaused(false))
        .catch(() => undefined);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <article
      ref={containerRef}
      data-reel-id={reel.id}
      className="relative h-dvh w-full snap-start overflow-hidden bg-shell md:mx-auto md:aspect-reel md:w-auto md:max-w-md md:border-x md:border-shell-divider"
      aria-label={t("watchBuy.reels.itemLabel", {
        username: reel.profile.username,
      })}
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.cover_url ?? undefined}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        className="h-full w-full object-cover"
      >
        <track
          default
          kind="captions"
          src="/captions/empty.vtt"
          srcLang="en"
          label={t("watchBuy.media.captions")}
        />
      </video>

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={
          isPaused ? t("watchBuy.media.play") : t("watchBuy.media.pause")
        }
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-focus"
      >
        {isPaused ? (
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-shell/55 text-shell-foreground backdrop-blur-sm">
            <Icon icon="solar:play-bold" className="ms-1 text-4xl" />
          </span>
        ) : null}
      </button>

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-shell via-transparent to-shell/25" />

      <div className="absolute end-3 bottom-36 z-20 flex flex-col items-center gap-4 text-shell-foreground">
        <button
          type="button"
          onClick={() =>
            onOpenProfile({ profile: reel.profile, status_count: 0 })
          }
          aria-label={t("watchBuy.stories.open", {
            username: reel.profile.username,
          })}
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span
            className={`grid size-12 place-items-center rounded-full border-2 p-0.5 ${
              reel.profile.has_unseen_status
                ? "border-primary"
                : "border-shell-divider"
            }`}
          >
            <Image
              removeWrapper
              disableAnimation
              src={reel.profile.photo_url ?? undefined}
              alt=""
              radius="full"
              fallbackSrc="/logo.png"
              className="size-full object-cover"
            />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onLike(reel)}
          aria-pressed={reel.liked_by_me}
          aria-label={
            reel.liked_by_me
              ? t("watchBuy.reels.unlike")
              : t("watchBuy.reels.like")
          }
          className="flex flex-col items-center gap-0.5 rounded-medium p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Icon
            icon={reel.liked_by_me ? "solar:heart-bold" : "solar:heart-linear"}
            className={`text-3xl ${reel.liked_by_me ? "text-danger" : ""}`}
          />
          <span className="text-xs font-bold">{reel.like_count}</span>
        </button>

        <button
          type="button"
          onClick={() => onShare(reel)}
          aria-label={t("watchBuy.reels.share")}
          className="flex flex-col items-center gap-0.5 rounded-medium p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Icon icon="solar:share-circle-linear" className="text-3xl" />
          <span className="text-xs font-bold">{t("watchBuy.reels.share")}</span>
        </button>

        <Button
          isIconOnly
          size="sm"
          variant="flat"
          onPress={() => setIsMuted((muted) => !muted)}
          aria-label={
            isMuted ? t("watchBuy.media.unmute") : t("watchBuy.media.mute")
          }
          className="bg-shell/55 text-shell-foreground backdrop-blur-sm"
        >
          <Icon
            icon={
              isMuted ? "solar:volume-cross-linear" : "solar:volume-loud-linear"
            }
            className="text-xl"
          />
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-20 pe-20 text-shell-foreground md:pb-6">
        <button
          type="button"
          onClick={() =>
            onOpenProfile({ profile: reel.profile, status_count: 0 })
          }
          className="mb-1 rounded-small text-start text-sm font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          @{reel.profile.username}
        </button>
        {reel.caption ? (
          <p className="mb-3 line-clamp-2 text-sm leading-5 text-shell-foreground/90">
            {reel.caption}
          </p>
        ) : null}

        {primaryProduct ? (
          <button
            type="button"
            onClick={() => onShowProducts(reel.products)}
            className="flex w-full max-w-sm items-center gap-2 rounded-medium border border-shell-divider bg-shell/70 p-2 text-start backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Image
              removeWrapper
              disableAnimation
              src={primaryProduct.image ?? undefined}
              alt=""
              className="size-11 shrink-0 rounded-small bg-content1 object-contain p-1"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">
                {primaryProduct.title}
              </span>
              <span className="block text-xxs text-shell-muted">
                {t("watchBuy.products.viewCount", {
                  count: reel.products.length,
                })}
              </span>
            </span>
            <Icon icon="solar:bag-3-bold" className="shrink-0 text-xl" />
          </button>
        ) : null}
      </div>
    </article>
  );
};

export default ReelCard;
