import { Skeleton } from "@/components/ui";

const WatchBuySkeleton = () => (
  <div className="min-h-dvh bg-content2">
    <div className="border-b border-divider bg-content1 px-4 py-4">
      <div className="mx-auto max-w-site">
        <div className="mb-3 md:mb-4">
          <Skeleton className="mb-2 h-6 w-40 rounded-small" />
          <Skeleton className="h-3 w-56 max-w-full rounded-small" />
        </div>
        <div className="flex min-w-0 gap-3 overflow-hidden min-[1024px]:gap-4">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="flex shrink-0 flex-col items-center gap-2"
            >
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-3 w-14 rounded-small" />
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="mx-auto w-full max-w-site px-3 py-5 sm:px-4 md:px-6">
      <Skeleton className="mb-2 h-6 w-48 rounded-small" />
      <Skeleton className="mb-4 h-4 w-72 max-w-full rounded-small" />
      <div className="columns-2 gap-2 md:columns-3 md:gap-3 min-[1024px]:columns-4">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton
            key={index}
            className={`mb-2 w-full break-inside-avoid rounded-large md:mb-3 ${
              index % 5 === 0 ? "aspect-square" : "aspect-reel"
            }`}
          />
        ))}
      </div>
    </div>
  </div>
);

export default WatchBuySkeleton;
