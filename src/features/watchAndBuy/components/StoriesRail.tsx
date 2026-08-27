import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import { Image } from "@/components/ui";
import type { WatchBuyStatusSummary } from "@/types/watchBuy";

interface StoriesRailProps {
  failed: boolean;
  items: WatchBuyStatusSummary[];
  onRetry: () => void;
  onSelect: (item: WatchBuyStatusSummary) => void;
}

const StoriesRail = ({
  failed,
  items,
  onRetry,
  onSelect,
}: StoriesRailProps) => {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="watch-buy-stories-title"
      className="border-b border-divider bg-content1 px-4 py-4 md:px-6"
    >
      <div className="mx-auto max-w-site">
        <div className="mb-3 md:mb-4">
          <h1
            id="watch-buy-stories-title"
            className="font-display text-large font-extrabold tracking-tight text-foreground"
          >
            {t("watchBuy.title")}
          </h1>
          <p className="text-xs text-default-500">
            {t("watchBuy.stories.subtitle")}
          </p>
        </div>

        <div className="min-w-0">
          {failed && items.length === 0 ? (
            <button
              type="button"
              onClick={onRetry}
              className="flex min-h-16 w-full items-center justify-center gap-2 rounded-large border border-divider bg-content2 px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <Icon icon="solar:restart-linear" className="text-xl" />
              {t("watchBuy.stories.retry")}
            </button>
          ) : items.length > 0 ? (
            <div className="scrollbar-hide flex snap-x gap-3 overflow-x-auto pb-1 min-[1024px]:gap-4">
              {items.map((item) => {
                const profile = item.profile;
                const segmentCount = Math.min(
                  Math.max(item.status_count, 1),
                  12,
                );
                const segmentGap = 5;
                const segmentLength = 100 / segmentCount - segmentGap;

                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    aria-label={t("watchBuy.stories.open", {
                      username: profile.username,
                    })}
                    className="group flex w-18 shrink-0 snap-start flex-col items-center gap-1.5 rounded-medium p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <span
                      className={`relative grid size-16 place-items-center rounded-full border-2 p-0.75 transition-transform group-hover:scale-105 motion-reduce:transition-none ${
                        item.status_count > 1
                          ? "border-transparent"
                          : profile.has_unseen_status
                            ? "border-primary"
                            : "border-default-300"
                      }`}
                    >
                      {item.status_count > 1 ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 64 64"
                          className={`pointer-events-none absolute inset-0 z-20 size-full ${
                            profile.has_unseen_status
                              ? "text-primary"
                              : "text-default-300"
                          }`}
                        >
                          <circle
                            cx="32"
                            cy="32"
                            r="30"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            pathLength="100"
                            strokeDasharray={`${segmentLength} ${segmentGap}`}
                            transform="rotate(-90 32 32)"
                          />
                        </svg>
                      ) : null}
                      <Image
                        removeWrapper
                        disableAnimation
                        src={profile.photo_url ?? undefined}
                        alt=""
                        radius="full"
                        className="aspect-square size-full object-cover"
                        fallbackSrc="/logo.png"
                      />
                    </span>
                    <span className="w-full truncate text-center text-xs font-semibold text-foreground">
                      {profile.username}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-large bg-content2 px-4 py-3 text-sm text-default-500">
              {t("watchBuy.stories.empty")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoriesRail;
