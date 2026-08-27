import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import { Image, Skeleton } from "@/components/ui";
import type { WatchBuyReel } from "@/types/watchBuy";

interface ReelsExploreGridProps {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onOpen: (reel: WatchBuyReel) => void;
  reels: WatchBuyReel[];
}

const ReelsExploreGrid = ({
  hasMore,
  isLoadingMore,
  onLoadMore,
  onOpen,
  reels,
}: ReelsExploreGridProps) => {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="watch-buy-explore-title"
      className="mx-auto w-full max-w-site px-3 py-5 sm:px-4 md:px-6"
    >
      <div className="mb-4">
        <h2
          id="watch-buy-explore-title"
          className="font-display text-xl font-extrabold tracking-tight text-foreground"
        >
          {t("watchBuy.reels.exploreTitle")}
        </h2>
        <p className="mt-1 text-sm text-default-500">
          {t("watchBuy.reels.exploreDescription")}
        </p>
      </div>

      <div className="columns-2 gap-2 md:columns-3 md:gap-3 min-[1024px]:columns-4">
        {reels.map((reel, index) => (
          <button
            key={reel.id}
            type="button"
            onClick={() => onOpen(reel)}
            aria-label={t("watchBuy.reels.open", {
              username: reel.profile.username,
            })}
            className={clsx(
              "group relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-large border border-divider bg-shell text-start shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transform-none motion-reduce:transition-none md:mb-3",
              index % 5 === 0 ? "aspect-square" : "aspect-reel",
            )}
          >
            {reel.cover_url ? (
              <Image
                removeWrapper
                disableAnimation
                src={reel.cover_url}
                alt={reel.caption ?? ""}
                radius="none"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
              />
            ) : (
              <span className="grid h-full w-full place-items-center bg-content3 text-shell-foreground">
                <Icon
                  icon="solar:clapperboard-play-bold"
                  className="text-4xl"
                />
              </span>
            )}

            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-shell via-transparent to-transparent" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-11 place-items-center rounded-full bg-shell/55 text-shell-foreground opacity-90 backdrop-blur-sm transition group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none">
                <Icon icon="solar:play-bold" className="ms-0.5 text-2xl" />
              </span>
            </span>

            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-shell-foreground">
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold">
                  @{reel.profile.username}
                </span>
                {reel.products.length > 0 ? (
                  <span className="mt-0.5 flex items-center gap-1 text-xxs text-shell-muted">
                    <Icon icon="solar:bag-3-bold" />
                    {t("watchBuy.products.viewCount", {
                      count: reel.products.length,
                    })}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold">
                <Icon icon="solar:heart-bold" />
                {reel.like_count}
              </span>
            </span>
          </button>
        ))}
      </div>

      <InfiniteSentinel
        hasMore={hasMore}
        isLoading={isLoadingMore}
        onLoadMore={onLoadMore}
        rootMargin="800px"
      />

      {isLoadingMore ? (
        <div className="mt-2 columns-2 gap-2 md:columns-3 md:gap-3 min-[1024px]:columns-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              className={clsx(
                "mb-2 w-full break-inside-avoid rounded-large md:mb-3",
                index % 3 === 0 ? "aspect-square" : "aspect-reel",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default ReelsExploreGrid;
