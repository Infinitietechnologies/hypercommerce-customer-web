import React from "react";
import { useRouter } from "next/router";
import { Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "@/components/ui";
import PageHeader from "@/components/custom/PageHeader";
import WishlistProductCard from "@/components/Cards/WishlistProductCard";
import { WishlistItem } from "@/types/ApiResponse";

interface WishListPageViewProps {
  items: WishlistItem[];
  loading: boolean;
  error?: string;
  removingId: number | null;
  onRemove: (item: WishlistItem) => void;
  onRetry: () => void;
}

const WishListPageView: React.FC<WishListPageViewProps> = ({
  items,
  loading,
  error,
  removingId,
  onRemove,
  onRetry,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title={t("pageTitle.wishlists")}
        subtitle={t("pages.wishlistsPage.subtitle", "Products you saved for later")}
      />

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="rounded-large">
              <div className="aspect-square w-full bg-default-200" />
            </Skeleton>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title={t("pages.wishlistsPage.errorTitle", "Couldn't load wishlist")}
          description={error}
          retryLabel={t("retry", "Retry")}
          onRetry={onRetry}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={
            <Icon icon="solar:heart-linear" width={40} height={40} className="text-primary-600" />
          }
          title={t("wishlist_emptyItemsTitle", "No items in your wishlist")}
          description={t(
            "wishlist_emptyItemsDescription",
            "Start adding items to see them here",
          )}
          actionLabel={t("orders_empty_button", "Browse products")}
          onAction={() => router.push("/")}
        />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistProductCard
              key={item.id}
              item={item}
              removing={removingId === item.id}
              onRemove={() => onRemove(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishListPageView;
