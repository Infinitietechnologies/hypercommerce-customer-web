import React from "react";
import { Skeleton } from "@heroui/react";

const AddressCardSkeleton = () => {
  return (
    <div className="flex items-start justify-between gap-3 rounded-medium border border-divider bg-content1 p-4">
      <div className="min-w-0 space-y-2">
        <Skeleton className="rounded-full">
          <div className="h-5 w-16 bg-default-200" />
        </Skeleton>
        <Skeleton className="rounded-lg">
          <div className="h-4 w-48 bg-default-200" />
        </Skeleton>
        <Skeleton className="rounded-lg">
          <div className="h-3 w-64 bg-default-200" />
        </Skeleton>
        <Skeleton className="rounded-lg">
          <div className="h-3 w-24 bg-default-200" />
        </Skeleton>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Skeleton className="rounded-medium">
          <div className="h-8 w-8 bg-default-200" />
        </Skeleton>
        <Skeleton className="rounded-lg">
          <div className="h-5 w-8 bg-default-200" />
        </Skeleton>
        <Skeleton className="rounded-medium">
          <div className="h-8 w-8 bg-default-200" />
        </Skeleton>
      </div>
    </div>
  );
};

export default AddressCardSkeleton;
