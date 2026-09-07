import { Icon } from "@iconify/react";
import {
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button, Skeleton, Tooltip } from "@/components/ui";
import { useDocumentScrollLock } from "@/features/watchAndBuy/hooks/useDocumentScrollLock";
import {
  getReelWheelDirection,
  getSnappedReelIndex,
} from "@/features/watchAndBuy/navigation";
import type { WatchBuyReel } from "@/types/watchBuy";

import ReelCard from "./ReelCard";

interface ReelViewerProps {
  activeReelId: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  isSuspended: boolean;
  likingReelIds: ReadonlySet<number>;
  onActiveReelChange: (reel: WatchBuyReel) => void;
  onClose: () => void;
  onLike: (reel: WatchBuyReel) => void;
  onLoadMore: () => void;
  onOpenProfile: (reel: WatchBuyReel) => void;
  onShare: (reel: WatchBuyReel) => void;
  reels: WatchBuyReel[];
}

const ReelViewer = ({
  activeReelId,
  hasMore,
  isLoadingMore,
  isSuspended,
  likingReelIds,
  onActiveReelChange,
  onClose,
  onLike,
  onLoadMore,
  onOpenProfile,
  onShare,
  reels,
}: ReelViewerProps) => {
  const { t, i18n } = useTranslation();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);
  const activeReelIdRef = useRef(activeReelId);
  const positionedRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const wheelReleaseTimerRef = useRef<number | null>(null);
  const wheelLockedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);

  useDocumentScrollLock();

  useLayoutEffect(() => {
    if (positionedRef.current) return;
    const feed = feedRef.current;
    const target = feed?.querySelector<HTMLElement>(
      `[data-reel-id="${activeReelId}"]`,
    );
    if (feed && target) {
      feed.scrollTop = target.offsetTop;
      activeReelIdRef.current = activeReelId;
      positionedRef.current = true;
    }
  }, [activeReelId, reels]);

  const updateActiveReel = useCallback(() => {
    const feed = feedRef.current;
    if (!feed || feed.clientHeight === 0) return;

    const index = getSnappedReelIndex(
      feed.scrollTop,
      feed.clientHeight,
      reels.length,
    );
    if (index == null) return;
    const reel = reels[index];
    if (!reel) return;

    if (reel.id !== activeReelIdRef.current) {
      activeReelIdRef.current = reel.id;
      onActiveReelChange(reel);
    }

    if (index >= reels.length - 3 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onActiveReelChange, onLoadMore, reels]);

  const handleScroll = useCallback(() => {
    if (scrollFrameRef.current != null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateActiveReel();
    });
  }, [updateActiveReel]);

  const moveReel = useCallback(
    (direction: -1 | 1) => {
      const feed = feedRef.current;
      if (!feed || feed.clientHeight === 0) return;

      const currentIndex = getSnappedReelIndex(
        feed.scrollTop,
        feed.clientHeight,
        reels.length,
      );
      if (currentIndex == null) return;
      const nextIndex = Math.max(
        0,
        Math.min(reels.length - 1, currentIndex + direction),
      );
      feed.scrollTo({
        top: nextIndex * feed.clientHeight,
        behavior: "smooth",
      });
    },
    [reels.length],
  );

  const handleViewerWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (isSuspended || event.target !== event.currentTarget) return;

      const direction = getReelWheelDirection(event.deltaX, event.deltaY);
      if (direction === 0) return;

      event.preventDefault();
      if (wheelLockedRef.current) return;

      wheelLockedRef.current = true;
      moveReel(direction);
      if (wheelReleaseTimerRef.current != null) {
        window.clearTimeout(wheelReleaseTimerRef.current);
      }
      wheelReleaseTimerRef.current = window.setTimeout(() => {
        wheelLockedRef.current = false;
        wheelReleaseTimerRef.current = null;
      }, 450);
    },
    [isSuspended, moveReel],
  );

  useEffect(
    () => () => {
      if (scrollFrameRef.current != null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
      if (wheelReleaseTimerRef.current != null) {
        window.clearTimeout(wheelReleaseTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFrame = window.requestAnimationFrame(() => dialog?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSuspended) onClose();
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(selector),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isSuspended, onClose, reels.length]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("watchBuy.reels.viewerLabel")}
      tabIndex={-1}
      onKeyDownCapture={(event) => {
        if (isSuspended) return;
        if (
          event.key !== "ArrowDown" &&
          event.key !== "PageDown" &&
          event.key !== "ArrowUp" &&
          event.key !== "PageUp"
        )
          return;

        event.preventDefault();
        event.stopPropagation();
        moveReel(
          event.key === "ArrowDown" || event.key === "PageDown" ? 1 : -1,
        );
      }}
      onWheel={handleViewerWheel}
      className="fixed inset-0 z-overlay flex items-center justify-center bg-shell sm:p-3"
    >
      <div className="relative h-full w-full max-w-full overflow-hidden bg-shell shadow-overlay sm:aspect-reel sm:max-h-full sm:w-auto sm:rounded-xlarge sm:border sm:border-shell-divider">
        <Tooltip content={t("watchBuy.back")}>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={onClose}
            aria-label={t("watchBuy.back")}
            className="absolute start-2 top-2 z-50 bg-transparent text-shell-foreground shadow-none drop-shadow-md transition hover:scale-105 hover:bg-shell/45 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <Icon
              icon={
                i18n.dir() === "rtl"
                  ? "solar:arrow-right-linear"
                  : "solar:arrow-left-linear"
              }
              className="text-3xl"
            />
          </Button>
        </Tooltip>

        <section
          ref={feedRef}
          role="feed"
          aria-label={t("watchBuy.reels.feedLabel")}
          onScroll={handleScroll}
          className="scrollbar-hide h-full touch-pan-y snap-y snap-mandatory overflow-y-auto overscroll-none bg-shell"
        >
          {reels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              isLikePending={likingReelIds.has(reel.id)}
              isMuted={isMuted}
              isSuspended={isSuspended}
              onLike={onLike}
              onMutedChange={setIsMuted}
              onOpenProfile={() => onOpenProfile(reel)}
              onShare={onShare}
            />
          ))}
          {isLoadingMore ? (
            <Skeleton className="h-full w-full snap-start rounded-none" />
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default ReelViewer;
