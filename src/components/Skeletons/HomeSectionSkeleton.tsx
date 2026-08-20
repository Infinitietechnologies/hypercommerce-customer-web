import { FC } from "react";

import { Skeleton } from "@/components/ui";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";

interface HomeSectionSkeletonProps {
  /** How many card placeholders to show. */
  count?: number;
  variant?: "banner" | "cards";
}

/** Loading placeholder for the initial banner or card sections appended later. */
const HomeSectionSkeleton: FC<HomeSectionSkeletonProps> = ({
  count = 4,
  variant = "cards",
}) => {
  if (variant === "banner") {
    return (
      <div className="relative left-1/2 mb-6 w-page -translate-x-1/2 sm:mb-9">
        <Skeleton className="aspect-home-banner-mobile w-full rounded-none md:aspect-home-banner" />
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-9">
      <div className="mb-2.5 sm:mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default HomeSectionSkeleton;
