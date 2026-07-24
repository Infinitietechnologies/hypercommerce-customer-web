import { FC } from "react";
import { Card, Skeleton } from "@/components/ui";

/**
 * Loading state for the listing grid — mirrors the amber redesign card
 * (Claude Design handoff `src/components/ProductCardSkeleton.jsx`):
 * square media block, then store/rating, two title lines and the price row.
 */
const ProductCardSkeleton: FC = () => {
  return (
    <Card as="div" className="w-full h-full border border-divider" shadow="none">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <Skeleton className="w-16 h-3 rounded-lg" />
        <Skeleton className="w-full h-4 rounded-lg" />
        <Skeleton className="w-2/3 h-4 rounded-lg" />
        <Skeleton className="w-24 h-5 rounded-lg mt-1" />
        <Skeleton className="w-full h-9 rounded-lg mt-2" />
      </div>
    </Card>
  );
};

export default ProductCardSkeleton;
