import { Skeleton } from "@/components/ui";
import React from "react";

interface SkeletonTabButtonProps {
  /** `sm` = the flat home strip; `lg` = the stacked subcategory card. */
  size?: "sm" | "lg";
}

/**
 * Loading placeholder for a category tab. `sm` mirrors the flat inline strip
 * TabButton (icon + label on an underline row); `lg` mirrors the stacked
 * subcategory card.
 */
const SkeletonTabButton: React.FC<SkeletonTabButtonProps> = ({ size = "sm" }) => {
  if (size === "lg") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-1 py-2 sm:min-w-[80px] lg:min-w-[110px] lg:px-4 lg:py-3 border-b-2 border-transparent">
        <Skeleton className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-large" />
        <Skeleton className="h-3 w-12 lg:h-4 lg:w-16 rounded-sm mt-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 px-2.5 py-1.5 sm:flex-row sm:gap-1.5 sm:px-3.5 sm:py-[11px] whitespace-nowrap border-b-2 border-transparent">
      <Skeleton className="h-6 w-6 sm:h-5 sm:w-5 rounded-md" />
      <Skeleton className="h-3 w-10 sm:w-12 rounded-sm" />
    </div>
  );
};

export default SkeletonTabButton;
