import { Icon } from "@iconify/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import DynamicSEO from "@/SEO/DynamicSEO";
import WatchBuySkeleton from "@/components/Skeletons/WatchBuySkeleton";
import { EmptyState, ErrorState, toastError } from "@/components/ui";
import ReelsExploreGrid from "@/features/watchAndBuy/components/ReelsExploreGrid";
import ReelViewer from "@/features/watchAndBuy/components/ReelViewer";
import ReelShareSheet from "@/features/watchAndBuy/components/ReelShareSheet";
import StoriesRail from "@/features/watchAndBuy/components/StoriesRail";
import StoryViewer from "@/features/watchAndBuy/components/StoryViewer";
import { useWatchBuyFeed } from "@/features/watchAndBuy/hooks/useWatchBuyFeed";
import {
  getNextActiveStory,
  getReelShareUrl,
} from "@/features/watchAndBuy/navigation";
import {
  canUseMobileNativeShare,
  getReelShareImageUrl,
  getReelShareMessage,
  getReelShareText,
  loadReelShareImageFile,
} from "@/features/watchAndBuy/reelSharing";
import { RootState } from "@/lib/redux/store";
import {
  getWatchBuyProfileStatuses,
  markWatchBuyStatusesSeen,
  updateWatchBuyLikes,
} from "@/services/watchBuy";
import { authSheetStore } from "@/stores/authSheetStore";
import type {
  WatchBuyProfileStatusesData,
  WatchBuyReel,
  WatchBuyReelsResponse,
  WatchBuyStatusSummary,
  WatchBuyStatusesResponse,
} from "@/types/watchBuy";

interface WatchBuyViewProps {
  initialReels?: WatchBuyReelsResponse;
  initialStatuses?: WatchBuyStatusesResponse;
  slug?: string;
}

