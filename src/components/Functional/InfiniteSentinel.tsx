import { FC, useEffect, useRef } from "react";

interface InfiniteSentinelProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  /** Pre-fetch distance before the sentinel enters the viewport. */
  rootMargin?: string;
}

/**
 * IntersectionObserver-based infinite-scroll trigger. Renders an invisible
 * sentinel; when it nears the viewport, `onLoadMore` fires. Works regardless of
 * whether the window or a container scrolls (unlike scroll-position math).
 */
const InfiniteSentinel: FC<InfiniteSentinelProps> = ({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "600px",
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    loadingRef.current = isLoading;
    hasMoreRef.current = hasMore;
    onLoadMoreRef.current = onLoadMore;
  }, [isLoading, hasMore, onLoadMore]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (!hasMore) return null;

  return <div ref={ref} aria-hidden className="h-px w-full" />;
};

export default InfiniteSentinel;
