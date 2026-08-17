import clsx from "clsx";
import { FC } from "react";

import { Card, Skeleton } from "@/components/ui";
import { resolveProductCardStyle } from "@/config/productCard";

interface ProductCardSkeletonProps {
  cardStyle?: string | null;
}

const ProductCardSkeleton: FC<ProductCardSkeletonProps> = ({ cardStyle }) => {
  const style = resolveProductCardStyle(cardStyle);
  const isInset = style === "compact" || style === "showcase";
  const isCompact = style === "compact";
  const isMinimal = style === "minimal";
  const isStandard = style === "standard";
  const isShowcase = style === "showcase";

  return (
    <Card
      as="div"
      className={clsx(
        "h-full w-full overflow-hidden rounded-large shadow-sm",
        isInset && "p-2",
        isShowcase && "bg-content2",
      )}
    >
      <Skeleton
        className={clsx(
          "aspect-square w-full",
          isInset ? "rounded-medium" : "rounded-none",
        )}
      />

      <div
        className={clsx(
          "flex grow flex-col gap-2 px-3 py-3",
          isCompact && "px-1 pb-1.5",
          isShowcase && "mt-2 rounded-medium bg-content1 px-3 pb-3",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-16 rounded-medium" />
          <Skeleton className="h-3 w-10 rounded-medium" />
        </div>
        <Skeleton className="h-4 w-full rounded-medium" />
        <Skeleton className="h-4 w-2/3 rounded-medium" />
        {isStandard ? (
          <>
            <Skeleton className="hidden h-3 w-full rounded-medium sm:block" />
            <div className="hidden gap-1.5 sm:flex">
              <Skeleton className="h-6 w-16 rounded-medium" />
              <Skeleton className="h-6 w-20 rounded-medium" />
            </div>
          </>
        ) : null}
        <div className="mt-auto pt-1">
          <Skeleton className="h-5 w-24 rounded-medium" />
        </div>
        {isCompact || isStandard || isShowcase ? (
          <Skeleton className="h-10 w-full rounded-small" />
        ) : null}
        {isMinimal ? <Skeleton className="h-9 w-full rounded-small" /> : null}
        {isStandard ? (
          <div className="flex justify-between border-t border-divider pt-2">
            <Skeleton className="h-3 w-16 rounded-medium" />
            <Skeleton className="h-3 w-14 rounded-medium" />
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default ProductCardSkeleton;
