import { Icon } from "@iconify/react";
import { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import DynamicSEO from "@/SEO/DynamicSEO";
import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import WatchBuySkeleton from "@/components/Skeletons/WatchBuySkeleton";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  toastError,
  toastSuccess,
} from "@/components/ui";
import ProductSheet from "@/features/watchAndBuy/components/ProductSheet";
import ReelCard from "@/features/watchAndBuy/components/ReelCard";
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
  const seenStatusIds = useRef(new Set<number>());

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

  const showStoryProducts = useCallback(
    (products: WatchBuyProduct[]) => {
      void closeStory();
      showProducts(products);
    },
    [closeStory, showProducts],
  );

  const toggleLike = useCallback(
    async (reel: WatchBuyReel) => {
      if (!isLoggedIn) {
        authSheetStore.open({ next: router.asPath });
        return;
      }

      const nextLiked = !reel.liked_by_me;
      setReelLiked(reel.id, nextLiked);
      const response = await updateWatchBuyLikes([
        { reel_id: reel.id, liked: nextLiked },
      ]);
      if (!response.success) {
        setReelLiked(reel.id, reel.liked_by_me);
        toastError(t("watchBuy.reels.likeFailed"));
      }
    },
    [isLoggedIn, router.asPath, setReelLiked, t],
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
        } else {
          await navigator.clipboard.writeText(url);
          toastSuccess(t("watchBuy.linkCopied"));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
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
          <section
            aria-label={t("watchBuy.reels.feedLabel")}
            className="h-dvh snap-y snap-mandatory overflow-y-auto bg-shell"
          >
            {reels.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                onLike={toggleLike}
                onOpenProfile={openStory}
                onShare={shareReel}
                onShowProducts={showProducts}
              />
            ))}
            <InfiniteSentinel
              hasMore={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={loadMore}
              rootMargin="1200px"
            />
            {isLoadingMore ? (
              <Skeleton className="mx-auto h-dvh w-full snap-start rounded-none md:aspect-reel md:w-auto md:max-w-md" />
            ) : null}
          </section>
        )}
      </div>

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
