import type { RefObject } from "react";

import type { Product, ProductVariant } from "@/types/catalog";

export interface ProductCardPricing {
  current: string;
  original: string | null;
  discountPercentage: number;
}

export interface ProductCardLayoutProps {
  product: Product;
  defaultVariant: ProductVariant;
  productHref: string;
  images: string[];
  pricing: ProductCardPricing;
  shortDescription: string;
  detailTags: string[];
  rating: number;
  hasRating: boolean;
  isFavorited: boolean;
  isWishlistMode: boolean;
  isFavoriteLoading: boolean;
  isAddingToCart: boolean;
  isOutOfStock: boolean;
  showAddToCart: boolean;
  productRef: RefObject<HTMLDivElement | null>;
  onProductClick: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onAddToCart: () => void;
}
