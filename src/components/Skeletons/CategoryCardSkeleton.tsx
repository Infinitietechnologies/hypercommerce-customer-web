import { Skeleton } from "@/components/ui";
import { FC } from "react";

/**
 * Loading state for a category card — mirrors the pill layout: title + count on
 * the left, icon circle on the right.
 */
const CategoryCardSkeleton: FC = () => {
  return (
    <div className="flex w-full min-w-0 flex-col items-center px-1 py-1">
      <div className="flex h-[68px] w-full items-center justify-between gap-3 overflow-hidden rounded-3xl bg-content2 px-4 sm:h-[76px] sm:px-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-2.5 w-12 rounded" />
        </div>
        <Skeleton className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12" />
      </div>
    </div>
  );
};

export default CategoryCardSkeleton;
