import React, { useMemo } from "react";
import ProductCard from "@/components/Cards/ProductCard";
import { Product, WishlistItem } from "@/types/ApiResponse";

interface WishlistProductCardProps {
  item: WishlistItem;
  removing: boolean;
  onRemove: () => void;
}

/**
 * Wishlist card = the storefront ProductCard, reused as-is, plus an Add-to-Cart
 * button. The wishlist API returns a leaner shape than a catalog Product (a
 * single image, one variant, no rating/badge/category), so we adapt it to the
 * Product shape ProductCard expects. Fields with no wishlist equivalent are
 * left empty and ProductCard hides them (rating, badge, carousel, discount).
 */
const toProduct = (item: WishlistItem): Product =>
  ({
    id: item.product.id,
    slug: item.product.slug,
    title: item.product.title,
    short_description: item.product.short_description ?? "",
    main_image: item.product.image,
    additional_images: [],
    brand_name: null,
    category_name: "",
    ratings: 0,
    rating_count: 0,
    is_sponsored: false,
    badge: null,
    favorite: item.variant ? [{ variant_id: item.variant.id }] : [],
    variants: [
      {
        id: item.variant?.id,
        price: item.variant?.price ?? 0,
        special_price: 0,
        store_id: item.store.id,
        is_default: true,
      },
    ],
  }) as unknown as Product;

const WishlistProductCard: React.FC<WishlistProductCardProps> = ({
  item,
  removing,
  onRemove,
}) => {
  const product = useMemo(() => toProduct(item), [item]);

  return (
    <ProductCard
      product={product}
      showAddToCart
      onWishlistRemove={onRemove}
      isWishlistRemoving={removing}
    />
  );
};

export default WishlistProductCard;
