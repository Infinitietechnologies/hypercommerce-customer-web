import { useCallback, useEffect, useRef, useState } from "react";

import { getWatchBuyReels, getWatchBuyStatuses } from "@/services/watchBuy";
import type {
  WatchBuyReel,
  WatchBuyReelsResponse,
  WatchBuyStatusSummary,
  WatchBuyStatusesResponse,
} from "@/types/watchBuy";

interface UseWatchBuyFeedOptions {
  enabled?: boolean;
  initialReels?: WatchBuyReelsResponse;
  initialStatuses?: WatchBuyStatusesResponse;
  slug?: string;
}

export const useWatchBuyFeed = ({
  enabled = true,
  initialReels,
  initialStatuses,
  slug,
}: UseWatchBuyFeedOptions) => {
  const [reels, setReels] = useState<WatchBuyReel[]>(
    initialReels?.data?.items ?? [],
  );
  const [stories, setStories] = useState<WatchBuyStatusSummary[]>(
    initialStatuses?.data?.items ?? [],
  );
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialReels?.data?.meta.next_cursor ?? null,
  );
  const [sessionId, setSessionId] = useState(
    initialReels?.data?.meta.session_id ?? "",
  );
  const [isLoading, setIsLoading] = useState(!initialReels || !initialStatuses);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reelsFailed, setReelsFailed] = useState(
    initialReels ? !initialReels.success : false,
  );
  const [storiesFailed, setStoriesFailed] = useState(
    initialStatuses ? !initialStatuses.success : false,
  );
  const loadingMoreRef = useRef(false);

  const retry = useCallback(async () => {
    setIsLoading(true);
    const [reelsResponse, statusesResponse] = await Promise.all([
      getWatchBuyReels({ per_page: 10, slug }),
      getWatchBuyStatuses({ per_page: 20 }),
    ]);

    setReelsFailed(!reelsResponse.success);
    setStoriesFailed(!statusesResponse.success);

    if (reelsResponse.success && reelsResponse.data) {
      setReels(reelsResponse.data.items);
      setNextCursor(reelsResponse.data.meta.next_cursor);
      setSessionId(reelsResponse.data.meta.session_id);
    }
    if (statusesResponse.success && statusesResponse.data) {
      setStories(statusesResponse.data.items);
    }
    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    if (!enabled || (initialReels && initialStatuses)) return;
    const timer = window.setTimeout(() => void retry(), 0);
    return () => window.clearTimeout(timer);
  }, [enabled, initialReels, initialStatuses, retry]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    const response = await getWatchBuyReels({
      cursor: nextCursor,
      per_page: 10,
      session_id: sessionId,
    });

    if (response.success && response.data) {
      const data = response.data;
      setReels((current) => {
        const knownIds = new Set(current.map((reel) => reel.id));
        return [
          ...current,
          ...data.items.filter((reel) => !knownIds.has(reel.id)),
        ];
      });
      setNextCursor(data.meta.next_cursor);
    }

    setIsLoadingMore(false);
    loadingMoreRef.current = false;
  }, [nextCursor, sessionId]);

  const setReelLiked = useCallback((reelId: number, liked: boolean) => {
    setReels((current) =>
      current.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              liked_by_me: liked,
              like_count: Math.max(
                0,
                reel.like_count +
                  (liked === reel.liked_by_me ? 0 : liked ? 1 : -1),
              ),
            }
          : reel,
      ),
    );
  }, []);

  const setProfileSeen = useCallback((username: string) => {
    setStories((current) =>
      current.map((story) =>
        story.profile.username === username
          ? {
              ...story,
              profile: { ...story.profile, has_unseen_status: false },
            }
          : story,
      ),
    );
  }, []);

  return {
    hasMore: Boolean(nextCursor),
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
  };
};
