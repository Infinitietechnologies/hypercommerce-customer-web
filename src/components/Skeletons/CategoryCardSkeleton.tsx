import { Skeleton } from "@/components/ui";
import { FC } from "react";

/**
 * Loading state for a category tile — a compact image card with a caption,
 * matching the redesign category cards.
 */
const CategoryCardSkeleton: FC = () => {
  return (
    <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-large border border-divider">
      <Skeleton className="aspect-[5/3] w-full rounded-none" />
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        <Skeleton className="h-3 w-3/4 rounded" />
        <Skeleton className="h-2.5 w-1/3 rounded" />
      </div>
    </div>
  );
};

export default CategoryCardSkeleton;
