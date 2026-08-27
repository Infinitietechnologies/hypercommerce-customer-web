import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Image } from "@/components/ui";
import type { WatchBuyProduct, WatchBuyReel } from "@/types/watchBuy";

interface ReelCardProps {
  isLikePending: boolean;
  isMuted: boolean;
  onLike: (reel: WatchBuyReel) => void;
  onMutedChange: (muted: boolean) => void;
  onOpenProfile: () => void;
  onShare: (reel: WatchBuyReel) => void;
  onShowProducts: (products: WatchBuyProduct[]) => void;
  reel: WatchBuyReel;
}

const ReelCard = ({
  isLikePending,
  isMuted,
  onLike,
  onMutedChange,
  onOpenProfile,
  onShare,
  onShowProducts,
  reel,
}: ReelCardProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (videoRef.current) videoRef.current.muted = isMuted;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isMuted]);

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

  const toggleAudio = () => {
    const video = videoRef.current;
    const nextMuted = !isMuted;
    if (video) {
      video.muted = nextMuted;
      if (!nextMuted) {
        video.volume = 1;
        void video.play().then(() => setIsPaused(false));
      }
    }
    onMutedChange(nextMuted);
  };

  return (
    <article
      ref={containerRef}
      data-reel-id={reel.id}
      className="relative h-dvh w-full snap-start overflow-hidden bg-shell md:mx-auto md:aspect-reel md:w-auto md:border-x md:border-shell-divider"
      aria-label={t("watchBuy.reels.itemLabel", {
        username: reel.profile.username,
      })}
    >
      {reel.cover_url ? (
        <Image
          removeWrapper
          disableAnimation
          src={reel.cover_url}
          alt=""
          radius="none"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
        />
      ) : null}

      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.cover_url ?? undefined}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        className="relative z-0 h-full w-full object-contain"
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

      <div className="absolute end-3 bottom-28 z-20 flex flex-col items-center gap-3 text-shell-foreground md:bottom-8">
        <button
          type="button"
          onClick={() => onLike(reel)}
          disabled={isLikePending}
          aria-busy={isLikePending}
          aria-pressed={reel.liked_by_me}
          aria-label={
            reel.liked_by_me
              ? t("watchBuy.reels.unlike")
              : t("watchBuy.reels.like")
          }
          className="flex flex-col items-center gap-0.5 rounded-medium p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
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

        <button
          type="button"
          onClick={toggleAudio}
          aria-label={
            isMuted ? t("watchBuy.media.unmute") : t("watchBuy.media.mute")
          }
          className="grid size-9 place-items-center rounded-full bg-shell/55 text-shell-foreground backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Icon
            icon={
              isMuted ? "solar:volume-cross-linear" : "solar:volume-loud-linear"
            }
            className="text-xl"
          />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-20 pe-20 text-shell-foreground md:pb-6">
        <button
          type="button"
          onClick={onOpenProfile}
          className="pointer-events-auto mb-1 inline-flex items-center gap-1 rounded-small text-start text-sm font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Icon icon="solar:shop-linear" className="text-base" />@
          {reel.profile.username}
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
            className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-shell-divider bg-shell/70 px-3 py-2 text-start backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Icon icon="solar:bag-3-bold" className="shrink-0 text-xl" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">
                {t("watchBuy.products.viewCount", {
                  count: reel.products.length,
                })}
              </span>
            </span>
            <Icon icon="solar:alt-arrow-right-linear" className="shrink-0" />
          </button>
        ) : null}
      </div>
    </article>
  );
};

export default ReelCard;
