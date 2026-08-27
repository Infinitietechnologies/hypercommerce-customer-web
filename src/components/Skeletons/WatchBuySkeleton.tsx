import { Skeleton } from "@/components/ui";

const WatchBuySkeleton = () => (
  <div className="min-h-dvh bg-content2">
    <div className="border-b border-divider bg-content1 px-4 py-4">
      <div className="mx-auto max-w-site">
        <Skeleton className="mb-3 h-6 w-40 rounded-small" />
        <div className="flex gap-3 overflow-hidden">
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
    <Skeleton className="mx-auto h-dvh w-full rounded-none md:aspect-reel md:w-auto md:max-w-md" />
  </div>
);

export default WatchBuySkeleton;
