import { Icon } from "@iconify/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import { Button, Skeleton, Tooltip } from "@/components/ui";
import type { WatchBuyReel } from "@/types/watchBuy";

import ReelCard from "./ReelCard";

interface ReelViewerProps {
  activeReelId: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  isSuspended: boolean;
  likingReelIds: ReadonlySet<number>;
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
  onClose,
  onLike,
  onLoadMore,
  onOpenProfile,
  onShare,
  reels,
}: ReelViewerProps) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useLayoutEffect(() => {
    const feed = feedRef.current;
    const target = feed?.querySelector<HTMLElement>(
      `[data-reel-id="${activeReelId}"]`,
    );
    if (feed && target) feed.scrollTop = target.offsetTop;
  }, [activeReelId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFrame = window.requestAnimationFrame(() => {
      dialog?.querySelector<HTMLElement>(selector)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "ArrowUp" ||
        event.key === "PageUp"
      ) {
        const feed = feedRef.current;
        if (feed) {
          event.preventDefault();
          const direction =
            event.key === "ArrowDown" || event.key === "PageDown" ? 1 : -1;
          const currentIndex = Math.round(feed.scrollTop / feed.clientHeight);
          const nextIndex = Math.max(
            0,
            Math.min(reels.length - 1, currentIndex + direction),
          );
          feed.scrollTo({
            top: nextIndex * feed.clientHeight,
            behavior: "smooth",
          });
        }
      }
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
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, reels.length]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("watchBuy.reels.viewerLabel")}
      tabIndex={-1}
      className="fixed inset-0 z-overlay flex items-center justify-center bg-shell p-2 sm:p-3"
    >
      <div className="relative h-full w-full max-w-full overflow-hidden rounded-xlarge border border-shell-divider bg-shell shadow-overlay sm:aspect-reel sm:max-h-full sm:w-auto">
        <Tooltip content={t("watchBuy.back")}>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={onClose}
            aria-label={t("watchBuy.back")}
            className="absolute end-3 top-3 z-50 bg-shell/65 text-shell-foreground shadow-overlay backdrop-blur-md transition hover:scale-105 hover:bg-shell-foreground/15 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <Icon icon="solar:close-circle-linear" className="text-2xl" />
          </Button>
        </Tooltip>

        <section
          ref={feedRef}
          aria-label={t("watchBuy.reels.feedLabel")}
          className="scrollbar-hide h-full snap-y snap-mandatory overflow-y-auto overscroll-contain bg-shell"
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
          <InfiniteSentinel
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={onLoadMore}
            rootMargin="1200px"
          />
          {isLoadingMore ? (
            <Skeleton className="h-full w-full snap-start rounded-none" />
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default ReelViewer;
