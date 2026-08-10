import { Button, Card, Chip, Divider, Link, toast } from "@/components/ui";
import { Icon } from "@iconify/react";
import { FC, useEffect, useState } from "react";
import QtyInput from "./QtyInput";
import { Product, ProductVariant } from "@/types/ApiResponse";
import {
  handleAddToCart,
  makeTabClick,
  handleOfflineAddToCart,
} from "@/helpers/functionalHelpers";
import { toggleFavorite } from "@/routes/api";
import { useSettings } from "@/contexts/SettingsContext";
import AttributeSelector from "@/components/Functional/AttributeSelector";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import ProductIndicator from "@/components/Functional/ProductIndicator";
import RatingStars from "@/components/RatingStars";
import { formatDeliveryByDate } from "@/helpers/delivery";
import { getDiscountPercent } from "@/helpers/getters";

interface ProductDetailSectionProps {
  initialProduct: Product;
  onVariantChange?: (variant: ProductVariant) => void;
  onOpenModal?: () => void;
}

const ProductDetailSection: FC<ProductDetailSectionProps> = ({
  initialProduct,
  onVariantChange,
  onOpenModal,
}) => {
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(
    initialProduct?.quantity_step_size > 1
      ? initialProduct.quantity_step_size
      : initialProduct?.minimum_order_quantity || 1,
  );
  const [loading, setLoading] = useState({ buyNow: false, add: false });
  const router = useRouter();
  const { t } = useTranslation();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );

  const [isFavorited, setIsFavorited] = useState(
    Array.isArray(initialProduct.favorite) && initialProduct.favorite.length > 0,
  );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const cartCount = Number(initialProduct.item_count_in_cart) || 0;

  const {
    category = "",
    category_name = "",
    brand = "",
    brand_name = "",
    title = "",
    short_description = "",
    ratings = 0,
    rating_count = 0,
    variants,
    is_inclusive_tax,
    quantity_step_size = 1,
    minimum_order_quantity = 1,
    featured = "0",
    indicator,
    estimated_delivery_time,
    delivery_eta,
    returnable_days,
  } = initialProduct;

  const { formatPrice, systemSettings } = useSettings();
  const isOutOfStock = selectedVariant
    ? !selectedVariant.availability || selectedVariant.stock <= 0
    : false;

  const price = Number(selectedVariant?.price) || 0;
  const special = Number(selectedVariant?.special_price) || 0;
  const hasDiscount = special > 0 && special < price;
  const offPct = getDiscountPercent(price, special);

  // Stock is surfaced ONLY when it drops to/below the system low-stock limit
  // (Settings → lowStockLimit), shown as an urgency warning rather than the
  // raw count at all times.
  const lowStockLimit = Number(systemSettings?.lowStockLimit) || 0;
  const currentStock = selectedVariant?.stock ?? 0;
  const isLowStock =
    !!selectedVariant &&
    !isOutOfStock &&
    lowStockLimit > 0 &&
    currentStock <= lowStockLimit;

  // Initialize selected attributes and variant when product changes
  useEffect(() => {
    if (variants && variants.length > 0) {
      const defaultVariant = variants.find((v) => v.is_default) || variants[0];

      if (defaultVariant) {
        setSelectedVariant(defaultVariant);
        setSelectedAttributes(defaultVariant.attributes || {});
      }
    }
  }, [variants]);

  // Find variant based on selected attributes
  useEffect(() => {
    if (variants && Object.keys(selectedAttributes).length > 0) {
      const matchingVariant = variants.find((variant) => {
        return Object.entries(selectedAttributes).every(([key, value]) => {
          return variant.attributes && variant.attributes[key] === value;
        });
      });

      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
        // Reset quantity if it exceeds new variant's stock
        setQuantity((prev) => Math.min(prev, matchingVariant.stock));
        // Notify parent component about variant change
        onVariantChange?.(matchingVariant);
      }
    }
  }, [selectedAttributes, variants, onVariantChange]);

  const handleAttributeChange = (attributeSlug: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeSlug]: value,
    }));
  };

  const handleShare = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/share/products/${initialProduct.slug}`;

    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: t("share_product_text", { title }),
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: t("link_copied"), color: "success" });
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      document.getElementById("login-btn")?.click();
      toast({ title: t("please_login"), color: "warning" });
      return;
    }
    if (!selectedVariant) return;

    setIsTogglingFavorite(true);
    try {
      const res = await toggleFavorite({
        product_id: initialProduct.id,
        product_variant_id: selectedVariant.id ?? null,
        store_id: selectedVariant.store_id,
      });
      if (res.success && res.data) {
        setIsFavorited(res.data.is_favorited);
      } else {
        toast({
          title: res.message || t("something_went_wrong"),
          color: "danger",
        });
      }
    } catch {
      toast({ title: t("something_went_wrong"), color: "danger" });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const AddToCart = async (buyNow = false) => {
    setLoading({ add: !buyNow, buyNow });
    try {
      if (!selectedVariant) {
        toast({
          title: t("please_select_variant"),
          color: "warning",
        });
        return;
      }

      // Check for addons — if present, open the customization modal
      const hasAddons =
        selectedVariant.addon_groups && selectedVariant.addon_groups.length > 0;
      if (hasAddons) {
        onOpenModal?.();
        return;
      }

      // Handle offline cart when user is not logged in
      if (!isLoggedIn) {
        const res = handleOfflineAddToCart({
          product: initialProduct,
          variant: selectedVariant,
          quantity: quantity,
          renderToast: true,
        });

        if (buyNow && res?.success) {
          router.push("/cart");
        }
        return;
      }

      // Handle online cart when user is logged in
      const res = await handleAddToCart({
        product_variant_id: selectedVariant?.id || "",
        store_id: selectedVariant?.store_id || "",
        quantity: quantity,
        onClose: () => {},
        renderToast: true,
        buyNow,
      });

      if (res?.success) {
        // Re-fetch the product so item_count_in_cart updates live (no page refresh needed)
        document.getElementById("specific-product-refetch")?.click();

        if (buyNow) {
          router.push("/cart");
        }
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
    } finally {
      setLoading({ buyNow: false, add: false });
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 md:ps-4">
      {/* Category eyebrow + featured (design shows the category, e.g. "Electronics") */}
      <div className="flex flex-wrap items-center gap-2">
        {category_name ? (
          <Link
            href={`/categories/${category}`}
            className="text-xs font-semibold capitalize text-foreground/60"
          >
            {category_name}
          </Link>
        ) : (
          brand_name && (
            <Link
              href={`/brands/${brand}`}
              className="text-xs font-semibold uppercase tracking-wide text-foreground/60"
            >
              {brand_name}
            </Link>
          )
        )}
        {featured == "1" && (
          <Chip
            size="sm"
            radius="sm"
            variant="flat"
            color="secondary"
            startContent={
              <Icon icon="solar:star-bold" className="text-[11px]" />
            }
            classNames={{ content: "text-xxs font-semibold px-1" }}
          >
            {t("featured")}
          </Chip>
        )}
        {indicator && <ProductIndicator indicator={indicator} size={18} />}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold leading-snug text-foreground md:text-3xl">
        {title}
      </h1>

      {short_description && (
        <p className="text-sm text-foreground/60">{short_description}</p>
      )}

      {/* Rating stars + count */}
      {rating_count > 0 && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <RatingStars rating={ratings} size={16} />
          </span>
          <span className="text-sm font-bold text-foreground">
            {ratings} {t("ratings", "Ratings")}
          </span>
          <Link
            onPress={() => makeTabClick("reviews")}
            className="cursor-pointer text-xs text-foreground/50 md:text-sm"
          >
            {`( ${rating_count} ${t("reviews")} )`}
          </Link>
        </div>
      )}

      {cartCount > 0 && (
        <Chip
          size="sm"
          radius="sm"
          variant="flat"
          color="primary"
          startContent={
            <Icon icon="solar:cart-check-linear" className="text-sm" />
          }
          classNames={{ content: "text-xs font-semibold px-1" }}
        >
          {cartCount > 99 ? "99+" : cartCount} {t("product_modal.in_cart")}
        </Chip>
      )}

      {/* Price */}
      <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
        <span className="text-2xl font-bold text-foreground md:text-3xl">
          {formatPrice(hasDiscount ? special : price)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-sm text-foreground/50 line-through md:text-base">
              {formatPrice(price)}
            </span>
            <span className="text-sm font-bold text-success md:text-base">
              {offPct}%
            </span>
          </>
        )}
      </div>
      {is_inclusive_tax && (
        <span className="text-xs text-foreground/50">{t("inclusiveTax")}</span>
      )}

      <Divider className="my-2" />

      {/* Variant / attribute selection */}
      {variants && variants.length > 1 && initialProduct.attributes && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t("selectOptions")}
          </h3>
          <div className="flex items-center justify-between text-xxs sm:text-xs">
            <div className="flex flex-col">
              {isLowStock && (
                <span className="text-xs font-semibold text-danger">
                  {t("lowStockWarning", {
                    count: currentStock,
                    defaultValue: "Only {{count}} left in stock",
                  })}
                </span>
              )}
              {quantity_step_size > 1 ? (
                <span className="text-xs font-medium text-foreground/50">
                  {t("quantityStepSize") || "Step Size"}: {quantity_step_size}
                </span>
              ) : (
                minimum_order_quantity > 1 && (
                  <span className="text-xs font-medium text-foreground/50">
                    {t("minOrder")}: {minimum_order_quantity}
                  </span>
                )
              )}
            </div>
            {selectedVariant?.sku && (
              <span className="text-foreground/50">
                {t("sku")}: {selectedVariant.sku}
              </span>
            )}
          </div>
          {initialProduct.attributes.map((attribute) => (
            <AttributeSelector
              key={attribute.slug}
              attribute={attribute}
              selectedAttributes={selectedAttributes}
              onChange={handleAttributeChange}
            />
          ))}
        </div>
      )}

      {/* Stock and SKU info for single variant products */}
      {variants && variants.length === 1 && selectedVariant && (
        <div className="mb-1 flex items-center justify-between text-xxs sm:text-xs">
          <div className="flex flex-col">
            {isLowStock && (
              <span className="text-xs font-semibold text-danger">
                {t("lowStockWarning", {
                  count: currentStock,
                  defaultValue: "Only {{count}} left in stock",
                })}
              </span>
            )}
            {quantity_step_size > 1 ? (
              <span className="text-xs font-medium text-foreground/50">
                {t("quantityStepSize") || "Step Size"}: {quantity_step_size}
              </span>
            ) : (
              minimum_order_quantity > 1 && (
                <span className="text-xs font-medium text-foreground/50">
                  {t("minOrder")}: {minimum_order_quantity}
                </span>
              )
            )}
          </div>
          {selectedVariant.sku && (
            <span className="text-foreground/50">
              {t("sku")}: {selectedVariant.sku}
            </span>
          )}
        </div>
      )}

      {/* Quantity */}
      {!isOutOfStock && (
        <div className="flex items-center gap-3">
          <label htmlFor="qty-input" className="text-sm font-medium">
            {t("quantity")}
          </label>
          <QtyInput
            quantity={quantity}
            setQuantity={setQuantity}
            min={
              initialProduct.quantity_step_size > 1
                ? initialProduct.quantity_step_size
                : initialProduct.minimum_order_quantity || 1
            }
            step={initialProduct.quantity_step_size || 1}
            max={initialProduct.total_allowed_quantity || 9999}
            stock={selectedVariant?.stock}
          />
        </div>
      )}

      {/* Delivery estimate pill (black) — sits directly above the CTAs, matching
          the design. Only shown when the product carries a real estimated
          delivery time (minutes); no calendar date exists in the data, so we
          surface the minutes estimate rather than a fabricated "by <date>". */}
      {(() => {
        // Prefer the backend's country/zone-based window, shown as a concrete
        // "Delivery by <date>" (worst-case max day). Fall back to the
        // distance-based minutes estimate.
        const byDate = formatDeliveryByDate(delivery_eta);
        if (byDate) {
          return (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
              <Icon icon="solar:delivery-bold" className="text-sm" />
              {t("deliveryBy", "Delivery by")} {byDate}
            </span>
          );
        }
        if (estimated_delivery_time) {
          return (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
              <Icon icon="solar:delivery-bold" className="text-sm" />
              {t("deliveredIn", "Delivered in")} {estimated_delivery_time}{" "}
              {t("mins")}
            </span>
          );
        }
        return null;
      })()}

      {/* Actions */}
      {isOutOfStock ? (
        <Card
          shadow="none"
          className="border border-divider p-3"
        >
          <div className="flex items-start gap-3">
            <Icon
              icon="solar:bag-cross-linear"
              className="mt-0.5 text-2xl text-danger"
            />
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-bold text-danger">
                {t("out_of_stock")}
              </h3>
              <p className="text-xs text-foreground/50">
                {t("out_of_stock_message")}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex items-center gap-2.5">
          {/* Add To Cart — black (design), Buy Now — amber */}
          <Button
            className="flex-1 bg-foreground font-semibold text-background"
            startContent={
              !loading.add && (
                <Icon icon="solar:bag-4-linear" className="text-lg" />
              )
            }
            isLoading={loading.add}
            isDisabled={loading.buyNow}
            onPress={() => AddToCart(false)}
          >
            {t("addToBucket")}
          </Button>
          <Button
            color="primary"
            className="flex-1 font-semibold"
            isLoading={loading.buyNow}
            isDisabled={loading.add}
            onPress={() => AddToCart(true)}
          >
            {t("buyNow")}
          </Button>
          <Button
            isIconOnly
            variant="bordered"
            aria-label={t("share")}
            onPress={handleShare}
          >
            <Icon icon="solar:share-linear" className="text-xl" />
          </Button>
          <Button
            isIconOnly
            variant="bordered"
            aria-label={t("add_to_wishlist", "Add to wishlist")}
            isLoading={isTogglingFavorite}
            onPress={handleToggleFavorite}
          >
            <Icon
              icon={isFavorited ? "solar:heart-bold" : "solar:heart-linear"}
              className={isFavorited ? "text-xl text-danger" : "text-xl"}
            />
          </Button>
        </div>
      )}

      {/* Trust row — Returns · Cash on Delivery · Safe & Secure (design) */}
      {!isOutOfStock && (
        <div className="mt-1 grid grid-cols-3 divide-x divide-divider">
          <div className="flex flex-col items-center gap-1 px-1 text-center">
            <Icon
              icon="solar:refresh-square-linear"
              className="text-xl text-primary-600"
            />
            <span className="text-xxs font-medium text-foreground/70 sm:text-xs">
              {returnable_days
                ? t("daysReturn", {
                    count: returnable_days,
                    defaultValue: "{{count}} Days Return",
                  })
                : t("easyReturns", "Easy Returns")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 px-1 text-center">
            <Icon
              icon="solar:wallet-money-linear"
              className="text-xl text-primary-600"
            />
            <span className="text-xxs font-medium text-foreground/70 sm:text-xs">
              {t("cashOnDelivery", "Cash On Delivery")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 px-1 text-center">
            <Icon
              icon="solar:shield-check-linear"
              className="text-xl text-primary-600"
            />
            <span className="text-xxs font-medium text-foreground/70 sm:text-xs">
              {t("safeSecure", "Safe & Secure")}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailSection;
