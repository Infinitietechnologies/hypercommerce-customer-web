import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import { getStoryDisplayDurationMs } from "@/features/watchAndBuy/storyTiming";
import type { WatchBuyStatus } from "@/types/watchBuy";

interface StoryProgressBarsProps {
  currentIndex: number;
  isPaused: boolean;
  isReady: boolean;
  onFinished: () => void;
  status: WatchBuyStatus;
  statuses: WatchBuyStatus[];
  videoRef: RefObject<HTMLVideoElement | null>;
}

const StoryProgressBars = ({
  currentIndex,
  isPaused,
  isReady,
  onFinished,
  status,
  statuses,
  videoRef,
}: StoryProgressBarsProps) => {
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!isReady || isPaused) return;

    let frame = 0;
    let lastFrame = performance.now();
    const isVideo = status.content_type === "video" && status.media_url;

    const update = (now: number) => {
      if (isVideo) {
        const media = videoRef.current;
        const mediaDuration = media?.duration;
        const durationMs =
          mediaDuration && Number.isFinite(mediaDuration)
            ? mediaDuration * 1000
            : getStoryDisplayDurationMs(status.duration_ms);
        setProgress(
          Math.min(100, ((media?.currentTime ?? 0) * 1000 * 100) / durationMs),
        );
      } else {
        elapsedRef.current += Math.min(now - lastFrame, 100);
        const nextProgress = Math.min(
          100,
          (elapsedRef.current / getStoryDisplayDurationMs(status.duration_ms)) *
            100,
        );
        setProgress(nextProgress);
        if (nextProgress >= 100) {
          onFinished();
          return;
        }
      }

      lastFrame = now;
      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [isPaused, isReady, onFinished, status, videoRef]);

  return (
    <div className="mb-3 flex gap-1" aria-hidden="true">
      {statuses.map((item, index) => {
        const itemProgress =
          index < currentIndex ? 100 : index === currentIndex ? progress : 0;

        return (
          <span
            key={item.id}
            className="h-1 flex-1 overflow-hidden rounded-full bg-shell-foreground/30"
          >
            <span
              data-story-progress-active={index === currentIndex || undefined}
              className="block h-full origin-left rounded-full bg-shell-foreground will-change-transform rtl:origin-right"
              style={{ transform: `scaleX(${itemProgress / 100})` }}
            />
          </span>
        );
      })}
    </div>
  );
};

export default StoryProgressBars;
