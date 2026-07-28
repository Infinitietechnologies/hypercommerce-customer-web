import { FC } from "react";
import { Skeleton } from "@heroui/react";

/** Loading placeholder mirroring the redesign order-list row. */
const OrderCardSkeleton: FC = () => {
  return (
    <div className="flex items-center gap-3.5 rounded-medium border border-divider bg-content1 p-3.5 shadow-sm">
      <Skeleton className="h-14 w-14 rounded-medium shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-3 w-40 rounded-md" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full shrink-0" />
      <Skeleton className="h-4 w-16 rounded-md shrink-0" />
    </div>
  );
};

export default OrderCardSkeleton;
