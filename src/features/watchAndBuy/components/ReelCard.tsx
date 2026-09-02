import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "@/components/ui";
import type { WatchBuyProduct, WatchBuyReel } from "@/types/watchBuy";

interface ReelCardProps {
  isLikePending: boolean;
  isMuted: boolean;
  isSuspended: boolean;
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
  isSuspended,
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
    if (isSuspended) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: [0.3, 0.65, 0.9] },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isSuspended]);

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
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const toggleAudio = () => {
    const video = videoRef.current;
    const nextMuted = !isMuted;
    if (video) {
      video.muted = nextMuted;
      if (!nextMuted) {
        video.volume = 1;
        void video.play().catch(() => undefined);
      }
    }
    onMutedChange(nextMuted);
  };

  return (
    <article
      ref={containerRef}
      data-reel-id={reel.id}
      className="group/reel relative h-dvh w-full snap-start overflow-hidden bg-shell md:mx-auto md:aspect-reel md:w-auto md:border-x md:border-shell-divider md:shadow-overlay"
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
        onPause={() => setIsPaused(true)}
        onPlay={() => setIsPaused(false)}
        preload="metadata"
        className="relative h-full w-full object-contain"
      >
        <track
          default
          kind="captions"
          src="/captions/empty.vtt"
          srcLang="en"
          label={t("watchBuy.media.captions")}
        />
      </video>

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-shell via-transparent to-shell/25" />

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={
          isPaused ? t("watchBuy.media.play") : t("watchBuy.media.pause")
        }
        className="group/play absolute inset-0 z-20 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-focus"
      >
        <span
          className={`mx-auto grid size-16 place-items-center rounded-full bg-shell/65 text-shell-foreground shadow-overlay backdrop-blur-md transition duration-200 motion-reduce:transform-none motion-reduce:transition-none ${
            isPaused
              ? "scale-100 opacity-100"
              : "scale-90 opacity-0 group-hover/play:scale-100 group-hover/play:opacity-100 group-focus-visible/play:scale-100 group-focus-visible/play:opacity-100"
          }`}
        >
          <Icon
            icon={isPaused ? "solar:play-bold" : "solar:pause-bold"}
            className={`text-4xl ${isPaused ? "ms-1" : ""}`}
          />
        </span>
      </button>

      <div className="absolute end-4 bottom-28 z-30 flex flex-col items-center gap-4 text-shell-foreground md:end-5 md:bottom-8">
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
          className="group/action flex w-12 flex-col items-center gap-1 rounded-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        >
          <span className="grid size-11 place-items-center rounded-full bg-shell/55 shadow-overlay backdrop-blur-md transition group-hover/action:scale-105 group-hover/action:bg-shell-foreground/15 group-active/action:scale-95 motion-reduce:transform-none motion-reduce:transition-none">
            <Icon
              icon={
                reel.liked_by_me ? "solar:heart-bold" : "solar:heart-linear"
              }
              className={`text-2xl ${reel.liked_by_me ? "text-danger" : ""}`}
            />
          </span>
          <span className="text-xxs font-bold drop-shadow-sm">
            {reel.like_count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onShare(reel)}
          aria-label={t("watchBuy.reels.share")}
          className="group/action flex w-12 flex-col items-center gap-1 rounded-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span className="grid size-11 place-items-center rounded-full bg-shell/55 shadow-overlay backdrop-blur-md transition group-hover/action:scale-105 group-hover/action:bg-shell-foreground/15 group-active/action:scale-95 motion-reduce:transform-none motion-reduce:transition-none">
            <Icon icon="solar:share-linear" className="text-2xl" />
          </span>
          <span className="text-xxs font-bold drop-shadow-sm">
            {t("watchBuy.reels.share")}
          </span>
        </button>

        <Tooltip
          content={
            isMuted ? t("watchBuy.media.unmute") : t("watchBuy.media.mute")
          }
        >
          <button
            type="button"
            onClick={toggleAudio}
            aria-label={
              isMuted ? t("watchBuy.media.unmute") : t("watchBuy.media.mute")
            }
            className="grid size-11 place-items-center rounded-full bg-shell/55 text-shell-foreground shadow-overlay backdrop-blur-md transition hover:scale-105 hover:bg-shell-foreground/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transform-none motion-reduce:transition-none"
          >
            <Icon
              icon={
                isMuted
                  ? "solar:volume-cross-linear"
                  : "solar:volume-loud-linear"
              }
              className="text-2xl"
            />
          </button>
        </Tooltip>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-20 pe-20 text-shell-foreground md:px-5 md:pb-6 md:pe-24">
        {reel.profile.has_active_status ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="pointer-events-auto mb-1 inline-flex items-center gap-1.5 rounded-small text-start text-sm font-extrabold transition hover:text-shell-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
          >
            <Icon icon="solar:shop-2-linear" className="text-lg" />@
            {reel.profile.username}
          </button>
        ) : (
          <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-extrabold">
            <Icon icon="solar:shop-2-linear" className="text-lg" />@
            {reel.profile.username}
          </p>
        )}
        {reel.caption ? (
          <p className="mb-4 line-clamp-2 max-w-md text-sm leading-5 text-shell-foreground/90 drop-shadow-sm">
            {reel.caption}
          </p>
        ) : null}

        {primaryProduct ? (
          <button
            type="button"
            onClick={() => onShowProducts(reel.products)}
            className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-shell-divider bg-shell/70 px-3 py-2 text-start shadow-overlay backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-shell-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transform-none motion-reduce:transition-none"
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
