import type { WatchBuyStatusSummary } from "@/types/watchBuy";

export const getSnappedReelIndex = (
  scrollTop: number,
  viewportHeight: number,
  reelCount: number,
) => {
  if (viewportHeight <= 0 || reelCount <= 0) return null;
  return Math.max(
    0,
    Math.min(reelCount - 1, Math.round(scrollTop / viewportHeight)),
  );
};

export const getReelShareUrl = (origin: string, slug: string) => {
  const url = new URL("/watch-and-buy/", origin);
  url.searchParams.set("slug", slug);
  return url.toString();
};

export const getNextActiveStory = (
  stories: WatchBuyStatusSummary[],
  currentProfileId: number,
) => {
  const currentIndex = stories.findIndex(
    (story) => story.profile.id === currentProfileId,
  );
  return (
    stories
      .slice(currentIndex + 1)
      .find((story) => story.profile.has_active_status) ?? null
  );
};
