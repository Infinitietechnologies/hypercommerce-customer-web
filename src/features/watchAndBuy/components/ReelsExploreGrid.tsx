import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import { Image, Skeleton } from "@/components/ui";
import type { WatchBuyReel } from "@/types/watchBuy";

interface ReelsExploreGridProps {
  hasMore: boolean;
  isPageHeading?: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onOpen: (reel: WatchBuyReel) => void;
  reels: WatchBuyReel[];
}

const ReelsExploreGrid = ({
  hasMore,
  isPageHeading = false,
  isLoadingMore,
  onLoadMore,
  onOpen,
  reels,
}: ReelsExploreGridProps) => {
  const { t } = useTranslation();

  const formatDuration = (durationMs: number | null) => {
    if (durationMs == null) return null;

    const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <section
      aria-labelledby="watch-buy-explore-title"
      className="mx-auto w-full max-w-site px-3 py-5 sm:px-4 md:px-6"
    >
      <div className="mb-4">
        {isPageHeading ? (
          <h1
            id="watch-buy-explore-title"
            className="font-display text-xl font-extrabold tracking-tight text-foreground"
          >
            {t("watchBuy.reels.exploreTitle")}
          </h1>
        ) : (
          <h2
            id="watch-buy-explore-title"
            className="font-display text-xl font-extrabold tracking-tight text-foreground"
          >
            {t("watchBuy.reels.exploreTitle")}
          </h2>
        )}
        <p className="mt-1 text-sm text-default-500">
          {t("watchBuy.reels.exploreDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 min-[1024px]:grid-cols-4">
        {reels.map((reel) => {
          const duration = formatDuration(reel.duration_ms);

          return (
            <button
              key={reel.id}
              type="button"
              onClick={() => onOpen(reel)}
              aria-label={t("watchBuy.reels.open", {
                username: reel.profile.username,
              })}
              className="group relative aspect-reel w-full overflow-hidden rounded-large border border-divider bg-shell text-start shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transform-none motion-reduce:transition-none"
            >
              {reel.preview_type === "image" && reel.preview_url ? (
                <Image
                  removeWrapper
                  disableAnimation
                  src={reel.preview_url}
                  alt={reel.caption ?? ""}
                  radius="none"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                />
              ) : (
                <video
                  src={reel.preview_url ?? reel.video_url}
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  onLoadedData={(event) => {
                    const previewTime = reel.preview_time_seconds ?? 0.1;
                    event.currentTarget.currentTime = Math.min(
                      previewTime,
                      event.currentTarget.duration || previewTime,
                    );
                  }}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <track
                    default
                    kind="captions"
                    src="/captions/empty.vtt"
                    srcLang="en"
                    label={t("watchBuy.media.captions")}
                  />
                </video>
              )}

              <span className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-shell via-transparent to-shell/30" />

              {duration ? (
                <span className="absolute start-2 top-2 z-30 inline-flex items-center gap-1 rounded-full bg-shell/65 px-2 py-1 text-xxs font-bold text-shell-foreground shadow-overlay backdrop-blur-sm">
                  <Icon icon="solar:play-bold" className="text-xs" />
                  {duration}
                </span>
              ) : null}

              <span className="absolute inset-x-0 bottom-0 z-30 p-3 text-shell-foreground">
                {reel.caption ? (
                  <span className="mb-1 line-clamp-2 text-sm font-extrabold leading-5 drop-shadow-sm">
                    {reel.caption}
                  </span>
                ) : null}
                <span className="flex items-center justify-between gap-2 text-xxs font-semibold text-shell-muted">
                  <span className="min-w-0 truncate">
                    @{reel.profile.username}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-shell-foreground">
                    <Icon icon="solar:heart-linear" className="text-xs" />
                    {reel.like_count}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <InfiniteSentinel
        hasMore={hasMore}
        isLoading={isLoadingMore}
        onLoadMore={onLoadMore}
        rootMargin="800px"
      />

      {isLoadingMore ? (
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 min-[1024px]:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              className="aspect-reel w-full rounded-large"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default ReelsExploreGrid;
