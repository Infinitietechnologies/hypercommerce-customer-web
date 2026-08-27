import { Icon } from "@iconify/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Image, Skeleton } from "@/components/ui";
import type {
  WatchBuyProduct,
  WatchBuyProfile,
  WatchBuyStatus,
} from "@/types/watchBuy";

interface StoryViewerProps {
  error: boolean;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSeen: (statusId: number) => void;
  onShowProducts: (products: WatchBuyProduct[]) => void;
  profile: WatchBuyProfile;
  statuses: WatchBuyStatus[];
}

const IMAGE_DURATION_MS = 5000;
const PROGRESS_TICK_MS = 100;

const StoryViewer = ({
  error,
  isLoading,
  onClose,
  onRetry,
  onSeen,
  onShowProducts,
  profile,
  statuses,
}: StoryViewerProps) => {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const current = statuses[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex >= statuses.length - 1) {
      onClose();
      return;
    }
    setProgress(0);
    setCurrentIndex((index) => index + 1);
  }, [currentIndex, onClose, statuses.length]);

  const goPrevious = useCallback(() => {
    setProgress(0);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  useEffect(() => {
    if (!current) return;
    onSeen(current.id);

    if (current.content_type === "video") return;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const nextProgress = Math.min(
        100,
        ((Date.now() - startedAt) / IMAGE_DURATION_MS) * 100,
      );
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(timer);
        goNext();
      }
    }, PROGRESS_TICK_MS);

    return () => window.clearInterval(timer);
  }, [current, goNext, onSeen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFrame = window.requestAnimationFrame(() => {
      dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
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
  }, [goNext, goPrevious, onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
      aria-modal="true"
      aria-label={t("watchBuy.stories.viewerLabel", {
        username: profile.username,
      })}
      className="fixed inset-0 z-overlay grid place-items-center bg-shell"
    >
      <div className="relative h-dvh w-full overflow-hidden bg-shell md:aspect-reel md:h-dvh md:w-auto md:border-x md:border-shell-divider">
        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-shell to-transparent px-3 pb-8 pt-3">
          <div className="mb-3 flex gap-1" aria-hidden="true">
            {statuses.map((status, index) => (
              <span
                key={status.id}
                className="h-1 flex-1 overflow-hidden rounded-full bg-shell-foreground/30"
              >
                <span
                  className="block h-full rounded-full bg-shell-foreground transition-[width] duration-100 motion-reduce:transition-none"
                  style={{
                    width: `${
                      index < currentIndex
                        ? 100
                        : index === currentIndex
                          ? progress
                          : 0
                    }%`,
                  }}
                />
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-shell-foreground">
            <Image
              removeWrapper
              disableAnimation
              src={profile.photo_url ?? undefined}
              alt=""
              radius="full"
              className="size-9 border border-shell-divider object-cover"
              fallbackSrc="/logo.png"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{profile.username}</p>
              {current ? (
                <p className="text-xxs text-shell-muted">
                  {new Date(current.created_at).toLocaleString(i18n.language)}
                </p>
              ) : null}
            </div>
            {current?.content_type === "video" ? (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsMuted((muted) => !muted)}
                aria-label={
                  isMuted
                    ? t("watchBuy.media.unmute")
                    : t("watchBuy.media.mute")
                }
                className="text-shell-foreground"
              >
                <Icon
                  icon={
                    isMuted
                      ? "solar:volume-cross-linear"
                      : "solar:volume-loud-linear"
                  }
                  className="text-xl"
                />
              </Button>
            ) : null}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              aria-label={t("watchBuy.back")}
              className="text-shell-foreground"
            >
              <Icon
                icon={
                  i18n.dir() === "rtl"
                    ? "solar:arrow-right-linear"
                    : "solar:arrow-left-linear"
                }
                className="text-2xl"
              />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : error ? (
          <div className="grid h-full place-items-center px-6 text-center text-shell-foreground">
            <div>
              <Icon
                icon="solar:danger-triangle-linear"
                className="mx-auto mb-3 text-4xl"
              />
              <p className="text-lg font-bold">
                {t("watchBuy.stories.failed")}
              </p>
              <Button className="mt-4" onPress={onRetry}>
                {t("common.retry")}
              </Button>
            </div>
          </div>
        ) : current ? (
          <>
            <div className="absolute inset-0 grid place-items-center">
              {current.content_type === "video" && current.media_url ? (
                <video
                  ref={videoRef}
                  key={current.id}
                  src={current.media_url}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onEnded={goNext}
                  onTimeUpdate={(event) => {
                    const media = event.currentTarget;
                    if (media.duration > 0) {
                      setProgress((media.currentTime / media.duration) * 100);
                    }
                  }}
                  className="h-full w-full object-contain"
                >
                  <track
                    default
                    kind="captions"
                    src="/captions/empty.vtt"
                    srcLang="en"
                    label={t("watchBuy.media.captions")}
                  />
                </video>
              ) : current.media_url ? (
                <Image
                  removeWrapper
                  disableAnimation
                  src={current.media_url}
                  alt={current.text ?? ""}
                  radius="none"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-content2 px-8 text-center text-2xl font-extrabold leading-tight text-foreground">
                  {current.text}
                </div>
              )}
            </div>

            <button
              type="button"
              aria-label={t("watchBuy.stories.previous")}
              onClick={goPrevious}
              className="absolute inset-y-20 start-0 z-10 w-1/3 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-focus"
            />
            <button
              type="button"
              aria-label={t("watchBuy.stories.next")}
              onClick={goNext}
              className="absolute inset-y-20 end-0 z-10 w-1/3 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-focus"
            />

            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-shell via-shell/80 to-transparent px-4 pb-8 pt-16 text-shell-foreground">
              {current.text && current.media_url ? (
                <p className="mb-3 line-clamp-3 text-sm font-medium leading-5">
                  {current.text}
                </p>
              ) : null}
              {current.products.length > 0 ? (
                <Button
                  fullWidth
                  color="primary"
                  startContent={<Icon icon="solar:bag-3-bold" />}
                  onPress={() => onShowProducts(current.products)}
                >
                  {t("watchBuy.products.viewCount", {
                    count: current.products.length,
                  })}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-shell-foreground">
            <p className="font-semibold">
              {t("watchBuy.stories.emptyProfile")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
