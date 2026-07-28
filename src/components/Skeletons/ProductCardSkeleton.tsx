import { FC } from "react";
import { Card, Skeleton } from "@/components/ui";

/**
 * Loading state for the listing grid — mirrors the simplified redesign card:
 * square media, a brand · rating row, two title lines and the price row. No
 * add-to-bag bar (the card has none).
 */
const ProductCardSkeleton: FC = () => {
  return (
    <Card as="div" className="w-full h-full border border-divider" shadow="none">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <Skeleton className="w-16 h-3 rounded-lg" />
          <Skeleton className="w-10 h-3 rounded-lg" />
        </div>
        <Skeleton className="w-full h-4 rounded-lg" />
        <Skeleton className="w-2/3 h-4 rounded-lg" />
        <Skeleton className="w-24 h-5 rounded-lg mt-1" />
      </div>
    </Card>
  );
};

export default ProductCardSkeleton;
