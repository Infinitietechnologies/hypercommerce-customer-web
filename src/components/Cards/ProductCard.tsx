import { FC, memo, useState } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Chip,
  Button,
  Image,
  useDisclosure,
  toast,
  Tooltip,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Product } from "@/types/ApiResponse";
import { toggleFavorite } from "@/routes/api";
import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import ProductIndicator from "../Functional/ProductIndicator";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useScreenType } from "@/hooks/useScreenType";
import { useAdTracking } from "@/hooks/useAdTracking";

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});

const HTMLRenderer = dynamic(
  () => import("@/components/Functional/HTMLRenderer"),
  { ssr: false },
);

const ProductCardAddButton = dynamic(
  () => import("@/components/Cards/ProductCardAddButton"),
  { ssr: false },
);

interface ProductCardProps {
  product: Product;
  hideStoreName?: boolean;
}

/**
 * Listing card — amber redesign (Claude Design handoff
 * `src/components/ProductCard.jsx`): hover lift + image zoom, square media,
 * hairline border that turns amber on hover, brand/rating row above a
 * two-line title, then the price row.
 *
 * Divergence from the handoff, kept deliberately: the handoff card has no
 * inline add-to-bag, but the live storefront needs one (plus quick-view,
 * badges, low-stock and ad tracking), so those features stay.
 */