const WatchBuyView = ({
  initialReels,
  initialStatuses,
  slug,
}: WatchBuyViewProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const routeSlug =
    typeof router.query.slug === "string" ? router.query.slug : undefined;
  const effectiveSlug = router.isReady ? routeSlug : slug;
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const {
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    reels,
    reelsFailed,
    retry,
    setProfileSeen,
    setReelLiked,
    stories,
    storiesFailed,
  } = useWatchBuyFeed({
    enabled: router.isReady,
    initialReels,
    initialStatuses,
    slug: effectiveSlug,
  });

  const [activeStory, setActiveStory] = useState<WatchBuyStatusSummary | null>(
    null,
  );
  const [storyData, setStoryData] =
    useState<WatchBuyProfileStatusesData | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyFailed, setStoryFailed] = useState(false);
  const [activeReelId, setActiveReelId] = useState<number | null>(null);
  const [activeReelProfileId, setActiveReelProfileId] = useState<number | null>(
    null,
  );
  const [activeShare, setActiveShare] = useState<{
    reel: WatchBuyReel;
    url: string;
  } | null>(null);
  const [likingReelIds, setLikingReelIds] = useState<ReadonlySet<number>>(
    new Set(),
  );
  const openedSlugRef = useRef<string | null>(null);
  const nativeShareImagesRef = useRef(new Map<number, File>());
  const storyRequestIdRef = useRef(0);
  const seenStatusIds = useRef(new Set<number>());

  useEffect(() => {
    if (
      !effectiveSlug ||
      activeReelId != null ||
      openedSlugRef.current === effectiveSlug
    )
      return;
    const target = reels.find((reel) => reel.slug === effectiveSlug);
    if (!target) return;

    openedSlugRef.current = effectiveSlug;
    const timer = window.setTimeout(() => setActiveReelId(target.id), 0);
    return () => window.clearTimeout(timer);
  }, [activeReelId, effectiveSlug, reels]);

  useEffect(() => {
    if (activeReelId == null || !canUseMobileNativeShare()) return;
    const reel = reels.find((item) => item.id === activeReelId);
    if (!reel || nativeShareImagesRef.current.has(reel.id)) return;

    let isCurrent = true;
    void loadReelShareImageFile(reel).then((file) => {
      if (isCurrent && file) nativeShareImagesRef.current.set(reel.id, file);
    });

    return () => {
      isCurrent = false;
    };
  }, [activeReelId, reels]);

  const openStory = useCallback(async (summary: WatchBuyStatusSummary) => {
    if (!summary.profile.has_active_status) return;
    const requestId = storyRequestIdRef.current + 1;
    storyRequestIdRef.current = requestId;
    setActiveStory(summary);
    setStoryData(null);
    setStoryFailed(false);
    setStoryLoading(true);
    seenStatusIds.current.clear();

    const response = await getWatchBuyProfileStatuses(
      summary.profile.username,
      { per_page: 50 },
    );

    if (storyRequestIdRef.current !== requestId) return;

    if (response.success && response.data) {
      setStoryData(response.data);
    } else {
      setStoryFailed(true);
    }
    setStoryLoading(false);
  }, []);

  const persistSeenStatuses = useCallback(
    (username: string) => {
      const statusIds = Array.from(seenStatusIds.current);
      seenStatusIds.current.clear();
      setProfileSeen(username);
      if (!isLoggedIn || statusIds.length === 0) return;

      void markWatchBuyStatusesSeen(statusIds).then((response) => {
        if (!response.success) {
          toastError(t("watchBuy.stories.seenFailed"));
        }
      });
    },
    [isLoggedIn, setProfileSeen, t],
  );

  const closeStory = useCallback(() => {
    storyRequestIdRef.current += 1;
    if (activeStory) persistSeenStatuses(activeStory.profile.username);
    setActiveStory(null);
    setStoryData(null);
    setStoryLoading(false);
  }, [activeStory, persistSeenStatuses]);

  const completeStory = useCallback(() => {
    if (!activeStory) return;
    persistSeenStatuses(activeStory.profile.username);

    const nextStory = getNextActiveStory(stories, activeStory.profile.id);

    if (nextStory) {
      void openStory(nextStory);
      return;
    }

    storyRequestIdRef.current += 1;
    setActiveStory(null);
    setStoryData(null);
    setStoryLoading(false);
  }, [activeStory, openStory, persistSeenStatuses, stories]);

  const handleSeen = useCallback((statusId: number) => {
    seenStatusIds.current.add(statusId);
    setStoryData((current) => {
      const target = current?.items.find((status) => status.id === statusId);
      if (!current || !target || target.seen_by_me) return current;

      return {
        ...current,
        items: current.items.map((status) =>
          status.id === statusId ? { ...status, seen_by_me: true } : status,
        ),
      };
    });
  }, []);

  const closeReel = useCallback(() => {
    setActiveShare(null);
    setActiveReelId(null);
    setActiveReelProfileId(null);
    if (typeof router.query.slug !== "string") return;

    const nextQuery = { ...router.query };
    delete nextQuery.slug;
    void router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true, scroll: false },
    );
  }, [router]);

  const openReelProfile = useCallback((reel: WatchBuyReel) => {
    setActiveReelProfileId(reel.profile.id);
  }, []);

  const openReel = useCallback(
    (reel: WatchBuyReel) => {
      openedSlugRef.current = reel.slug;
      setActiveReelProfileId(null);
      setActiveReelId(reel.id);
      void router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, slug: reel.slug },
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  const setActiveReel = useCallback(
    (reel: WatchBuyReel) => {
      openedSlugRef.current = reel.slug;
      setActiveReelId(reel.id);
      if (router.query.slug === reel.slug) return;

      void router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, slug: reel.slug },
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  const toggleLike = useCallback(
    async (reel: WatchBuyReel) => {
      if (!isLoggedIn) {
        authSheetStore.open({ next: router.asPath });
        return;
      }

      if (likingReelIds.has(reel.id)) return;

      const nextLiked = !reel.liked_by_me;
      setLikingReelIds((current) => new Set(current).add(reel.id));
      setReelLiked(reel.id, nextLiked);
      const response = await updateWatchBuyLikes([
        { reel_id: reel.id, liked: nextLiked },
      ]);
      if (!response.success) {
        setReelLiked(reel.id, reel.liked_by_me);
        toastError(t("watchBuy.reels.likeFailed"));
      }
      setLikingReelIds((current) => {
        const next = new Set(current);
        next.delete(reel.id);
        return next;
      });
    },
    [isLoggedIn, likingReelIds, router.asPath, setReelLiked, t],
  );

  const shareReel = useCallback(
    async (reel: WatchBuyReel) => {
      const publicOrigin =
        process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin;
      const url = getReelShareUrl(publicOrigin, reel.slug);

      if (canUseMobileNativeShare()) {
        const shareData = {
          title: t("watchBuy.share.title"),
          text: getReelShareText(reel, t, url),
        };
        const image = nativeShareImagesRef.current.get(reel.id);

        try {
          await navigator.share({
            ...shareData,
            ...(image ? { files: [image] } : {}),
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          if (image) {
            try {
              await navigator.share(shareData);
              return;
            } catch (retryError) {
              if (
                retryError instanceof DOMException &&
                retryError.name === "AbortError"
              ) {
                return;
              }
            }
          }
        }
      }

      setActiveShare({ reel, url });
    },
    [t],
  );

  if (isLoading && reels.length === 0 && stories.length === 0) {
    return <WatchBuySkeleton />;
  }

  const seoReel = effectiveSlug
    ? (reels.find((reel) => reel.slug === effectiveSlug) ?? null)
    : null;
  const seoDescription = seoReel
    ? getReelShareMessage(seoReel, t)
    : t("watchBuy.metaDescription");
  const seoImage = seoReel ? getReelShareImageUrl(seoReel) : null;
  const canonical = effectiveSlug
    ? `/watch-and-buy/?slug=${encodeURIComponent(effectiveSlug)}`
    : "/watch-and-buy/";
  const viewerReels =
    activeReelProfileId == null
      ? reels
      : reels.filter((reel) => reel.profile.id === activeReelProfileId);

  return (
    <>
      <DynamicSEO
        title={seoReel ? t("watchBuy.share.seoTitle") : t("watchBuy.title")}
        description={seoDescription}
        canonical={canonical}
        ogType={seoReel ? "article" : "website"}
        ogDescription={seoDescription}
        ogImage={seoImage ?? undefined}
        ogImageAlt={seoReel ? t("watchBuy.share.previewAlt") : undefined}
        twitterDescription={seoDescription}
        twitterImage={seoImage ?? undefined}
        twitterImageAlt={seoReel ? t("watchBuy.share.previewAlt") : undefined}
      />

      <div className="min-h-dvh bg-content2">
        <StoriesRail
          failed={storiesFailed}
          items={stories}
          onRetry={retry}
          onSelect={openStory}
        />

        {reelsFailed && reels.length === 0 ? (
          <div className="mx-auto max-w-site px-4 py-16">
            <ErrorState
              title={t("watchBuy.error.title")}
              description={t("watchBuy.error.description")}
              retryLabel={t("common.retry")}
              onRetry={retry}
            />
          </div>
        ) : reels.length === 0 ? (
          <div className="mx-auto max-w-site px-4 py-16">
            <EmptyState
              title={t("watchBuy.empty.title")}
              description={t("watchBuy.empty.description")}
              actionLabel={t("watchBuy.empty.action")}
              onAction={() => router.push("/products")}
              icon={
                <Icon
                  icon="solar:clapperboard-play-linear"
                  className="text-5xl text-primary"
                />
              }
            />
          </div>
        ) : (
          <ReelsExploreGrid
            reels={reels}
            hasMore={hasMore}
            isPageHeading={stories.length === 0 && !storiesFailed}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            onOpen={openReel}
          />
        )}
      </div>

      {activeReelId != null ? (
        <ReelViewer
          key={activeReelProfileId ?? "all-reels"}
          activeReelId={activeReelId}
          reels={viewerReels}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isSuspended={Boolean(activeStory) || Boolean(activeShare)}
          likingReelIds={likingReelIds}
          onActiveReelChange={setActiveReel}
          onClose={closeReel}
          onLike={toggleLike}
          onLoadMore={loadMore}
          onOpenProfile={openReelProfile}
          onShare={shareReel}
        />
      ) : null}

      <ReelShareSheet
        isOpen={Boolean(activeShare)}
        reel={activeShare?.reel ?? null}
        url={activeShare?.url ?? ""}
        onOpenChange={(open) => {
          if (!open) setActiveShare(null);
        }}
      />

      {activeStory ? (
        <StoryViewer
          key={activeStory.profile.username}
          profile={activeStory.profile}
          statuses={storyData?.items ?? []}
          isLoading={storyLoading}
          error={storyFailed}
          onClose={closeStory}
          onComplete={completeStory}
          onRetry={() => void openStory(activeStory)}
          onSeen={handleSeen}
        />
      ) : null}
    </>
  );
};

export default WatchBuyView;
