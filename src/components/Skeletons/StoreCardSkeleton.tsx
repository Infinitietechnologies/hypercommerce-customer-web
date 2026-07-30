import { FC } from "react";
import { Skeleton } from "@heroui/react";

const StoreCardSkeleton: FC = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-large border border-divider bg-content1">
      <div className="relative aspect-[16/9] w-full">
        <Skeleton className="absolute inset-0" />
        <div className="absolute -bottom-5 left-3">
          <Skeleton className="h-12 w-12 rounded-large sm:h-14 sm:w-14" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-7">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-2/3 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default StoreCardSkeleton;
