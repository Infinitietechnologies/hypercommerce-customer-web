import { Icon } from "@iconify/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import DynamicSEO from "@/SEO/DynamicSEO";
import WatchBuySkeleton from "@/components/Skeletons/WatchBuySkeleton";
import {
  EmptyState,
  ErrorState,
  toastError,
  toastSuccess,
} from "@/components/ui";
import ProductSheet from "@/features/watchAndBuy/components/ProductSheet";
import ReelsExploreGrid from "@/features/watchAndBuy/components/ReelsExploreGrid";
import ReelViewer from "@/features/watchAndBuy/components/ReelViewer";
import StoriesRail from "@/features/watchAndBuy/components/StoriesRail";
import StoryViewer from "@/features/watchAndBuy/components/StoryViewer";
import { useWatchBuyFeed } from "@/features/watchAndBuy/hooks/useWatchBuyFeed";
import { RootState } from "@/lib/redux/store";
import {
  getWatchBuyProfileStatuses,
  markWatchBuyStatusesSeen,
  updateWatchBuyLikes,
} from "@/services/watchBuy";
import { authSheetStore } from "@/stores/authSheetStore";
import type {
  WatchBuyProduct,
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
  const effectiveSlug =
    slug ??
    (typeof router.query.slug === "string" ? router.query.slug : undefined);
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
  const [selectedProducts, setSelectedProducts] = useState<WatchBuyProduct[]>(
    [],
  );
  const [isProductsOpen, setProductsOpen] = useState(false);
  const [activeReelId, setActiveReelId] = useState<number | null>(null);
  const [likingReelIds, setLikingReelIds] = useState<ReadonlySet<number>>(
    new Set(),
  );
  const openedSlugRef = useRef<string | null>(null);
  const seenStatusIds = useRef(new Set<number>());

  useEffect(() => {
    if (!effectiveSlug || openedSlugRef.current === effectiveSlug) return;
    const target = reels.find((reel) => reel.slug === effectiveSlug);
    if (!target) return;

    openedSlugRef.current = effectiveSlug;
    const timer = window.setTimeout(() => setActiveReelId(target.id), 0);
    return () => window.clearTimeout(timer);
  }, [effectiveSlug, reels]);

  const openStory = useCallback(async (summary: WatchBuyStatusSummary) => {
    if (!summary.profile.has_active_status) return;
    setActiveStory(summary);
    setStoryData(null);
    setStoryFailed(false);
    setStoryLoading(true);
    seenStatusIds.current.clear();

    const response = await getWatchBuyProfileStatuses(
      summary.profile.username,
      { per_page: 50 },
    );

    if (response.success && response.data) {
      setStoryData(response.data);
    } else {
      setStoryFailed(true);
    }
    setStoryLoading(false);
  }, []);

  const closeStory = useCallback(async () => {
    const username = activeStory?.profile.username;
    const statusIds = Array.from(seenStatusIds.current);
    setActiveStory(null);
    setStoryData(null);

    if (username) setProfileSeen(username);
    if (!isLoggedIn || statusIds.length === 0) return;

    const response = await markWatchBuyStatusesSeen(statusIds);
    if (!response.success) {
      toastError(t("watchBuy.stories.seenFailed"));
    }
  }, [activeStory, isLoggedIn, setProfileSeen, t]);

  const handleSeen = useCallback((statusId: number) => {
    seenStatusIds.current.add(statusId);
    setStoryData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((status) =>
              status.id === statusId ? { ...status, seen_by_me: true } : status,
            ),
          }
        : current,
    );
  }, []);

  const showProducts = useCallback((products: WatchBuyProduct[]) => {
    setSelectedProducts(products);
    setProductsOpen(true);
  }, []);

  const closeReel = useCallback(() => {
    setActiveReelId(null);
    if (typeof router.query.slug !== "string") return;

    const nextQuery = { ...router.query };
    delete nextQuery.slug;
    void router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true, scroll: false },
    );
  }, [router]);

  const openReelProfile = useCallback(
    (reel: WatchBuyReel) => {
      if (reel.profile.has_active_status) {
        void openStory({ profile: reel.profile, status_count: 0 });
      }
    },
    [openStory],
  );

  const showReelProducts = useCallback(
    (products: WatchBuyProduct[]) => {
      showProducts(products);
    },
    [showProducts],
  );

  const showStoryProducts = useCallback(
    (products: WatchBuyProduct[]) => {
      showProducts(products);
    },
    [showProducts],
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
      const url = `${window.location.origin}/watch-and-buy?slug=${encodeURIComponent(reel.slug)}`;
      const shareData = {
        title: t("watchBuy.title"),
        text: reel.caption ?? t("watchBuy.shareText"),
        url,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }

      try {
        await navigator.clipboard.writeText(url);
        toastSuccess(t("watchBuy.linkCopied"));
      } catch {
        toastError(t("watchBuy.shareFailed"));
      }
    },
    [t],
  );

  if (isLoading && reels.length === 0 && stories.length === 0) {
    return <WatchBuySkeleton />;
  }

  return (
    <>
      <DynamicSEO
        title={t("watchBuy.title")}
        description={t("watchBuy.metaDescription")}
        canonical="/watch-and-buy"
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
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            onOpen={(reel) => setActiveReelId(reel.id)}
          />
        )}
      </div>

      {activeReelId != null ? (
        <ReelViewer
          activeReelId={activeReelId}
          reels={reels}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isSuspended={Boolean(activeStory) || isProductsOpen}
          likingReelIds={likingReelIds}
          onClose={closeReel}
          onLike={toggleLike}
          onLoadMore={loadMore}
          onOpenProfile={openReelProfile}
          onShare={shareReel}
          onShowProducts={showReelProducts}
        />
      ) : null}

      {activeStory ? (
        <StoryViewer
          key={activeStory.profile.username}
          profile={activeStory.profile}
          statuses={storyData?.items ?? []}
          isLoading={storyLoading}
          error={storyFailed}
          onClose={() => void closeStory()}
          onRetry={() => void openStory(activeStory)}
          onSeen={handleSeen}
          onShowProducts={showStoryProducts}
        />
      ) : null}

      <ProductSheet
        isOpen={isProductsOpen}
        products={selectedProducts}
        onOpenChange={setProductsOpen}
      />
    </>
  );
};

export default WatchBuyView;
