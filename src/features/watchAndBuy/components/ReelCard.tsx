import { Icon } from "@iconify/react";
import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Image, Tooltip } from "@/components/ui";
import type { WatchBuyReel } from "@/types/watchBuy";

import ReelProductRail from "./ReelProductRail";

interface ReelCardProps {
  isLikePending: boolean;
  isMuted: boolean;
  isSuspended: boolean;
  onLike: (reel: WatchBuyReel) => void;
  onMutedChange: (muted: boolean) => void;
  onOpenProfile: () => void;
  onShare: (reel: WatchBuyReel) => void;
  reel: WatchBuyReel;
}

interface LikeBurst {
  id: number;
  x: number;
  y: number;
}

const ReelCard = ({
  isLikePending,
  isMuted,
  isSuspended,
  onLike,
  onMutedChange,
  onOpenProfile,
  onShare,
  reel,
}: ReelCardProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastMediaPressRef = useRef(0);
  const mediaPressTimerRef = useRef<number | null>(null);
  const likeBurstTimerRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [likeBurst, setLikeBurst] = useState<LikeBurst | null>(null);
  const hasProducts = reel.products.length > 0;

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

  useEffect(
    () => () => {
      if (mediaPressTimerRef.current != null) {
        window.clearTimeout(mediaPressTimerRef.current);
      }
      if (likeBurstTimerRef.current != null) {
        window.clearTimeout(likeBurstTimerRef.current);
      }
    },
    [],
  );

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

  const handleMediaPress = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    const isDoublePress = now - lastMediaPressRef.current < 300;
    lastMediaPressRef.current = now;

    if (isDoublePress) {
      if (mediaPressTimerRef.current != null) {
        window.clearTimeout(mediaPressTimerRef.current);
        mediaPressTimerRef.current = null;
      }
      if (!reel.liked_by_me && !isLikePending) onLike(reel);
      const bounds = containerRef.current?.getBoundingClientRect();
      setLikeBurst({
        id: now,
        x: bounds
          ? event.clientX - bounds.left
          : event.currentTarget.clientWidth / 2,
        y: bounds
          ? event.clientY - bounds.top
          : event.currentTarget.clientHeight / 2,
      });
      if (likeBurstTimerRef.current != null) {
        window.clearTimeout(likeBurstTimerRef.current);
      }
      likeBurstTimerRef.current = window.setTimeout(() => {
        setLikeBurst(null);
        likeBurstTimerRef.current = null;
      }, 700);
      return;
    }

    mediaPressTimerRef.current = window.setTimeout(() => {
      togglePlayback();
      mediaPressTimerRef.current = null;
    }, 300);
  };

  return (
    <article
      ref={containerRef}
      data-reel-id={reel.id}
      className="group/reel relative h-full w-full snap-start overflow-hidden bg-shell"
      aria-label={t("watchBuy.reels.itemLabel", {
        username: reel.profile.username,
      })}
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={
          reel.preview_type === "image"
            ? (reel.preview_url ?? reel.cover_url ?? undefined)
            : (reel.cover_url ?? undefined)
        }
        playsInline
        loop
        muted={isMuted}
        onPause={() => setIsPaused(true)}
        onPlay={() => setIsPaused(false)}
        preload="metadata"
        className="relative h-full w-full object-cover"
      >
        <track
          default
          kind="captions"
          src="/captions/empty.vtt"
          srcLang="en"
          label={t("watchBuy.media.captions")}
        />
      </video>

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-shell via-transparent to-shell/40" />

      <button
        type="button"
        onClick={handleMediaPress}
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

      {likeBurst ? (
        <span
          key={likeBurst.id}
          aria-hidden="true"
          style={{ left: likeBurst.x, top: likeBurst.y }}
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 animate-reel-like-burst motion-reduce:animate-none"
        >
          <Icon
            icon="solar:heart-bold"
            className="text-7xl text-danger drop-shadow-lg"
          />
        </span>
      ) : null}

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
          className="absolute end-3 top-3 z-40 grid size-11 place-items-center rounded-full bg-shell/55 text-shell-foreground shadow-overlay backdrop-blur-md transition hover:scale-105 hover:bg-shell-foreground/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transform-none motion-reduce:transition-none"
        >
          <Icon
            icon={
              isMuted ? "solar:volume-cross-linear" : "solar:volume-loud-linear"
            }
            className="text-2xl"
          />
        </button>
      </Tooltip>

      <div
        className={`absolute inset-x-0 z-30 px-4 pe-20 text-shell-foreground ${
          hasProducts ? "bottom-32" : "bottom-5"
        }`}
      >
        {reel.profile.has_active_status ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex min-w-0 items-center gap-2 rounded-small text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Image
              removeWrapper
              disableAnimation
              src={reel.profile.photo_url ?? undefined}
              alt=""
              radius="full"
              fallbackSrc="/logo.png"
              className="size-8 shrink-0 border border-shell-divider object-cover"
            />
            <span className="truncate text-sm font-bold drop-shadow-sm">
              {reel.profile.username}
            </span>
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <Image
              removeWrapper
              disableAnimation
              src={reel.profile.photo_url ?? undefined}
              alt=""
              radius="full"
              fallbackSrc="/logo.png"
              className="size-8 shrink-0 border border-shell-divider object-cover"
            />
            <span className="truncate text-sm font-bold drop-shadow-sm">
              {reel.profile.username}
            </span>
          </div>
        )}
        {reel.caption ? (
          <p className="mt-2 line-clamp-2 max-w-md text-sm font-medium leading-5 text-shell-muted drop-shadow-sm">
            {reel.caption}
          </p>
        ) : null}
      </div>

      <div
        className={`absolute end-3 z-30 flex flex-col items-center gap-4 text-shell-foreground ${
          hasProducts ? "bottom-44" : "bottom-5"
        }`}
      >
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
          <span className="grid size-11 place-items-center drop-shadow-md transition group-hover/action:scale-105 group-active/action:scale-95 motion-reduce:transform-none motion-reduce:transition-none">
            <Icon
              icon={
                reel.liked_by_me ? "solar:heart-bold" : "solar:heart-linear"
              }
              className={`text-4xl ${reel.liked_by_me ? "text-danger" : ""}`}
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
          <span className="grid size-11 place-items-center drop-shadow-md transition group-hover/action:scale-105 group-active/action:scale-95 motion-reduce:transform-none motion-reduce:transition-none">
            <Icon icon="solar:share-linear" className="text-3xl" />
          </span>
          <span className="text-xxs font-bold drop-shadow-sm">
            {t("watchBuy.reels.share")}
          </span>
        </button>
      </div>

      <ReelProductRail products={reel.products} />
    </article>
  );
};

export default ReelCard;
