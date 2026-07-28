import { Skeleton } from "@/components/ui";
import { FC } from "react";

/**
 * Loading state for a brand tile — a compact logo card with a caption,
 * matching the redesign BrandCard (smaller logo, not a full square).
 */
const BrandCardSkeleton: FC = () => (
  <div className="flex flex-col items-center w-full min-w-0">
    <Skeleton className="w-full h-[72px] sm:h-20 rounded-large" />
    <Skeleton className="w-2/3 h-3 mt-2 rounded" />
  </div>
);

export default BrandCardSkeleton;
