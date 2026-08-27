import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import { Button, Skeleton } from "@/components/ui";
import type { WatchBuyProduct, WatchBuyReel } from "@/types/watchBuy";

import ReelCard from "./ReelCard";

interface ReelViewerProps {
  activeReelId: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onClose: () => void;
  onLike: (reel: WatchBuyReel) => void;
  onLoadMore: () => void;
  onOpenProfile: (reel: WatchBuyReel) => void;
  onShare: (reel: WatchBuyReel) => void;
  onShowProducts: (products: WatchBuyProduct[]) => void;
  reels: WatchBuyReel[];
}

const ReelViewer = ({
  activeReelId,
  hasMore,
  isLoadingMore,
  onClose,
  onLike,
  onLoadMore,
  onOpenProfile,
  onShare,
  onShowProducts,
  reels,
}: ReelViewerProps) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const feed = feedRef.current;
    const target = feed?.querySelector<HTMLElement>(
      `[data-reel-id="${activeReelId}"]`,
    );
    const frame = window.requestAnimationFrame(() => {
      if (feed && target) feed.scrollTop = target.offsetTop;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeReelId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
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
      className="fixed inset-0 z-overlay bg-shell"
    >
      <Button
        isIconOnly
        size="sm"
        variant="flat"
        onPress={onClose}
        aria-label={t("watchBuy.reels.closeViewer")}
        className="fixed end-3 top-3 z-30 bg-shell/60 text-shell-foreground backdrop-blur-md"
      >
        <Icon icon="solar:close-circle-bold" className="text-2xl" />
      </Button>

      <section
        ref={feedRef}
        aria-label={t("watchBuy.reels.feedLabel")}
        className="h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain bg-shell"
      >
        {reels.map((reel) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            onLike={onLike}
            onOpenProfile={() => onOpenProfile(reel)}
            onShare={onShare}
            onShowProducts={onShowProducts}
          />
        ))}
        <InfiniteSentinel
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={onLoadMore}
          rootMargin="1200px"
        />
        {isLoadingMore ? (
          <Skeleton className="mx-auto h-dvh w-full snap-start rounded-none md:aspect-reel md:w-auto md:max-w-md" />
        ) : null}
      </section>
    </div>
  );
};

export default ReelViewer;
