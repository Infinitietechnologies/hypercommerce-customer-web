import React, { memo, useCallback } from "react";
import { Avatar, Chip } from "@/components/ui";
import { Icon } from "@iconify/react";
import { Product } from "@/types/ApiResponse";
import { useRouter } from "next/router";
import { useAdTracking } from "@/hooks/useAdTracking";

type Props = {
  product: Product;
  onProductClick: (product: Product) => void;
  formatDeliveryTime: (time: number | null) => string;
  searchQuery: string;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onClose: () => void;
};

const SearchProductCard: React.FC<Props> = ({
  product,
  onProductClick,
  formatDeliveryTime,
  searchQuery,
  isActive = false,
  onMouseEnter,
  onClose = () => {},
}) => {
  const { elementRef, handleAdClick } = useAdTracking(product);

  const handlePress = useCallback(() => {
    handleAdClick();
    onProductClick(product);
  }, [product, onProductClick, handleAdClick]);
  const router = useRouter();

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="font-semibold text-primary">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div
      ref={elementRef}
      onClick={handlePress}
      onMouseEnter={onMouseEnter}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handlePress();
      }}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-default-100 cursor-pointer transition-colors border-b border-divider last:border-b-0 ${
        isActive ? "bg-default-100" : ""
      }`}
    >
      <Avatar
        src={product.main_image}
        alt={product.title}
        size="md"
        radius="sm"
        classNames={{ base: "w-12 h-12 shrink-0" }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1">
          {highlightText(product.title, searchQuery)}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {product.category_name && (
            <Chip
              size="sm"
              variant="flat"
              color="default"
              className="text-xs h-5"
              radius="sm"
              title={product.category_name}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/categories/${product.category}`);
                onClose();
              }}
            >
              {product.category_name}
            </Chip>
          )}
          {product.brand_name && (
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              className="text-xs h-5"
              radius="sm"
              title={product.brand_name}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/brands/${product.brand}`);
                onClose();
              }}
            >
              {product.brand_name}
            </Chip>
          )}
        </div>
      </div>
      {(product.rating_count > 0 || Boolean(product.estimated_delivery_time)) && (
        <div className="flex flex-col items-end gap-1 text-xs text-default-500">
          {product.rating_count > 0 && (
            <div className="flex items-center gap-1">
              <Icon icon="solar:star-bold" className="text-rating-star text-sm" />
              <span>{product.ratings}</span>
              <span>({product.rating_count})</span>
            </div>
          )}
          {Boolean(product.estimated_delivery_time) && (
            <div className="flex items-center gap-1">
              <Icon icon="solar:clock-circle-linear" className="text-sm" />
              <span>{formatDeliveryTime(product.estimated_delivery_time)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Memo = memo(SearchProductCard);
Memo.displayName = "SearchProductCard";

export default Memo;
