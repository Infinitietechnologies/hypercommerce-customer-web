import dynamic from "next/dynamic";
import { FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import ProductCardCompact from "@/components/Cards/ProductCardCompact";
import ProductCardMinimal from "@/components/Cards/ProductCardMinimal";
import ProductCardShowcase from "@/components/Cards/ProductCardShowcase";
import ProductCardStandard from "@/components/Cards/ProductCardStandard";
import type { ProductCardLayoutProps } from "@/components/Cards/productCardTypes";
import { toast } from "@/components/ui";
import { resolveProductCardStyle } from "@/config/productCard";
import { useSettings } from "@/contexts/SettingsContext";
import { handleOfflineAddToCart } from "@/helpers/functionalHelpers";
import { getDiscountPercent } from "@/helpers/getters";
import { updateCartData } from "@/helpers/updators";
import { useAdTracking } from "@/hooks/useAdTracking";
import { RootState } from "@/lib/redux/store";
import { addToCart, toggleFavorite } from "@/routes/api";
import type { Product } from "@/types/catalog";

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});

interface ProductCardProps {
  product: Product;
  cardStyle?: string | null;
  showAddToCart?: boolean;
  onWishlistRemove?: () => void;
  isWishlistRemoving?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({
  product,
  cardStyle,
  showAddToCart = true,
  onWishlistRemove,
  isWishlistRemoving = false,
}) => {
  const { formatPrice } = useSettings();
  const { t } = useTranslation();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { elementRef, handleAdClick } = useAdTracking(product);
  const [isFavorited, setIsFavorited] = useState(
    Array.isArray(product.favorite) && product.favorite.length > 0,
  );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isProductModalOpen, setProductModalOpen] = useState(false);

  const variants = product.variants ?? [];
  const defaultVariant =
    variants.find((variant) => variant.is_default) ?? variants[0];

  if (!defaultVariant) return null;

  const resolvedStyle = resolveProductCardStyle(cardStyle);
  const productHref = `/products/${product.slug}`;
  const images = Array.from(
    new Set(
      [product.main_image, ...(product.additional_images ?? [])].filter(
        (image): image is string => Boolean(image),
      ),
    ),
  );
  const isWishlistMode = typeof onWishlistRemove === "function";
  const hasMultipleVariants = variants.length > 1;
  const hasAddons = (defaultVariant.addon_groups?.length ?? 0) > 0;
  const isOutOfStock =
    defaultVariant.availability === false || Number(defaultVariant.stock) <= 0;

  const price = Number(defaultVariant.price) || 0;
  const specialPrice = Number(defaultVariant.special_price) || 0;
  const hasDiscount = specialPrice > 0 && specialPrice < price;
  const discountPercentage = getDiscountPercent(price, specialPrice);
  const rating = Number(product.ratings) || 0;
  const hasRating = (product.rating_count ?? 0) > 0 && rating > 0;
  const shortDescription = (product.short_description ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const detailTags = Array.from(
    new Set([
      ...Object.values(defaultVariant.attributes ?? {}),
      ...(product.tags ?? []),
    ]),
  )
    .filter(Boolean)
    .slice(0, 3);

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      document.getElementById("login-btn")?.click();
      toast({ title: t("please_login"), color: "warning" });
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const response = await toggleFavorite({
        product_id: product.id,
        product_variant_id: defaultVariant.id ?? null,
        store_id: defaultVariant.store_id,
      });

      if (response.success && response.data) {
        setIsFavorited(response.data.is_favorited);
        toast({
          title: response.message || t("pageTitle.wishlist"),
          color: "success",
        });
      } else {
        toast({
          title: response.message || t("something_went_wrong"),
          color: "danger",
        });
      }
    } catch {
      toast({ title: t("something_went_wrong"), color: "danger" });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleAddToCart = async () => {
    if (!defaultVariant.id || isOutOfStock) return;

    if (hasMultipleVariants || hasAddons) {
      setProductModalOpen(true);
      return;
    }

    const quantity = Math.max(
      product.minimum_order_quantity || 1,
      product.quantity_step_size || 1,
    );

    if (!isLoggedIn) {
      handleOfflineAddToCart({
        product,
        variant: defaultVariant,
        quantity,
        renderToast: true,
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      const response = await addToCart({
        product_variant_id: defaultVariant.id,
        store_id: defaultVariant.store_id,
        quantity,
      });

      if (response.success) {
        toast({
          title: t("cart_updated_title"),
          description: t("cart_updated_description"),
          color: "success",
        });
        await updateCartData(true, true, 0, true, false);
      } else {
        toast({
          title: response.message || t("something_went_wrong"),
          color: "danger",
        });
      }
    } catch {
      toast({ title: t("something_went_wrong"), color: "danger" });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const url = `${window.location.origin}${productHref}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title ?? "", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast({ title: t("link_copied"), color: "success" });
      }
    } catch {
      return;
    }
  };

  const layoutProps: ProductCardLayoutProps = {
    product,
    defaultVariant,
    productHref,
    images,
    pricing: {
      current: hasDiscount
        ? (defaultVariant.formatted_special_price ?? formatPrice(specialPrice))
        : (defaultVariant.formatted ?? formatPrice(price)),
      original: hasDiscount
        ? (defaultVariant.formatted ?? formatPrice(price))
        : null,
      discountPercentage,
    },
    shortDescription,
    detailTags,
    rating,
    hasRating,
    isFavorited,
    isWishlistMode,
    isFavoriteLoading: isWishlistMode ? isWishlistRemoving : isTogglingFavorite,
    isAddingToCart,
    isOutOfStock,
    showAddToCart,
    productRef: elementRef,
    onProductClick: handleAdClick,
    onToggleFavorite: isWishlistMode
      ? () => onWishlistRemove?.()
      : handleToggleFavorite,
    onShare: handleShare,
    onAddToCart: handleAddToCart,
  };

  const card =
    resolvedStyle === "compact" ? (
      <ProductCardCompact {...layoutProps} />
    ) : resolvedStyle === "minimal" ? (
      <ProductCardMinimal {...layoutProps} />
    ) : resolvedStyle === "showcase" ? (
      <ProductCardShowcase {...layoutProps} />
    ) : (
      <ProductCardStandard {...layoutProps} />
    );

  return (
    <>
      {card}
      {isProductModalOpen ? (
        <ProductModal
          initialStep={hasMultipleVariants ? "variant" : "addons"}
          isOpen={isProductModalOpen}
          product={product}
          selectedVariant={defaultVariant}
          onClose={() => setProductModalOpen(false)}
        />
      ) : null}
    </>
  );
};

export default memo(ProductCard);
