import React from "react";
import { Skeleton } from "@heroui/react";

const StoreProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full overflow-hidden rounded-large border border-divider bg-content1">
      <div className="relative aspect-[3/1] max-h-[300px] w-full">
        <Skeleton className="absolute inset-0" />
      </div>

      <div className="px-4 pb-6 sm:px-6">
        <div className="-mt-10 sm:-mt-12">
          <Skeleton className="h-20 w-20 rounded-large sm:h-24 sm:w-24" />
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>

          <div className="max-w-3xl space-y-2">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-5/6 rounded-md" />
          </div>

          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileSkeleton;