const ProductCard: FC<ProductCardProps> = ({
  product,
  hideStoreName = false,
}) => {
  const { formatPrice, systemSettings, isSingleVendor } = useSettings();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { variants = [], indicator = null } = product;
  const router = useRouter();
  const { t } = useTranslation();
  const screen = useScreenType();
  const { elementRef, handleAdClick } = useAdTracking(product);

  const {
    isOpen: isCartOpen,
    onOpen: onCartOpen,
    onClose: onCartClose,
  } = useDisclosure();

  const defaultVariant = variants?.find((v) => v.is_default) || variants?.[0];

  const [isFavorited, setIsFavorited] = useState(
    Array.isArray(product.favorite) && product.favorite.length > 0,
  );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const variantCombinations = (() => {
    if (!variants || variants.length <= 1) return [];

    return variants
      .slice(0, 5)
      .map((variant) => {
        const combinations: string[] = [];

        if (variant.attributes && typeof variant.attributes === "object") {
          Object.entries(variant.attributes).forEach(([key, value]) => {
            if (value) {
              combinations.push(`${key}: ${value}`);
            }
          });
        }

        if (combinations.length === 0 && variant.title) {
          return variant.title;
        }

        return combinations.join(", ");
      })
      .filter(Boolean);
  })();

  const tooltipContent = (() => {
    if (variantCombinations.length === 0) return "";

    const displayCombinations = variantCombinations.slice(0, 4);
    const hasMore = variants.length > 4;

    return (
      <div className="max-w-xs space-y-1">
        <p className="font-semibold text-xs mb-2">{t("available_options")}</p>
        {displayCombinations.map((combo, index) => (
          <p key={index} className="text-xs">
            • {combo}
          </p>
        ))}
        {hasMore && (
          <p className="text-xs italic mt-2">
            {t("more_options", { count: variants.length - 4 })}
          </p>
        )}
      </div>
    );
  })();

  if (!defaultVariant) return null;

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      const btn = document.getElementById("login-btn");
      btn?.click();
      toast({
        title: t("please_login"),
        color: "warning",
      });
      return;
    }

    if (!defaultVariant) return;

    setIsTogglingFavorite(true);
    try {
      const response = await toggleFavorite({
        product_id: product.id,
        product_variant_id: defaultVariant.id ?? null,
        store_id: defaultVariant.store_id,
      });

      if (response.success && response.data) {
        setIsFavorited(response.data.is_favorited);
      } else {
        toast({
          title: response.message || t("something_went_wrong"),
          color: "danger",
        });
      }
    } catch {
      toast({
        title: t("something_went_wrong"),
        color: "danger",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const price = Number(defaultVariant?.price) || 0;
  const specialPrice = Number(defaultVariant?.special_price) || 0;
  const hasDiscount = specialPrice > 0 && specialPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - specialPrice) / price) * 100)
    : 0;

  const lowStockLimitRaw = Number(systemSettings?.lowStockLimit);
  const lowStockLimit =
    Number.isNaN(lowStockLimitRaw) || lowStockLimitRaw <= 0
      ? null
      : lowStockLimitRaw;

  const isLowStock =
    lowStockLimit !== null &&
    defaultVariant.stock > 0 &&
    defaultVariant.stock <= lowStockLimit;

  // Check if product is featured
  const isFeatured = product.featured === "1";
  const productBadge = product.badge;
  const isOutOfStock = !defaultVariant.availability || defaultVariant.stock === 0;

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        className="h-full"
      >
        <Card
          key={product.id}
          ref={elementRef}
          as={"div"}
          className="w-full h-full border border-divider hover:border-primary transition-colors group overflow-hidden text-left"
          disableRipple
          isPressable={screen !== "mobile" ? defaultVariant.stock !== 0 : false}
          shadow="none"
          isDisabled={defaultVariant.stock === 0}
          onPress={() => {
            handleAdClick();
            router.push(`/products/${product.slug}`);
          }}
        >
          <CardBody className="p-0 overflow-hidden">
            <div className="relative aspect-square bg-gradient-to-br from-content2 to-background overflow-hidden">
              {product.main_image ? (
                <Link
                  href={`/products/${product.slug}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick();
                  }}
                  title={product.title}
                  className="block w-full h-full"
                >
                  <Image
                    alt={product.title ?? t("product_image_alt")}
                    className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${
                      product.image_fit === "cover"
                        ? "object-cover object-top"
                        : "object-contain"
                    }`}
                    src={product.main_image}
                    loading="eager"
                    removeWrapper
                    radius="none"
                  />
                </Link>
              ) : (
                <div className="w-full h-full bg-content2" />
              )}

              {/* Discount + dynamic badge — stacked top-left */}
              <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1">
                {discountPercentage > 0 && (
                  <span className="text-[11px] font-extrabold text-white bg-danger rounded-md px-2 py-0.5">
                    {t("discount", { percent: discountPercentage })}
                  </span>
                )}
                {productBadge && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold tracking-wide rounded-md"
                    style={{
                      backgroundColor: productBadge.bg_color,
                      color: productBadge.text_color,
                      borderColor: productBadge.border_color,
                      borderWidth: productBadge.border_color ? 1 : 0,
                      borderStyle: "solid",
                    }}
                    title={productBadge.label}
                  >
                    <Icon icon="solar:star-bold" className="text-[10px]" />
                    {productBadge.label}
                  </span>
                )}
              </div>

              {/* Wishlist + quick view — top-right */}
              <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  radius="full"
                  isLoading={isTogglingFavorite}
                  onPress={handleToggleFavorite}
                  className="bg-content1 shadow-sm min-w-0 w-8 h-8 hover:text-danger transition-colors"
                  title={t("pageTitle.wishlists")}
                >
                  <Icon
                    icon={isFavorited ? "solar:heart-bold" : "solar:heart-linear"}
                    className={
                      isFavorited
                        ? "text-lg text-danger"
                        : "text-lg text-default-500"
                    }
                  />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  radius="full"
                  onPress={onCartOpen}
                  className="bg-content1 shadow-sm min-w-0 w-8 h-8 hover:text-primary transition-colors"
                  title={t("quickView")}
                >
                  <Icon
                    icon="solar:eye-linear"
                    className="text-lg text-default-500"
                  />
                </Button>
              </div>

              {/* Ad badge — bottom left */}
              {product.is_sponsored && (
                <div className="absolute bottom-2 left-2 z-20">
                  <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white tracking-wider leading-none">
                      Ad
                    </span>
                  </div>
                </div>
              )}

              {/* Featured badge — bottom right */}
              {isFeatured && (
                <div className="absolute bottom-2 right-2 z-20">
                  <Chip
                    className="bg-secondary text-white font-extrabold shadow-sm tracking-wide"
                    classNames={{ base: "h-5", content: "px-1.5 text-[10px]" }}
                    radius="sm"
                    startContent={
                      <Icon icon="solar:star-bold" className="text-[10px] ml-1" />
                    }
                    title={t("featured")}
                  >
                    {t("featured")}
                  </Chip>
                </div>
              )}
            </div>
          </CardBody>

          <CardFooter className="flex-col items-stretch gap-1 px-4 py-3.5">
            {/* Store / rating row */}
            <div className="flex items-center justify-between gap-2 min-h-4">
              {product.variants?.[0]?.store_name &&
              !hideStoreName &&
              !isSingleVendor ? (
                <Link
                  href={`/stores/${product.variants?.[0]?.store_slug}`}
                  className="text-xs font-extrabold text-default-500 truncate"
                  onClick={(e) => e.stopPropagation()}
                  title={product.variants[0].store_name}
                >
                  {product.variants[0].store_name}
                </Link>
              ) : (
                <span />
              )}

              {product.ratings !== undefined && (
                <span className="flex items-center gap-1 text-xs font-extrabold shrink-0">
                  <Icon icon="solar:star-bold" className="text-sm text-primary" />
                  {Number(product.ratings).toFixed(1)}
                  <span className="text-default-400 font-medium">
                    ({product.rating_count ?? 0})
                  </span>
                </span>
              )}
            </div>

            {/* Title */}
            <div className="flex flex-col">
              <div className="flex items-start gap-0">
                <ProductIndicator indicator={indicator} size={12} />
                <Link
                  href={`/products/${product.slug}`}
                  className={`text-sm font-medium leading-snug ${isLowStock ? "line-clamp-1 min-h-5" : "line-clamp-2 min-h-[2.5rem]"}`}
                  title={product.title}
                  onClick={handleAdClick}
                >
                  {product.title ?? t("untitled_product")}
                </Link>
              </div>
              {isLowStock && (
                <span className="text-xxs text-warning font-semibold whitespace-nowrap max-h-4">
                  {t("product_modal.low_stock_alert", {
                    stock: defaultVariant.stock,
                  })}
                </span>
              )}
            </div>

            <HTMLRenderer
              html={product.description ?? ""}
              className="text-xxs text-foreground/50 line-clamp-2 min-h-6 hidden"
            />

            {/* Delivery estimate + variant choices */}
            <div className="flex w-full items-center justify-between gap-2">
              <span
                title={`${product.estimated_delivery_time} ${t("mins")}`}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-100/60 rounded-md px-1.5 py-0.5"
              >
                <Icon icon="solar:clock-circle-linear" className="text-[11px]" />
                {`${product.estimated_delivery_time} ${t("mins")}`}
              </span>
              {product.variants.length > 1 && (
                <Tooltip
                  content={tooltipContent}
                  placement="top"
                  delay={300}
                  closeDelay={0}
                  classNames={{
                    content:
                      "bg-content1 border border-divider shadow-lg py-2 px-3",
                  }}
                >
                  <span className="text-[10px] font-bold text-default-500 bg-content2 py-0.5 px-1.5 rounded-md">
                    {t("choices", { count: product.variants.length })}
                  </span>
                </Tooltip>
              )}
            </div>

            {/* Price + add to bag */}
            <div className="flex items-end justify-between gap-2 mt-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold leading-none">
                  {formatPrice(hasDiscount ? specialPrice : price)}
                </span>
                {hasDiscount && (
                  <span className="text-[13px] text-default-400 line-through">
                    {formatPrice(price)}
                  </span>
                )}
              </div>

              {isOutOfStock ? (
                <span className="text-danger font-bold text-xs whitespace-nowrap">
                  {t("out_of_stock")}
                </span>
              ) : (
                <ProductCardAddButton
                  product={product}
                  defaultVariant={defaultVariant}
                  onOpenModal={onCartOpen}
                />
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {isCartOpen && (
        <ProductModal
          isOpen={isCartOpen}
          onClose={onCartClose}
          product={product}
        />
      )}
    </>
  );
};

export default memo(ProductCard);
